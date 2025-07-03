import { Page, Browser } from 'playwright';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ListingIdentifier {
  platform: string;
  externalId: string;
  url: string;
}

export interface SearchFilters {
  minRent?: number;
  maxRent?: number;
  minRooms?: number;
  maxRooms?: number;
  roomTypes?: string[];
  districts?: string[];
  amenities?: Record<string, boolean>;
  platforms?: string[];
}

export interface RawListing {
  externalId: string;
  url: string;
  title: string;
  price: number | null;
  size: number | null;
  rooms: number | null;
  district: string | null;
  address: string | null;
  thumbnailUrl?: string;
}

export interface DetailedListing extends RawListing {
  description: string | null;
  availableFrom: Date | null;
  availableTo: Date | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactProfileImage: string | null;
  images: string[];
  amenities: Record<string, any>;
  platformData: Record<string, any>;
}

export interface PlatformSelectors {
  listings: string;
  title: string;
  price: string;
  size: string;
  rooms: string;
  district: string;
  nextPage: string;
  cookieConsent?: string;
}

export interface ScrapeConfig {
  maxPages?: number;
  maxListings?: number;
  filters?: SearchFilters;
  mode?: 'discovery' | 'update' | 'full';
}

export interface ScrapeResult {
  listings: DetailedListing[];
  totalFound: number;
  totalScraped: number;
  errors: string[];
  stats: {
    duration: number;
    pagesVisited: number;
    captchasEncountered: number;
  };
}

export abstract class BasePlatformScraper {
  abstract readonly platform: string;
  abstract readonly baseUrl: string;
  abstract readonly selectors: PlatformSelectors;
  
  protected supabase: SupabaseClient | null = null;
  protected authenticated: boolean = false;
  
  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.initSupabase(supabaseUrl, supabaseKey);
    }
  }
  
  protected initSupabase(url: string, key: string) {
    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(url, key);
  }
  
  // Abstract methods that each platform must implement
  abstract async parseListingUrl(url: string): Promise<ListingIdentifier>;
  abstract async buildSearchUrl(filters: SearchFilters, page?: number): Promise<string>;
  abstract async extractListingsFromSearchPage(page: Page): Promise<RawListing[]>;
  abstract async extractDetailPageData(page: Page, url: string): Promise<DetailedListing>;
  abstract async handlePlatformSpecificAuth(page: Page): Promise<boolean>;
  abstract async detectCaptcha(page: Page): Promise<boolean>;
  
  // Shared logic across all platforms
  async scrape(config: ScrapeConfig): Promise<ScrapeResult> {
    const startTime = Date.now();
    const result: ScrapeResult = {
      listings: [],
      totalFound: 0,
      totalScraped: 0,
      errors: [],
      stats: {
        duration: 0,
        pagesVisited: 0,
        captchasEncountered: 0
      }
    };
    
    try {
      // Build search URL
      const searchUrl = await this.buildSearchUrl(config.filters || {});
      console.log(`🔍 Starting scrape for ${this.platform} with URL: ${searchUrl}`);
      
      // Discovery mode - just get listings from search pages
      if (config.mode === 'discovery') {
        result.listings = await this.scrapeSearchPages(searchUrl, config);
      } 
      // Full mode - get search results and visit each detail page
      else {
        const rawListings = await this.scrapeSearchPages(searchUrl, config);
        result.listings = await this.scrapeDetailPages(rawListings, config);
      }
      
      result.totalScraped = result.listings.length;
      
    } catch (error) {
      console.error(`❌ Scraping error for ${this.platform}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      result.stats.duration = Date.now() - startTime;
    }
    
    return result;
  }
  
  protected async scrapeSearchPages(searchUrl: string, config: ScrapeConfig): Promise<any[]> {
    // Common search page scraping logic
    // Platforms can override this if needed
    const listings: RawListing[] = [];
    const maxPages = config.maxPages || 5;
    
    // This would use the browser pool in real implementation
    console.log(`📄 Scraping search pages for ${this.platform} (max ${maxPages} pages)`);
    
    return listings;
  }
  
  protected async scrapeDetailPages(rawListings: RawListing[], config: ScrapeConfig): Promise<DetailedListing[]> {
    // Common detail page scraping logic
    const detailed: DetailedListing[] = [];
    
    console.log(`📋 Scraping ${rawListings.length} detail pages for ${this.platform}`);
    
    for (const listing of rawListings) {
      try {
        // Would use browser pool to get page
        // const detailData = await this.extractDetailPageData(page, listing.url);
        // detailed.push(detailData);
      } catch (error) {
        console.error(`Failed to scrape detail page ${listing.url}:`, error);
      }
    }
    
    return detailed;
  }
  
  // Common utilities that platforms can use
  protected async acceptCookies(page: Page): Promise<void> {
    try {
      const selector = this.selectors.cookieConsent;
      if (selector) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 5000 })) {
          await button.click();
          console.log(`✅ Accepted cookies for ${this.platform}`);
          await page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      // Cookie consent not found or failed - continue anyway
    }
  }
  
  protected normalizePrice(priceStr: string): number | null {
    if (!priceStr) return null;
    
    // Remove currency symbols and normalize
    const cleaned = priceStr
      .replace(/[€$£¥]/g, '')
      .replace(/\./g, '') // Remove thousand separators
      .replace(',', '.') // Convert comma to decimal point
      .trim();
    
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }
  
  protected normalizeSize(sizeStr: string): number | null {
    if (!sizeStr) return null;
    
    const match = sizeStr.match(/(\d+(?:[.,]\d+)?)\s*(?:m²|qm|m2)?/i);
    if (match) {
      const size = parseFloat(match[1].replace(',', '.'));
      return isNaN(size) ? null : size;
    }
    
    return null;
  }
  
  protected normalizeRooms(roomStr: string): number | null {
    if (!roomStr) return null;
    
    const match = roomStr.match(/(\d+(?:[.,]\d+)?)\s*(?:zimmer|rooms?|zi\.?|raum|räume)?/i);
    if (match) {
      const rooms = parseFloat(match[1].replace(',', '.'));
      return isNaN(rooms) ? null : rooms;
    }
    
    return null;
  }
  
  protected extractImageUrls(images: string[]): string[] {
    return images
      .filter(url => url && url.includes('.') && !url.includes('placeholder'))
      .map(url => {
        // Ensure absolute URLs
        if (url.startsWith('//')) return 'https:' + url;
        if (url.startsWith('/')) return this.baseUrl + url;
        return url;
      });
  }
}