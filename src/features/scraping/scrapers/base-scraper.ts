import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import { RawListing, ScrapingResult, ScraperConfig, SearchFilters } from '../types.ts';

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected browser?: Browser;
  protected userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  constructor(config: ScraperConfig) {
    this.config = {
      ...config,
      userAgent: config.userAgent || this.userAgent,
      delayBetweenRequests: config.delayBetweenRequests || 1000,
      maxRetries: config.maxRetries || 3,
    };
  }

  abstract getPlatformName(): string;
  abstract buildSearchUrl(filters: SearchFilters): string;
  abstract parseListingPage($: cheerio.CheerioAPI, url: string): RawListing[];
  abstract extractListingDetails($: cheerio.CheerioAPI, url: string): Partial<RawListing>;

  async scrape(filters: SearchFilters = {}, enhanceWithDetails = true): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      listings: [],
      errors: [],
      totalFound: 0,
      newListings: 0,
      processingTime: 0,
    };

    try {
      await this.initBrowser();
      const searchUrl = this.buildSearchUrl(filters);
      
      console.log(`[${this.getPlatformName()}] Starting scrape with URL: ${searchUrl}`);
      
      let listings = await this.scrapeSearchResults(searchUrl);
      
      // Enhance with detail page data if requested
      if (enhanceWithDetails && listings.length > 0) {
        console.log(`[${this.getPlatformName()}] Enhancing ${listings.length} listings with detail page data...`);
        listings = await this.enhanceListingsWithDetails(listings);
      }
      
      result.listings = listings;
      result.totalFound = listings.length;
      result.newListings = listings.length; // TODO: Compare with existing DB records
      
      console.log(`[${this.getPlatformName()}] Found ${listings.length} listings`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error(`[${this.getPlatformName()}] Scraping failed:`, errorMessage);
    } finally {
      await this.closeBrowser();
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  private async enhanceListingsWithDetails(listings: RawListing[]): Promise<RawListing[]> {
    const enhancedListings: RawListing[] = [];
    
    // Only enhance first 3 listings to avoid rate limiting
    const listingsToEnhance = listings.slice(0, 3);
    const remainingListings = listings.slice(3);
    
    console.log(`[${this.getPlatformName()}] Enhancing ${listingsToEnhance.length} listings with detail page data...`);
    
    for (let i = 0; i < listingsToEnhance.length; i++) {
      const listing = listingsToEnhance[i];
      
      try {
        console.log(`[${this.getPlatformName()}] Enhancing listing ${i + 1}/${listingsToEnhance.length}: ${listing.title}`);
        
        // Fetch detail page
        const detailHtml = await this.fetchPage(listing.url);
        const $ = cheerio.load(detailHtml);
        
        // Extract additional details
        const additionalDetails = this.extractListingDetails($, listing.url);
        
        // Merge the data, prioritizing detail page data for images and description
        const enhancedListing: RawListing = {
          ...listing,
          ...additionalDetails,
          // Keep the original URL and basic info
          url: listing.url,
          externalId: listing.externalId,
          platform: listing.platform,
          // Use detail page images if available, otherwise keep originals
          images: additionalDetails.images && additionalDetails.images.length > 0 
            ? additionalDetails.images 
            : listing.images,
          // Use detail page description if available and longer
          description: additionalDetails.description && additionalDetails.description.length > listing.description.length
            ? additionalDetails.description
            : listing.description
        };
        
        enhancedListings.push(enhancedListing);
        
      } catch (error) {
        console.warn(`[${this.getPlatformName()}] Failed to enhance listing ${listing.url}:`, error instanceof Error ? error.message : 'Unknown error');
        // Keep the original listing if enhancement fails
        enhancedListings.push(listing);
      }
    }
    
    // Add remaining listings without enhancement
    enhancedListings.push(...remainingListings);
    
    return enhancedListings;
  }

  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1920,1080',
        '--start-maximized',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
    });
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }

  protected async fetchPage(url: string, retryCount = 0): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage({
      userAgent: this.config.userAgent!,
      viewport: { width: 1920, height: 1080 },
      locale: 'de-DE'
    });
    
    try {
      // Override navigator properties to avoid detection
      await page.addInitScript(() => {
        // Override the webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Override plugins to look more realistic
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => (
          parameters.name === 'notifications' 
            ? Promise.resolve({ state: 'denied' } as PermissionStatus)
            : originalQuery(parameters)
        );
      });
      
      // Enhanced stealth measures
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': this.config.baseUrl || url.split('/').slice(0, 3).join('/')
      });

      // Random delay before request (1-3 seconds)
      const randomDelay = 1000 + Math.random() * 2000;
      await this.delay(randomDelay);

      const response = await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      if (!response) {
        throw new Error(`No response from ${url} - website may be blocking requests`);
      }
      
      if (!response.ok()) {
        const status = response.status();
        
        // Retry logic for specific error codes
        if ((status === 429 || status === 503 || status === 500) && retryCount < this.config.maxRetries!) {
          console.log(`[${this.getPlatformName()}] Retrying after ${status} error (attempt ${retryCount + 1}/${this.config.maxRetries})...`);
          
          // Exponential backoff: 5s, 10s, 20s
          const backoffDelay = 5000 * Math.pow(2, retryCount);
          await this.delay(backoffDelay);
          
          await page.close();
          return this.fetchPage(url, retryCount + 1);
        }
        
        throw new Error(`Failed to fetch ${url}: HTTP ${status}`);
      }

      // Simulate human behavior
      await page.mouse.move(Math.random() * 1000, Math.random() * 800);
      await page.waitForTimeout(1000 + Math.random() * 2000);
      
      // Scroll a bit to trigger lazy loading
      await page.evaluate(() => {
        window.scrollBy(0, 300 + Math.random() * 200);
      });
      
      await page.waitForTimeout(1000 + Math.random() * 1000);
      
      const html = await page.content();
      
      // Add longer delay between requests (3-6 seconds)
      const requestDelay = 3000 + Math.random() * 3000;
      await this.delay(requestDelay);
      
      return html;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for timeout or connection issues
      if (errorMessage.includes('timeout') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
        console.log(`[${this.getPlatformName()}] Connection timeout or DNS issue for ${url}`);
        throw new Error(`Cannot connect to ${this.getPlatformName()} - the website may be blocking requests or there's a network issue`);
      }
      
      if (retryCount < this.config.maxRetries! - 1) {
        console.log(`[${this.getPlatformName()}] Error: ${errorMessage}, retrying...`);
        await page.close();
        await this.delay(5000 * (retryCount + 1));
        return this.fetchPage(url, retryCount + 1);
      }
      throw error;
    } finally {
      if (page && !page.isClosed()) {
        await page.close();
      }
    }
  }

  protected async fetchPageWithCheerio(url: string): Promise<cheerio.CheerioAPI> {
    const html = await this.fetchPage(url);
    return cheerio.load(html);
  }

  private async scrapeSearchResults(searchUrl: string): Promise<RawListing[]> {
    const $ = await this.fetchPageWithCheerio(searchUrl);
    return this.parseListingPage($, searchUrl);
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected extractPrice(priceText: string): number | undefined {
    const match = priceText.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  protected extractNumber(text: string): number | undefined {
    const match = text.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  protected extractDate(dateText: string): Date | undefined {
    // Handle common German date formats
    const patterns = [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const match = dateText.match(pattern);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Check if it's DD.MM.YYYY format
        if (pattern === patterns[0]) {
          return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
        }
        // Check if it's YYYY-MM-DD format
        if (pattern === patterns[1]) {
          return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        }
      }
    }

    return undefined;
  }

  protected normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    return `${baseUrl}/${url}`;
  }

  protected createRawListing(data: Partial<RawListing>): RawListing {
    return {
      title: data.title || 'Untitled',
      description: data.description || '',
      price: data.price || 0,
      warmRent: data.warmRent,
      size: data.size,
      rooms: data.rooms,
      floor: data.floor,
      totalFloors: data.totalFloors,
      availableFrom: data.availableFrom,
      district: data.district,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      propertyType: data.propertyType,
      images: data.images || [],
      amenities: data.amenities || {},
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      platform: this.getPlatformName(),
      externalId: data.externalId || '',
      url: data.url || '',
      allowsAutoApply: data.allowsAutoApply || false,
      scrapedAt: new Date(),
    };
  }
}