import { ApifyClient } from 'apify';
import { BasePlatformScraper } from './base-scraper';
import { UniversalListing } from './models';
import { PlatformConfig } from './platform-registry';
import { ScraperOptions } from '../types';
import { normalizeListingData } from '../normalizer';

export interface ApifyActorConfig {
  actorId: string;
  memoryMbytes?: number;
  timeoutSecs?: number;
  maxItems?: number;
}

export interface ApifyScraperOptions extends ScraperOptions {
  apiToken: string;
  actorConfig: ApifyActorConfig;
}

export abstract class ApifyBasedScraper extends BasePlatformScraper {
  protected client: ApifyClient;
  protected actorConfig: ApifyActorConfig;
  private runningActors: Set<string> = new Set();
  protected stats = {
    totalFound: 0,
    processed: 0,
    errors: 0
  };
  
  // Required abstract properties
  abstract readonly platform: string;
  abstract readonly baseUrl: string;
  abstract readonly selectors: any;

  constructor(
    protected platformId: string,
    protected config: PlatformConfig,
    protected options: ApifyScraperOptions
  ) {
    super(options.supabaseUrl, options.supabaseKey);
    
    if (!options.apiToken) {
      throw new Error('Apify API token is required');
    }
    
    this.client = new ApifyClient({
      token: options.apiToken,
    });
    
    this.actorConfig = options.actorConfig;
  }

  /**
   * Transform actor-specific data to UniversalListing format
   */
  protected abstract transformActorResult(item: any): UniversalListing | null;

  /**
   * Get input parameters for the actor run
   */
  protected abstract getActorInput(params: any): Promise<any>;

  /**
   * Scrape listings using Apify actor
   */
  async scrapeListings(
    searchParams: any,
    options: { maxPages?: number } = {}
  ): Promise<UniversalListing[]> {
    try {
      console.log(`[${this.platformId}] Starting Apify actor run...`);
      
      // Prepare actor input
      const actorInput = await this.getActorInput({
        ...searchParams,
        maxItems: options.maxPages ? options.maxPages * 20 : this.actorConfig.maxItems,
      });

      // Run the actor
      const run = await this.client.actor(this.actorConfig.actorId).call(actorInput, {
        memoryMbytes: this.actorConfig.memoryMbytes || 1024,
        timeoutSecs: this.actorConfig.timeoutSecs || 300,
      });

      this.runningActors.add(run.id);

      // Wait for the actor to finish
      await this.client.run(run.id).waitForFinish();
      
      this.runningActors.delete(run.id);

      // Get results from the dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`[${this.platformId}] Actor run completed, found ${items.length} items`);

      // Transform results
      const listings: UniversalListing[] = [];
      
      for (const item of items) {
        try {
          const listing = this.transformActorResult(item);
          if (listing) {
            // Apply normalization
            const normalized = normalizeListingData(listing);
            listings.push(normalized);
          }
        } catch (error) {
          console.error(`[${this.platformId}] Error transforming item:`, error);
          this.stats.errors++;
        }
      }

      // Update stats
      this.stats.totalFound = items.length;
      this.stats.processed = listings.length;

      // Log cost information if available
      const runInfo = await this.client.run(run.id).get();
      if (runInfo?.stats?.computeUnits) {
        console.log(`[${this.platformId}] Compute units used: ${runInfo.stats.computeUnits}`);
      }

      return listings;
      
    } catch (error) {
      console.error(`[${this.platformId}] Apify actor error:`, error);
      throw error;
    }
  }

  /**
   * Scrape a single listing detail (if needed)
   */
  async scrapeListingDetail(url: string): Promise<UniversalListing | null> {
    try {
      // Run actor for single URL
      const actorInput = await this.getActorInput({
        startUrls: [{ url }],
        maxItems: 1,
      });

      const run = await this.client.actor(this.actorConfig.actorId).call(actorInput, {
        memoryMbytes: 256, // Less memory for single listing
        timeoutSecs: 60,
      });

      await this.client.run(run.id).waitForFinish();

      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (items.length > 0) {
        const listing = this.transformActorResult(items[0]);
        return listing ? normalizeListingData(listing) : null;
      }

      return null;
    } catch (error) {
      console.error(`[${this.platformId}] Error scraping detail:`, error);
      return null;
    }
  }

  /**
   * Check if URL is a detail page (platform-specific)
   */
  isDetailPage(url: string): boolean {
    // Override in platform-specific implementation
    return false;
  }

  /**
   * Stop any running actors on cleanup
   */
  async cleanup(): Promise<void> {
    for (const runId of this.runningActors) {
      try {
        await this.client.run(runId).abort();
        console.log(`[${this.platformId}] Aborted actor run: ${runId}`);
      } catch (error) {
        console.error(`[${this.platformId}] Error aborting run:`, error);
      }
    }
    this.runningActors.clear();
  }

  /**
   * Get usage statistics for cost monitoring
   */
  async getUsageStats(): Promise<{
    computeUnits: number;
    datasetReads: number;
    datasetWrites: number;
  }> {
    try {
      const user = await this.client.user().get();
      return {
        computeUnits: user?.proxy?.monthlyUsage?.computeUnits || 0,
        datasetReads: user?.proxy?.monthlyUsage?.datasetReads || 0,
        datasetWrites: user?.proxy?.monthlyUsage?.datasetWrites || 0,
      };
    } catch (error) {
      console.error(`[${this.platformId}] Error getting usage stats:`, error);
      return { computeUnits: 0, datasetReads: 0, datasetWrites: 0 };
    }
  }
  
  // Required abstract method implementations - mostly handled by Apify
  async parseListingUrl(url: string): Promise<any> {
    return { platform: this.platform, url };
  }
  
  async buildSearchUrl(filters: any, page?: number): Promise<string> {
    // Not used in Apify scrapers - handled by actor
    return '';
  }
  
  async extractListingsFromSearchPage(page: any): Promise<any[]> {
    // Not used in Apify scrapers - handled by actor
    return [];
  }
  
  async extractDetailPageData(page: any, url: string): Promise<any> {
    // Use scrapeListingDetail instead
    return this.scrapeListingDetail(url);
  }
  
  async handlePlatformSpecificAuth(page: any): Promise<boolean> {
    // Auth handled by actor
    return true;
  }
  
  async detectCaptcha(page: any): Promise<boolean> {
    // Captcha handled by actor
    return false;
  }
}