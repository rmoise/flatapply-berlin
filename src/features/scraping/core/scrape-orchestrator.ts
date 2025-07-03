import { EventEmitter } from 'events';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { platformRegistry } from './platform-registry';
import { browserPool, BrowserPool } from './browser-pool';
import { UniversalScrapingQueue } from './scraping-queue';
import { UniversalMatchEngine } from './match-engine';
import { UniversalListing, QueueItem, ScrapeStats } from './models';
import { BasePlatformScraper } from './base-scraper';

export interface OrchestratorConfig {
  maxConcurrentPlatforms: number;
  maxConcurrentPages: number;
  batchSize: number;
  discoveryInterval: number;      // Minutes between discovery runs
  updateInterval: number;         // Minutes between update runs
  healthCheckInterval: number;    // Minutes between health checks
  enableAutoDiscovery: boolean;
  enableAutoMatching: boolean;
  enableAutoCleanup: boolean;
}

export interface OrchestratorStats {
  startTime: Date;
  totalListingsProcessed: number;
  totalMatchesCreated: number;
  platformStats: Record<string, {
    processed: number;
    successful: number;
    failed: number;
    averageTime: number;
  }>;
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
  };
  browserStats: {
    active: number;
    authenticated: number;
  };
  errors: Array<{
    platform: string;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * Master orchestrator that coordinates all scraping activities
 */
export class ScrapeOrchestrator extends EventEmitter {
  private supabase: SupabaseClient;
  private queue: UniversalScrapingQueue;
  private matchEngine: UniversalMatchEngine;
  private isRunning = false;
  private stats: OrchestratorStats;
  
  private discoveryTimer?: NodeJS.Timer;
  private updateTimer?: NodeJS.Timer;
  private healthCheckTimer?: NodeJS.Timer;
  
  private config: OrchestratorConfig = {
    maxConcurrentPlatforms: 3,
    maxConcurrentPages: 10,
    batchSize: 50,
    discoveryInterval: 30,      // 30 minutes
    updateInterval: 60,         // 1 hour
    healthCheckInterval: 5,     // 5 minutes
    enableAutoDiscovery: true,
    enableAutoMatching: true,
    enableAutoCleanup: true
  };
  
  constructor(
    supabaseUrl: string, 
    supabaseKey: string, 
    config?: Partial<OrchestratorConfig>
  ) {
    super();
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.queue = new UniversalScrapingQueue(supabaseUrl, supabaseKey);
    this.matchEngine = new UniversalMatchEngine(supabaseUrl, supabaseKey);
    
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.stats = this.initializeStats();
    
    // Configure browser pool
    browserPool.configure({
      maxBrowsersPerPlatform: Math.ceil(this.config.maxConcurrentPages / 3),
      maxTotalBrowsers: this.config.maxConcurrentPages
    });
  }
  
  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Orchestrator is already running');
      return;
    }
    
    console.log('🚀 Starting Scrape Orchestrator...');
    this.isRunning = true;
    this.stats = this.initializeStats();
    
    // Start timers
    if (this.config.enableAutoDiscovery) {
      this.startDiscoveryTimer();
    }
    
    this.startUpdateTimer();
    this.startHealthCheckTimer();
    
    // Initial run
    await this.runDiscovery();
    await this.runUpdate();
    
    this.emit('started', { config: this.config });
  }
  
  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Scrape Orchestrator...');
    this.isRunning = false;
    
    // Clear timers
    if (this.discoveryTimer) clearInterval(this.discoveryTimer);
    if (this.updateTimer) clearInterval(this.updateTimer);
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    
    // Shutdown browser pool
    await browserPool.shutdown();
    
    this.emit('stopped', { stats: this.stats });
  }
  
  /**
   * Run discovery for all enabled platforms
   */
  async runDiscovery(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('🔍 Running discovery for all platforms...');
    const startTime = Date.now();
    
    try {
      // Get enabled platforms
      const platforms = platformRegistry.getEnabledPlatforms();
      
      // Enqueue discovery URLs for each platform
      for (const platform of platforms) {
        const scraper = platformRegistry.getScraper(platform);
        const searchUrl = await scraper.buildSearchUrl({}, 1);
        
        await this.queue.enqueue([{
          platform,
          url: searchUrl,
          priority: 1000,
          dataNeeded: {
            basic: true,
            description: false,
            contact: false,
            images: false,
            amenities: false
          },
          metadata: { type: 'discovery', page: 1 }
        }]);
      }
      
      console.log(`✅ Discovery enqueued for ${platforms.length} platforms`);
      this.emit('discoveryCompleted', { 
        platforms: platforms.length,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      this.logError('discovery', error);
    }
  }
  
  /**
   * Run update cycle - process queue items
   */
  async runUpdate(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('🔄 Running update cycle...');
    const cycleStart = Date.now();
    
    try {
      // Get items grouped by platform
      const itemsByPlatform = await this.queue.getByPlatform();
      
      if (itemsByPlatform.size === 0) {
        console.log('📭 No items in queue');
        return;
      }
      
      console.log(`📋 Processing ${this.getTotalItems(itemsByPlatform)} items across ${itemsByPlatform.size} platforms`);
      
      // Process platforms concurrently (with limit)
      const results = await this.processPlatformsConcurrently(itemsByPlatform);
      
      // Handle results
      const processedListings = await this.handleResults(results);
      
      // Create matches for new listings
      if (this.config.enableAutoMatching && processedListings.new.length > 0) {
        await this.createMatches(processedListings.new);
      }
      
      // Update stats
      this.updateStats(results);
      
      // Cleanup if enabled
      if (this.config.enableAutoCleanup) {
        await this.performCleanup();
      }
      
      const duration = Date.now() - cycleStart;
      console.log(`✅ Update cycle completed in ${Math.round(duration / 1000)}s`);
      
      this.emit('updateCompleted', {
        processed: processedListings.total,
        new: processedListings.new.length,
        updated: processedListings.updated.length,
        duration
      });
      
    } catch (error) {
      console.error('❌ Update cycle failed:', error);
      this.logError('update', error);
    }
  }
  
  /**
   * Process platforms concurrently with limits
   */
  private async processPlatformsConcurrently(
    itemsByPlatform: Map<string, QueueItem[]>
  ): Promise<Map<string, any[]>> {
    const results = new Map<string, any[]>();
    const platformEntries = Array.from(itemsByPlatform.entries());
    
    // Process in batches
    for (let i = 0; i < platformEntries.length; i += this.config.maxConcurrentPlatforms) {
      const batch = platformEntries.slice(i, i + this.config.maxConcurrentPlatforms);
      
      const batchPromises = batch.map(async ([platform, items]) => {
        try {
          const platformResults = await this.processPlatformItems(platform, items);
          results.set(platform, platformResults);
        } catch (error) {
          console.error(`❌ Failed to process ${platform}:`, error);
          this.logError(platform, error);
          results.set(platform, []);
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    return results;
  }
  
  /**
   * Process items for a specific platform
   */
  private async processPlatformItems(platform: string, items: QueueItem[]): Promise<any[]> {
    console.log(`\n🔧 Processing ${platform} (${items.length} items)...`);
    
    const scraper = platformRegistry.getScraper(platform);
    const results = [];
    
    // Get browser instance for this platform
    const { instance: browserInstance, page } = await browserPool.acquire({
      platform,
      requiresAuth: true,
      priority: 100
    });
    
    try {
      // Handle authentication if needed
      if (!browserInstance.isAuthenticated) {
        const authSuccess = await scraper.handlePlatformSpecificAuth(page);
        if (authSuccess) {
          await browserPool.markAuthenticated(browserInstance);
        }
      }
      
      // Process each item
      for (const item of items) {
        const itemStart = Date.now();
        
        try {
          console.log(`  📄 ${item.url.substring(0, 60)}...`);
          
          // Navigate to URL
          await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          
          // Check for CAPTCHA
          if (await scraper.detectCaptcha(page)) {
            console.log('  🤖 CAPTCHA detected, skipping...');
            await this.queue.markFailed(item.id, 'CAPTCHA detected');
            continue;
          }
          
          // Handle based on item type
          let result;
          if (item.metadata?.type === 'discovery') {
            // Extract listing URLs from search page
            result = await this.handleDiscoveryPage(scraper, page, platform);
          } else {
            // Extract detailed data from listing page
            result = await this.handleDetailPage(scraper, page, item);
          }
          
          if (result) {
            results.push(result);
            await this.queue.markCompleted(item.id, {
              itemId: item.id,
              success: true,
              data: result,
              duration: Date.now() - itemStart
            });
          }
          
        } catch (error) {
          console.error(`  ❌ Error: ${error.message}`);
          await this.queue.markFailed(item.id, error.message);
        }
        
        // Rate limiting
        await this.delay(platform);
      }
      
    } finally {
      await browserPool.release(browserInstance, page);
    }
    
    return results;
  }
  
  /**
   * Handle discovery page - extract listings and enqueue them
   */
  private async handleDiscoveryPage(
    scraper: BasePlatformScraper, 
    page: any, 
    platform: string
  ): Promise<any> {
    const listings = await scraper.extractListingsFromSearchPage(page);
    console.log(`  ✅ Found ${listings.length} listings`);
    
    // Enqueue listings for detail extraction
    const queueItems = listings.map(listing => ({
      platform,
      url: listing.url,
      priority: 500,
      dataNeeded: {
        basic: false,
        description: true,
        contact: true,
        images: true,
        amenities: true
      },
      metadata: { 
        externalId: listing.externalId,
        title: listing.title
      }
    }));
    
    await this.queue.enqueue(queueItems);
    
    return { type: 'discovery', listingsFound: listings.length };
  }
  
  /**
   * Handle detail page - extract full listing data
   */
  private async handleDetailPage(
    scraper: BasePlatformScraper,
    page: any,
    item: QueueItem
  ): Promise<UniversalListing | null> {
    const detailedData = await scraper.extractDetailPageData(page, item.url);
    
    if (!detailedData) {
      console.log('  ⚠️  No data extracted');
      return null;
    }
    
    // Convert to universal format
    const universalListing = (scraper as any).toUniversalListing(detailedData);
    
    console.log(`  ✅ Extracted: ${detailedData.title.substring(0, 40)}...`);
    return universalListing;
  }
  
  /**
   * Handle scraping results - save to database
   */
  private async handleResults(results: Map<string, any[]>): Promise<{
    total: number;
    new: UniversalListing[];
    updated: UniversalListing[];
  }> {
    const processed = { total: 0, new: [] as UniversalListing[], updated: [] as UniversalListing[] };
    
    for (const [platform, platformResults] of results.entries()) {
      for (const result of platformResults) {
        if (result.type === 'discovery') continue;
        
        try {
          const saved = await this.saveListing(result);
          processed.total++;
          
          if (saved.isNew) {
            processed.new.push(saved.listing);
          } else {
            processed.updated.push(saved.listing);
          }
          
        } catch (error) {
          console.error('Failed to save listing:', error);
        }
      }
    }
    
    return processed;
  }
  
  /**
   * Save listing to database
   */
  private async saveListing(listing: UniversalListing): Promise<{
    isNew: boolean;
    listing: UniversalListing;
  }> {
    // Check if exists
    const { data: existing } = await this.supabase
      .from('listings')
      .select('id, updated_at')
      .eq('platform', listing.platform)
      .eq('external_id', listing.externalId)
      .single();
    
    const listingData = {
      platform: listing.platform,
      external_id: listing.externalId,
      url: listing.url,
      title: listing.title,
      description: listing.description,
      price: listing.costs.totalRent,
      size_sqm: listing.size,
      rooms: listing.rooms,
      district: listing.location.district,
      address: listing.location.address,
      available_from: listing.availability.from?.toISOString(),
      available_to: listing.availability.to?.toISOString(),
      contact_name: listing.contact.name,
      contact_phone: listing.contact.phone,
      contact_email: listing.contact.email,
      images: listing.media.images,
      amenities: listing.amenities,
      platform_data: listing.platformData,
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      // Update
      await this.supabase
        .from('listings')
        .update(listingData)
        .eq('id', existing.id);
      
      listing.id = existing.id;
      return { isNew: false, listing };
    } else {
      // Insert
      const { data: newListing } = await this.supabase
        .from('listings')
        .insert({
          ...listingData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      listing.id = newListing.id;
      return { isNew: true, listing };
    }
  }
  
  /**
   * Create matches for new listings
   */
  private async createMatches(listings: UniversalListing[]): Promise<void> {
    console.log(`\n🔗 Creating matches for ${listings.length} new listings...`);
    
    const matchStats = await this.matchEngine.createMatches(listings);
    
    this.stats.totalMatchesCreated += matchStats.totalMatches;
    
    console.log(`✅ Created ${matchStats.totalMatches} matches`);
  }
  
  /**
   * Perform cleanup tasks
   */
  private async performCleanup(): Promise<void> {
    // Clean old queue items
    await this.queue.cleanup(7);
    
    // Check for stale listings
    const staleCount = await this.queue.enqueueStaleListings();
    if (staleCount > 0) {
      console.log(`📅 Enqueued ${staleCount} stale listings for update`);
    }
    
    // Check for incomplete listings
    const incompleteCount = await this.queue.enqueueMissingData();
    if (incompleteCount > 0) {
      console.log(`🔍 Enqueued ${incompleteCount} listings with missing data`);
    }
  }
  
  /**
   * Health check
   */
  private async performHealthCheck(): Promise<void> {
    const queueStats = await this.queue.getStats();
    const poolStats = browserPool.getStats();
    
    // Check queue health
    if (queueStats.failed > queueStats.completed * 0.5) {
      console.warn('⚠️  High failure rate detected in queue');
      this.emit('healthWarning', { type: 'queue', stats: queueStats });
    }
    
    // Check browser pool health
    if (poolStats.totalBrowsers === 0 && queueStats.pending > 0) {
      console.warn('⚠️  No browsers available but items pending');
      this.emit('healthWarning', { type: 'browsers', stats: poolStats });
    }
    
    // Check for stuck items
    if (queueStats.processing > 0) {
      // Items processing for too long
      console.warn(`⚠️  ${queueStats.processing} items stuck in processing`);
    }
  }
  
  // Timer management
  
  private startDiscoveryTimer(): void {
    this.discoveryTimer = setInterval(() => {
      this.runDiscovery();
    }, this.config.discoveryInterval * 60 * 1000);
  }
  
  private startUpdateTimer(): void {
    this.updateTimer = setInterval(() => {
      this.runUpdate();
    }, this.config.updateInterval * 60 * 1000);
  }
  
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval * 60 * 1000);
  }
  
  // Utility methods
  
  private async delay(platform: string): Promise<void> {
    const rateLimit = platformRegistry.getRateLimit(platform);
    await new Promise(resolve => setTimeout(resolve, rateLimit.delayMs));
  }
  
  private getTotalItems(itemsByPlatform: Map<string, QueueItem[]>): number {
    let total = 0;
    for (const items of itemsByPlatform.values()) {
      total += items.length;
    }
    return total;
  }
  
  private updateStats(results: Map<string, any[]>): void {
    for (const [platform, platformResults] of results.entries()) {
      if (!this.stats.platformStats[platform]) {
        this.stats.platformStats[platform] = {
          processed: 0,
          successful: 0,
          failed: 0,
          averageTime: 0
        };
      }
      
      const stats = this.stats.platformStats[platform];
      stats.processed += platformResults.length;
      stats.successful += platformResults.filter(r => r && r.type !== 'error').length;
      stats.failed += platformResults.filter(r => !r || r.type === 'error').length;
    }
    
    this.stats.totalListingsProcessed = Object.values(this.stats.platformStats)
      .reduce((sum, s) => sum + s.processed, 0);
  }
  
  private logError(context: string, error: any): void {
    this.stats.errors.push({
      platform: context,
      error: error.message || error.toString(),
      timestamp: new Date()
    });
    
    // Keep only last 100 errors
    if (this.stats.errors.length > 100) {
      this.stats.errors = this.stats.errors.slice(-100);
    }
  }
  
  private initializeStats(): OrchestratorStats {
    return {
      startTime: new Date(),
      totalListingsProcessed: 0,
      totalMatchesCreated: 0,
      platformStats: {},
      queueStats: { pending: 0, processing: 0, completed: 0 },
      browserStats: { active: 0, authenticated: 0 },
      errors: []
    };
  }
  
  /**
   * Get current stats
   */
  getStats(): OrchestratorStats {
    const poolStats = browserPool.getStats();
    
    return {
      ...this.stats,
      browserStats: {
        active: poolStats.totalBrowsers,
        authenticated: Object.values(poolStats.byPlatform)
          .reduce((sum, p) => sum + p.authenticated, 0)
      }
    };
  }
}

// Factory function
export function createOrchestrator(
  supabaseUrl: string,
  supabaseKey: string,
  config?: Partial<OrchestratorConfig>
): ScrapeOrchestrator {
  return new ScrapeOrchestrator(supabaseUrl, supabaseKey, config);
}