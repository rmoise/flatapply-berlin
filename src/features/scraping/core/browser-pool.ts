import { Browser, BrowserContext, Page, chromium, firefox, webkit, BrowserType } from 'playwright';
import { EventEmitter } from 'events';

export interface BrowserConfig {
  type: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  args?: string[];
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
  timezoneId?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
}

export interface BrowserInstance {
  id: string;
  platform: string;
  browser: Browser;
  context: BrowserContext;
  isAuthenticated: boolean;
  activePages: number;
  createdAt: Date;
  lastUsedAt: Date;
  errorCount: number;
  metadata: Record<string, any>;
}

export interface PoolConfig {
  maxBrowsersPerPlatform: number;
  maxPagesPerBrowser: number;
  maxTotalBrowsers: number;
  sessionTimeout: number;         // ms before closing idle browser
  authSessionLifetime: number;    // ms before re-authenticating
  reuseAuthenticated: boolean;
  cleanupInterval: number;        // ms between cleanup runs
  resourceLimits: {
    maxMemoryMB: number;
    maxCpuPercent: number;
  };
}

export interface PageRequest {
  platform: string;
  requiresAuth: boolean;
  priority: number;
  timeout?: number;
}

/**
 * Efficient browser pool manager for multi-platform scraping
 */
export class BrowserPool extends EventEmitter {
  private static instance: BrowserPool;
  private pools = new Map<string, BrowserInstance[]>();
  private waitingRequests = new Map<string, Array<(instance: BrowserInstance) => void>>();
  private totalBrowsers = 0;
  private cleanupTimer?: NodeJS.Timer;
  
  private config: PoolConfig = {
    maxBrowsersPerPlatform: 2,
    maxPagesPerBrowser: 5,
    maxTotalBrowsers: 10,
    sessionTimeout: 30 * 60 * 1000,      // 30 minutes
    authSessionLifetime: 2 * 60 * 60 * 1000, // 2 hours
    reuseAuthenticated: true,
    cleanupInterval: 5 * 60 * 1000,     // 5 minutes
    resourceLimits: {
      maxMemoryMB: 2048,
      maxCpuPercent: 80
    }
  };
  
  private browserConfigs = new Map<string, BrowserConfig>();
  
  private constructor() {
    super();
    this.startCleanupTimer();
  }
  
  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }
  
  /**
   * Configure the browser pool
   */
  configure(config: Partial<PoolConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📊 Browser pool configured:', this.config);
  }
  
  /**
   * Set browser configuration for a specific platform
   */
  setBrowserConfig(platform: string, config: BrowserConfig): void {
    this.browserConfigs.set(platform, config);
  }
  
  /**
   * Acquire a browser instance for a platform
   */
  async acquire(request: PageRequest): Promise<{ instance: BrowserInstance; page: Page }> {
    const { platform, requiresAuth, priority } = request;
    
    console.log(`🌐 Browser requested for ${platform} (auth: ${requiresAuth})`);
    
    // Try to find available browser
    const available = await this.findAvailableBrowser(platform, requiresAuth);
    if (available) {
      return await this.createPageFromInstance(available);
    }
    
    // Check if we can create new browser
    if (this.canCreateNewBrowser(platform)) {
      const instance = await this.createNewBrowser(platform);
      return await this.createPageFromInstance(instance);
    }
    
    // Wait for available browser
    console.log(`⏳ Waiting for available browser for ${platform}...`);
    return await this.waitForAvailable(platform, priority);
  }
  
  /**
   * Release a page back to the pool
   */
  async release(instance: BrowserInstance, page: Page): Promise<void> {
    try {
      await page.close();
      instance.activePages--;
      instance.lastUsedAt = new Date();
      
      console.log(`📤 Released page for ${instance.platform} (active: ${instance.activePages})`);
      
      // Process waiting requests
      this.processWaitingRequests(instance.platform);
      
    } catch (error) {
      console.error('Error releasing page:', error);
      instance.errorCount++;
      
      // If too many errors, close the browser
      if (instance.errorCount > 5) {
        await this.closeBrowser(instance);
      }
    }
  }
  
  /**
   * Mark a browser instance as authenticated
   */
  async markAuthenticated(instance: BrowserInstance, metadata?: Record<string, any>): Promise<void> {
    instance.isAuthenticated = true;
    instance.metadata = { ...instance.metadata, ...metadata, authTime: new Date() };
    console.log(`🔐 Browser authenticated for ${instance.platform}`);
  }
  
  /**
   * Get pool statistics
   */
  getStats(): {
    totalBrowsers: number;
    byPlatform: Record<string, {
      browsers: number;
      authenticated: number;
      activePages: number;
      waiting: number;
    }>;
  } {
    const stats = {
      totalBrowsers: this.totalBrowsers,
      byPlatform: {} as any
    };
    
    for (const [platform, instances] of this.pools.entries()) {
      stats.byPlatform[platform] = {
        browsers: instances.length,
        authenticated: instances.filter(i => i.isAuthenticated).length,
        activePages: instances.reduce((sum, i) => sum + i.activePages, 0),
        waiting: this.waitingRequests.get(platform)?.length || 0
      };
    }
    
    return stats;
  }
  
  /**
   * Close all browsers and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down browser pool...');
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    const closePromises: Promise<void>[] = [];
    
    for (const instances of this.pools.values()) {
      for (const instance of instances) {
        closePromises.push(this.closeBrowser(instance));
      }
    }
    
    await Promise.all(closePromises);
    
    this.pools.clear();
    this.waitingRequests.clear();
    this.totalBrowsers = 0;
    
    console.log('✅ Browser pool shutdown complete');
  }
  
  // Private methods
  
  private async findAvailableBrowser(platform: string, requiresAuth: boolean): Promise<BrowserInstance | null> {
    const instances = this.pools.get(platform) || [];
    
    // Sort by priority: authenticated first (if required), then least active pages
    const sorted = instances
      .filter(i => !requiresAuth || i.isAuthenticated)
      .filter(i => i.activePages < this.config.maxPagesPerBrowser)
      .sort((a, b) => {
        if (requiresAuth && a.isAuthenticated !== b.isAuthenticated) {
          return a.isAuthenticated ? -1 : 1;
        }
        return a.activePages - b.activePages;
      });
    
    return sorted[0] || null;
  }
  
  private canCreateNewBrowser(platform: string): boolean {
    const platformInstances = this.pools.get(platform)?.length || 0;
    
    return (
      this.totalBrowsers < this.config.maxTotalBrowsers &&
      platformInstances < this.config.maxBrowsersPerPlatform
    );
  }
  
  private async createNewBrowser(platform: string): Promise<BrowserInstance> {
    console.log(`🚀 Creating new browser for ${platform}...`);
    
    const config = this.browserConfigs.get(platform) || this.getDefaultBrowserConfig();
    const browserType = this.getBrowserType(config.type);
    
    const browser = await browserType.launch({
      headless: config.headless,
      args: config.args
    });
    
    const contextOptions: any = {
      viewport: config.viewport,
      userAgent: config.userAgent,
      locale: config.locale,
      timezoneId: config.timezoneId
    };
    
    if (config.proxy) {
      contextOptions.proxy = config.proxy;
    }
    
    const context = await browser.newContext(contextOptions);
    
    const instance: BrowserInstance = {
      id: `${platform}-${Date.now()}`,
      platform,
      browser,
      context,
      isAuthenticated: false,
      activePages: 0,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      errorCount: 0,
      metadata: {}
    };
    
    // Add to pool
    if (!this.pools.has(platform)) {
      this.pools.set(platform, []);
    }
    this.pools.get(platform)!.push(instance);
    this.totalBrowsers++;
    
    this.emit('browserCreated', { platform, instanceId: instance.id });
    
    return instance;
  }
  
  private async createPageFromInstance(instance: BrowserInstance): Promise<{ instance: BrowserInstance; page: Page }> {
    const page = await instance.context.newPage();
    instance.activePages++;
    instance.lastUsedAt = new Date();
    
    // Set up common page configurations
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);
    
    // Add stealth scripts
    await this.addStealthScripts(page);
    
    return { instance, page };
  }
  
  private async waitForAvailable(platform: string, priority: number): Promise<{ instance: BrowserInstance; page: Page }> {
    return new Promise((resolve) => {
      const waiting = this.waitingRequests.get(platform) || [];
      
      // Insert based on priority
      const insertIndex = waiting.findIndex(w => (w as any).priority < priority);
      const resolver = async (instance: BrowserInstance) => {
        const result = await this.createPageFromInstance(instance);
        resolve(result);
      };
      (resolver as any).priority = priority;
      
      if (insertIndex === -1) {
        waiting.push(resolver);
      } else {
        waiting.splice(insertIndex, 0, resolver);
      }
      
      this.waitingRequests.set(platform, waiting);
    });
  }
  
  private processWaitingRequests(platform: string): void {
    const waiting = this.waitingRequests.get(platform);
    if (!waiting || waiting.length === 0) return;
    
    const available = this.pools.get(platform)?.find(i => 
      i.activePages < this.config.maxPagesPerBrowser
    );
    
    if (available && waiting.length > 0) {
      const resolver = waiting.shift()!;
      resolver(available);
      
      if (waiting.length === 0) {
        this.waitingRequests.delete(platform);
      }
    }
  }
  
  private async closeBrowser(instance: BrowserInstance): Promise<void> {
    try {
      await instance.context.close();
      await instance.browser.close();
      
      // Remove from pool
      const platformPool = this.pools.get(instance.platform);
      if (platformPool) {
        const index = platformPool.indexOf(instance);
        if (index > -1) {
          platformPool.splice(index, 1);
        }
        
        if (platformPool.length === 0) {
          this.pools.delete(instance.platform);
        }
      }
      
      this.totalBrowsers--;
      this.emit('browserClosed', { platform: instance.platform, instanceId: instance.id });
      
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
  
  private async addStealthScripts(page: Page): Promise<void> {
    // Add stealth scripts to avoid detection
    await page.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Add chrome object
      if (!window.chrome) {
        (window as any).chrome = {
          runtime: {},
          loadTimes: () => {},
          csi: () => {}
        };
      }
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: 'denied' } as PermissionStatus);
        }
        return originalQuery(parameters);
      };
    });
  }
  
  private getBrowserType(type: 'chromium' | 'firefox' | 'webkit'): BrowserType {
    switch (type) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }
  
  private getDefaultBrowserConfig(): BrowserConfig {
    return {
      type: 'chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ],
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const closePromises: Promise<void>[] = [];
    
    for (const [platform, instances] of this.pools.entries()) {
      for (const instance of instances) {
        // Close idle browsers
        if (instance.activePages === 0 && 
            now - instance.lastUsedAt.getTime() > this.config.sessionTimeout) {
          console.log(`🧹 Closing idle browser for ${platform}`);
          closePromises.push(this.closeBrowser(instance));
        }
        
        // Re-authenticate if needed
        if (instance.isAuthenticated && instance.metadata.authTime) {
          const authAge = now - new Date(instance.metadata.authTime).getTime();
          if (authAge > this.config.authSessionLifetime) {
            instance.isAuthenticated = false;
            console.log(`🔄 Auth expired for ${platform} browser`);
          }
        }
      }
    }
    
    await Promise.all(closePromises);
  }
}

// Export singleton
export const browserPool = BrowserPool.getInstance();