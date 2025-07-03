import { BasePlatformScraper } from './base-scraper';

export interface PlatformConfig {
  enabled: boolean;
  maxRequestsPerHour: number;
  priority: 'high' | 'medium' | 'low';
  searchConfig: {
    defaultPages: number;
    resultsPerPage?: number;
    categories?: string[];
  };
  auth?: {
    required: boolean;
    type: 'cookie' | 'oauth' | 'credentials';
  };
  features: {
    hasGallery: boolean;
    hasPhoneReveal: boolean;
    hasDetailApi: boolean;
    hasVirtualTours?: boolean;
  };
  rateLimit?: {
    requestDelay: number;
    errorBackoff: number;
    maxRetries: number;
  };
}

export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private scrapers = new Map<string, BasePlatformScraper>();
  private configs = new Map<string, PlatformConfig>();
  
  private constructor() {}
  
  static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }
  
  /**
   * Register a new platform scraper
   */
  register(scraper: BasePlatformScraper, config?: PlatformConfig): void {
    if (this.scrapers.has(scraper.platform)) {
      console.warn(`Platform ${scraper.platform} is already registered. Overwriting...`);
    }
    
    this.scrapers.set(scraper.platform, scraper);
    
    // Set default config if not provided
    if (config) {
      this.configs.set(scraper.platform, config);
    } else {
      this.configs.set(scraper.platform, this.getDefaultConfig());
    }
    
    console.log(`✅ Registered platform: ${scraper.platform}`);
  }
  
  /**
   * Get a scraper for a specific platform
   */
  getScraper(platform: string): BasePlatformScraper {
    const scraper = this.scrapers.get(platform);
    if (!scraper) {
      throw new Error(`Unknown platform: ${platform}. Available platforms: ${this.getAllPlatforms().join(', ')}`);
    }
    
    const config = this.configs.get(platform);
    if (config && !config.enabled) {
      throw new Error(`Platform ${platform} is currently disabled`);
    }
    
    return scraper;
  }
  
  /**
   * Get all registered platform names
   */
  getAllPlatforms(): string[] {
    return Array.from(this.scrapers.keys());
  }
  
  /**
   * Get all enabled platforms
   */
  getEnabledPlatforms(): string[] {
    return this.getAllPlatforms().filter(platform => {
      const config = this.configs.get(platform);
      return config ? config.enabled : true;
    });
  }
  
  /**
   * Get platforms by priority
   */
  getPlatformsByPriority(priority: 'high' | 'medium' | 'low'): string[] {
    return this.getEnabledPlatforms().filter(platform => {
      const config = this.configs.get(platform);
      return config && config.priority === priority;
    });
  }
  
  /**
   * Get configuration for a platform
   */
  getConfig(platform: string): PlatformConfig | undefined {
    return this.configs.get(platform);
  }
  
  /**
   * Update configuration for a platform
   */
  updateConfig(platform: string, config: Partial<PlatformConfig>): void {
    const existingConfig = this.configs.get(platform);
    if (!existingConfig) {
      throw new Error(`No configuration found for platform: ${platform}`);
    }
    
    this.configs.set(platform, { ...existingConfig, ...config });
    console.log(`📝 Updated configuration for platform: ${platform}`);
  }
  
  /**
   * Enable or disable a platform
   */
  setPlatformEnabled(platform: string, enabled: boolean): void {
    const config = this.configs.get(platform);
    if (!config) {
      throw new Error(`No configuration found for platform: ${platform}`);
    }
    
    config.enabled = enabled;
    console.log(`${enabled ? '✅' : '❌'} Platform ${platform} is now ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get rate limit info for a platform
   */
  getRateLimit(platform: string): { requestsPerHour: number; delayMs: number } {
    const config = this.configs.get(platform);
    if (!config) {
      return { requestsPerHour: 60, delayMs: 3000 };
    }
    
    const requestsPerHour = config.maxRequestsPerHour;
    const delayMs = config.rateLimit?.requestDelay || (3600000 / requestsPerHour);
    
    return { requestsPerHour, delayMs };
  }
  
  /**
   * Get all platforms that support a specific feature
   */
  getPlatformsWithFeature(feature: keyof PlatformConfig['features']): string[] {
    return this.getEnabledPlatforms().filter(platform => {
      const config = this.configs.get(platform);
      return config && config.features[feature];
    });
  }
  
  /**
   * Load configuration from JSON file
   */
  async loadConfigFromFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const configs = JSON.parse(content) as Record<string, PlatformConfig>;
      
      for (const [platform, config] of Object.entries(configs)) {
        if (this.scrapers.has(platform)) {
          this.configs.set(platform, config);
          console.log(`📋 Loaded config for ${platform} from file`);
        } else {
          console.warn(`⚠️  Config found for unregistered platform: ${platform}`);
        }
      }
    } catch (error) {
      console.error('Failed to load platform configs:', error);
    }
  }
  
  /**
   * Save current configuration to JSON file
   */
  async saveConfigToFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const configs: Record<string, PlatformConfig> = {};
      
      for (const [platform, config] of this.configs.entries()) {
        configs[platform] = config;
      }
      
      await fs.writeFile(filePath, JSON.stringify(configs, null, 2));
      console.log(`💾 Saved platform configs to ${filePath}`);
    } catch (error) {
      console.error('Failed to save platform configs:', error);
    }
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(): PlatformConfig {
    return {
      enabled: true,
      maxRequestsPerHour: 60,
      priority: 'medium',
      searchConfig: {
        defaultPages: 5,
        resultsPerPage: 20
      },
      auth: {
        required: false,
        type: 'cookie'
      },
      features: {
        hasGallery: true,
        hasPhoneReveal: false,
        hasDetailApi: false
      },
      rateLimit: {
        requestDelay: 3000,
        errorBackoff: 5000,
        maxRetries: 3
      }
    };
  }
  
  /**
   * Get scraper statistics
   */
  async getStats(): Promise<{
    totalPlatforms: number;
    enabledPlatforms: number;
    platformStats: Array<{
      platform: string;
      enabled: boolean;
      priority: string;
      requestsPerHour: number;
    }>;
  }> {
    const stats = {
      totalPlatforms: this.scrapers.size,
      enabledPlatforms: this.getEnabledPlatforms().length,
      platformStats: [] as any[]
    };
    
    for (const [platform, config] of this.configs.entries()) {
      stats.platformStats.push({
        platform,
        enabled: config.enabled,
        priority: config.priority,
        requestsPerHour: config.maxRequestsPerHour
      });
    }
    
    return stats;
  }
}

// Export singleton instance
export const platformRegistry = PlatformRegistry.getInstance();