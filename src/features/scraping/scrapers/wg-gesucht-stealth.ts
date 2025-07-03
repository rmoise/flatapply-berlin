import { Page, Browser, BrowserContext, chromium } from 'playwright';
import type { UniversalListing } from '../core/models';
import { PropertyType, ListingStatus } from '../core/models';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { CaptchaSolverService, createCaptchaSolver } from '../services/captcha-solver';

// Note: Playwright doesn't support puppeteer-extra plugins directly
// We'll implement stealth features manually through browser context configuration

interface ScraperConfig {
  maxRetries: number;
  retryDelay: number;
  requestDelay: number;
  sessionRotationInterval: number;
  captchaSolver?: CaptchaSolver;
  proxy?: ProxyConfig;
  headless?: boolean;
}

interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

interface CaptchaSolver {
  provider: '2captcha' | 'anticaptcha';
  apiKey: string;
}

export class WGGesuchtStealthScraper {
  private captchaSolver?: CaptchaSolverService;
  
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];

  private static readonly VIEWPORTS = [
    { width: 1920, height: 1080, deviceScaleFactor: 1 },
    { width: 1440, height: 900, deviceScaleFactor: 1 },
    { width: 1366, height: 768, deviceScaleFactor: 1 },
    { width: 1536, height: 864, deviceScaleFactor: 1 }
  ];

  private config: ScraperConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    requestDelay: 2000,
    sessionRotationInterval: 30 * 60 * 1000 // 30 minutes
  };

  private sessions: Map<string, BrowserContext> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private requestCount = 0;
  private captchaCount = 0;
  private successCount = 0;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = { ...this.config, ...config };
    
    // Initialize CAPTCHA solver if API key is provided
    const apiKey = process.env.CAPTCHA_SOLVER_API_KEY;
    if (apiKey) {
      this.captchaSolver = createCaptchaSolver({
        provider: (process.env.CAPTCHA_SOLVER_PROVIDER as any) || '2captcha',
        apiKey,
        enableLogging: true
      });
    }
  }

  /**
   * Initialize browser with anti-detection measures
   */
  private async createStealthBrowser(): Promise<Browser> {
    const launchOptions: any = {
      headless: this.config.headless ?? false, // Use config option or default to false
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--deterministic-fetch',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    };

    // Add proxy if configured
    if (this.config.proxy) {
      launchOptions.proxy = {
        server: this.config.proxy.server,
        username: this.config.proxy.username,
        password: this.config.proxy.password
      };
    }

    const browser = await chromium.launch(launchOptions);
    
    return browser;
  }

  /**
   * Create a new browser context with random fingerprint
   */
  private async createStealthContext(browser: Browser): Promise<BrowserContext> {
    const userAgent = WGGesuchtStealthScraper.USER_AGENTS[Math.floor(Math.random() * WGGesuchtStealthScraper.USER_AGENTS.length)];
    const viewport = WGGesuchtStealthScraper.VIEWPORTS[Math.floor(Math.random() * WGGesuchtStealthScraper.VIEWPORTS.length)];

    const context = await browser.newContext({
      userAgent,
      viewport,
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      permissions: ['geolocation', 'notifications'],
      geolocation: { latitude: 52.520008, longitude: 13.404954 }, // Berlin
      colorScheme: 'light',
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      hasTouch: false,
      javaScriptEnabled: true,
      bypassCSP: false, // Don't bypass CSP for more realistic behavior
      ignoreHTTPSErrors: false, // Don't ignore HTTPS errors
      acceptDownloads: false,
      // Add extra HTTP headers for more realistic behavior
      extraHTTPHeaders: {
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      },
      // Storage state for session persistence
      storageState: await this.loadSessionState()
    });

    // Inject anti-detection scripts
    await context.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Mock chrome runtime
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Add realistic window properties
      window.Navigator.prototype.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [{
          0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        }]
      });
    });

    return context;
  }

  /**
   * Load saved session state if available
   */
  private async loadSessionState(): Promise<any> {
    try {
      const sessionPath = '.wg-cookies.json';
      const sessionData = await fs.readFile(sessionPath, 'utf-8');
      return JSON.parse(sessionData);
    } catch {
      return undefined;
    }
  }

  /**
   * Save session state for reuse
   */
  private async saveSessionState(context: BrowserContext): Promise<void> {
    try {
      const sessionPath = '.wg-cookies.json';
      const state = await context.storageState();
      await fs.writeFile(sessionPath, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  /**
   * Human-like delay between actions
   */
  private async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Human-like mouse movement
   */
  private async humanMouseMovement(page: Page): Promise<void> {
    const width = page.viewportSize()?.width || 1920;
    const height = page.viewportSize()?.height || 1080;

    // Move mouse in a natural curve
    const steps = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < steps; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      await page.mouse.move(x, y, { steps: 10 });
      await this.humanDelay(50, 150);
    }
  }

  /**
   * Smart CAPTCHA detection and solving
   */
  private async handleCaptcha(page: Page): Promise<boolean> {
    this.captchaCount++;
    
    // Check for different CAPTCHA types
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      '.g-recaptcha',
      '#captcha-container',
      '.challenge-form',
      'div[id*="captcha"]'
    ];

    for (const selector of captchaSelectors) {
      if (await page.locator(selector).count() > 0) {
        console.log('🔒 CAPTCHA detected, attempting to solve...');
        
        if (this.config.captchaSolver) {
          return await this.solveCaptcha(page);
        } else {
          console.log('⚠️  No CAPTCHA solver configured, waiting for manual solve...');
          // Wait for user to solve manually
          await page.waitForTimeout(30000);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Solve CAPTCHA using configured service
   */
  private async solveCaptcha(page: Page): Promise<boolean> {
    if (!this.captchaSolver) {
      console.error('No CAPTCHA solver configured');
      return false;
    }
    
    console.log('🤖 Using automated CAPTCHA solver...');
    
    try {
      // Check for different CAPTCHA types and solve accordingly
      const recaptchaElement = await page.locator('.g-recaptcha').first();
      
      if (await recaptchaElement.isVisible()) {
        console.log('🔍 Detected reCAPTCHA');
        
        const sitekey = await recaptchaElement.getAttribute('data-sitekey');
        if (!sitekey) {
          console.error('Failed to extract reCAPTCHA sitekey');
          return false;
        }
        
        const result = await this.captchaSolver.solveRecaptchaV2(sitekey, page.url());
        
        if (result.success && result.solution) {
          // Inject the solution
          await page.evaluate((token) => {
            const responseElement = document.getElementById('g-recaptcha-response');
            if (responseElement) {
              (responseElement as HTMLTextAreaElement).value = token;
            }
          }, result.solution);
          
          // Submit the form or trigger validation
          await page.evaluate(() => {
            // Look for submit button or form
            const submitBtn = document.querySelector('input[type="submit"], button[type="submit"]');
            if (submitBtn) {
              (submitBtn as HTMLElement).click();
            }
          });
          
          console.log('✅ CAPTCHA solved successfully');
          return true;
        }
      }
      
      // Check for hCaptcha
      const hcaptchaElement = await page.locator('[data-hcaptcha-widget-id]').first();
      if (await hcaptchaElement.isVisible()) {
        console.log('🔍 Detected hCaptcha');
        
        const sitekey = await hcaptchaElement.evaluate(el => {
          return el.closest('[data-sitekey]')?.getAttribute('data-sitekey');
        });
        
        if (sitekey) {
          const result = await this.captchaSolver.solveHCaptcha(sitekey, page.url());
          
          if (result.success && result.solution) {
            await page.evaluate((token) => {
              const responseElement = document.querySelector('[name="h-captcha-response"]');
              if (responseElement) {
                (responseElement as HTMLTextAreaElement).value = token;
              }
            }, result.solution);
            
            console.log('✅ hCaptcha solved successfully');
            return true;
          }
        }
      }
      
      // Check for image-based CAPTCHAs
      const imageCaptcha = await page.locator('img[src*="captcha"], .captcha img').first();
      if (await imageCaptcha.isVisible()) {
        console.log('🔍 Detected image CAPTCHA');
        
        const imageUrl = await imageCaptcha.getAttribute('src');
        if (imageUrl) {
          const fullImageUrl = new URL(imageUrl, page.url()).href;
          const result = await this.captchaSolver.solveImageCaptcha(fullImageUrl);
          
          if (result.success && result.solution) {
            // Find input field for CAPTCHA solution
            const inputField = await page.locator('input[name*="captcha"], input[placeholder*="captcha"]').first();
            if (await inputField.isVisible()) {
              await inputField.fill(result.solution);
              console.log('✅ Image CAPTCHA solved successfully');
              return true;
            }
          }
        }
      }
      
      console.log('❌ No supported CAPTCHA type found or solution failed');
      return false;
      
    } catch (error) {
      console.error('❌ CAPTCHA solving failed:', error);
      return false;
    }
  }

  /**
   * Smart retry with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retry attempt ${attempt + 1}/${retries} after ${delay}ms delay...`);
          await this.humanDelay(delay, delay + 1000);
        }
        
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message?.includes('Session closed') || 
            error.message?.includes('Browser closed')) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Rate limiting to avoid detection
   */
  private async rateLimit(sessionId: string): Promise<void> {
    const lastRequest = this.lastRequestTime.get(sessionId) || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    if (timeSinceLastRequest < this.config.requestDelay) {
      const waitTime = this.config.requestDelay - timeSinceLastRequest;
      await this.humanDelay(waitTime, waitTime + 500);
    }
    
    this.lastRequestTime.set(sessionId, Date.now());
    this.requestCount++;
    
    // Add longer pause every N requests
    if (this.requestCount % 10 === 0) {
      console.log('🌊 Taking a break after 10 requests...');
      await this.humanDelay(10000, 15000);
    }
  }

  /**
   * Set up automatic cookie consent handler using Playwright's addLocatorHandler
   */
  private async setupCookieConsentHandler(page: Page): Promise<void> {
    // Set up handler for WG-Gesucht specific cookie consent
    await page.addLocatorHandler(
      page.locator('.cmpboxbtn.cmpboxbtnyes, #cmpwelcomebtnyes').first(),
      async () => {
        try {
          // Primary selectors for WG-Gesucht
          const primarySelectors = [
            '.cmpboxbtn.cmpboxbtnyes',
            '#cmpwelcomebtnyes'
          ];
          
          for (const selector of primarySelectors) {
            const button = page.locator(selector).first();
            if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
              await this.humanDelay(300, 600);
              await button.click();
              console.log('✅ Cookie consent handled automatically');
              await this.humanDelay(500, 1000);
              return;
            }
          }
          
          // Fallback selectors
          const fallbackSelectors = [
            'button:has-text("Alle akzeptieren")',
            'button:has-text("Accept all")',
            'button:has-text("Akzeptieren")'
          ];
          
          for (const selector of fallbackSelectors) {
            const button = page.locator(selector).filter({ visible: true }).first();
            if (await button.count() > 0) {
              await this.humanDelay(300, 600);
              await button.click();
              console.log('✅ Cookie consent handled with fallback');
              return;
            }
          }
        } catch (e) {
          console.log('Cookie consent handler error:', e);
        }
      }
    );
  }

  /**
   * Enhanced listing extraction with error handling
   */
  async scrapeListings(searchParams: any): Promise<UniversalListing[]> {
    const browser = await this.createStealthBrowser();
    const context = await this.createStealthContext(browser);
    const sessionId = createHash('md5').update(JSON.stringify(searchParams)).digest('hex');
    
    try {
      const page = await context.newPage();
      const listings: UniversalListing[] = [];
      
      // Build search URL
      const searchUrl = this.buildSearchUrl(searchParams);
      
      // Set up cookie consent handler before navigation
      await this.setupCookieConsentHandler(page);
      
      // Navigate with retry
      await this.retryOperation(async () => {
        await this.rateLimit(sessionId);
        await page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Check for CAPTCHA
        if (await this.handleCaptcha(page)) {
          // Reload page after CAPTCHA solve
          await page.reload({ waitUntil: 'domcontentloaded' });
        }
        
        // Human-like behavior
        await this.humanMouseMovement(page);
        await this.humanDelay();
        
        // Wait for listings
        await page.waitForSelector('.offer_list_item', { timeout: 15000 });
      });
      
      // Extract listings with pagination
      let currentPage = 1;
      const maxPages = searchParams.maxPages || 5;
      
      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage}...`);
        
        // Extract listings from current page
        const rawListings = await this.extractListingsFromPage(page);
        
        // Convert to UniversalListing format
        for (const raw of rawListings) {
          const listing: UniversalListing = {
            id: raw.id,
            externalId: raw.id, // Add externalId for database
            platform: 'wg_gesucht',
            url: raw.url,
            title: raw.title,
            description: '', // Will be filled when visiting detail page
            price: raw.price,
            warmRent: null,
            additionalCosts: null,
            deposit: null,
            size: raw.size,
            rooms: raw.rooms,
            floor: null,
            totalFloors: null,
            availableFrom: raw.availableFrom,
            availableTo: null,
            location: {
              district: raw.district,
              address: raw.address,
              zipCode: null,
              city: 'Berlin',
              country: 'Germany',
              coordinates: null
            },
            images: raw.thumbnail ? [raw.thumbnail] : [],
            amenities: {},
            contact: raw.provider ? { 
              name: raw.provider,
              phone: null,
              email: null,
              company: null,
              isAgent: false
            } : null,
            propertyType: raw.rooms === 1 ? PropertyType.APARTMENT : PropertyType.WG_ROOM,
            status: ListingStatus.ACTIVE,
            viewCount: null,
            isVerified: false,
            allowsPets: null,
            allowsSmoking: null,
            hasParking: null,
            isBarrierFree: null,
            isFurnished: null,
            hasKitchen: null,
            hasBalcony: null,
            hasGarden: null,
            energyClass: null,
            heatingType: null,
            lastUpdated: new Date(),
            scrapedAt: new Date(),
            detailsScraped: false,
            rawData: null,
            allowsAutoApply: false
          };
          listings.push(listing);
        }
        
        // Check for next page
        const nextButton = page.locator('a.page-link[rel="next"]').first();
        if (await nextButton.isVisible() && currentPage < maxPages) {
          await this.humanDelay();
          await nextButton.click();
          await page.waitForLoadState('domcontentloaded');
          await this.humanDelay();
          currentPage++;
        } else {
          break;
        }
      }
      
      // Save session for reuse
      await this.saveSessionState(context);
      
      this.successCount++;
      console.log(`✅ Successfully scraped ${listings.length} listings`);
      
      return listings;
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    } finally {
      await context.close();
      await browser.close();
    }
  }

  /**
   * Build optimized search URL
   */
  private buildSearchUrl(params: any): string {
    const baseUrl = 'https://www.wg-gesucht.de';
    const cityId = '8'; // Berlin
    
    // Build URL based on room preferences
    let categories = [];
    if (!params.minRooms || params.minRooms <= 0) categories.push('0'); // WG rooms
    if (!params.minRooms || params.minRooms <= 1) categories.push('1'); // 1-room apartments
    if (!params.maxRooms || params.maxRooms >= 2) categories.push('2'); // apartments
    
    // Default to all categories if none specified
    if (categories.length === 0) categories = ['0', '1', '2'];
    
    // Format: /category-in-Berlin.cityId.categories.1.0.html
    let path;
    if (categories.length === 1) {
      const categoryNames = {
        '0': 'wg-zimmer',
        '1': '1-zimmer-wohnungen', 
        '2': 'wohnungen'
      };
      path = `${categoryNames[categories[0]]}-in-Berlin.${cityId}.${categories[0]}.1.0.html`;
    } else {
      // Combined search
      path = `wohnungen-in-Berlin.${cityId}.${categories.join('+')}.1.0.html`;
    }
    
    let url = `${baseUrl}/${path}`;
    
    const urlParams = new URLSearchParams();
    
    if (params.minRent) urlParams.set('rMin', params.minRent.toString());
    if (params.maxRent) urlParams.set('rMax', params.maxRent.toString());
    urlParams.set('noDeact', '1'); // Exclude deactivated listings
    urlParams.set('img_only', '0'); // Include listings without images
    urlParams.set('sort_order', '0'); // Sort by date
    
    const queryString = urlParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Extract listings from page with enhanced error handling
   */
  private async extractListingsFromPage(page: Page): Promise<UniversalListing[]> {
    return await page.evaluate(() => {
      const listings: any[] = [];
      const items = document.querySelectorAll('.offer_list_item[data-id]');
      
      items.forEach((item: any) => {
        try {
          const id = item.getAttribute('data-id');
          if (!id) return;
          
          // Extract URL and title from link
          const linkEl = item.querySelector('a[href*="/wg-zimmer"], a[href*="/wohnungen"], a[href*="/1-zimmer"]');
          const url = linkEl?.href || '';
          // Title is in the title attribute, not text content
          const title = linkEl?.getAttribute('title')?.replace('Anzeige ansehen: ', '').trim() || 
                       item.querySelector('.headline-list-view a')?.textContent?.trim() || 
                       item.querySelector('h3 a')?.textContent?.trim() || '';
          
          // Price extraction - look for bold price text
          const priceEl = item.querySelector('b');
          const priceText = priceEl?.textContent || item.textContent || '';
          const priceMatch = priceText.match(/(\d+)\s*€/);
          const price = priceMatch ? parseInt(priceMatch[1]) : 0;
          
          // Size extraction
          const sizeMatch = item.textContent?.match(/(\d+)\s*m²/);
          const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
          
          // Room extraction from type or text
          const typeText = item.querySelector('.col-xs-11 span')?.textContent || '';
          let rooms = 1; // default
          if (typeText.includes('1-Zimmer')) rooms = 1;
          else if (typeText.includes('2-Zimmer')) rooms = 2;
          else if (typeText.includes('3-Zimmer')) rooms = 3;
          else {
            const roomMatch = item.textContent?.match(/(\d+(?:[,.]?\d+)?)\s*(?:Zimmer|Zi\.|room)/i);
            rooms = roomMatch ? parseFloat(roomMatch[1].replace(',', '.')) : 1;
          }
          
          // Location extraction - parse the span text
          const locationSpan = item.querySelector('.col-xs-11 span');
          const locationText = locationSpan?.textContent?.trim() || '';
          const locationParts = locationText.split('|').map(p => p.trim()).filter(p => p);
          
          // Extract district and address
          let district = '';
          let address = '';
          if (locationParts.length >= 3) {
            // Format: "1-Zimmer-Wohnung | Berlin District | Street"
            district = locationParts[1]?.replace('Berlin', '').trim() || '';
            address = locationParts[2] || '';
          } else if (locationParts.length >= 2) {
            district = locationParts[1]?.replace('Berlin', '').trim() || '';
          }
          
          // Available from - look for date
          const dateMatch = item.textContent?.match(/ab\s+(\d{2}\.\d{2}\.\d{4})/);
          const availableFrom = dateMatch ? dateMatch[1] : null;
          
          // Image extraction
          const imgEl = item.querySelector('img[src*="/scaler/"], img.card_image');
          const thumbnail = imgEl?.src || '';
          
          // Extract provider info if available
          // The contact name is typically in a span with class "ml5"
          let provider = '';
          const contactEl = item.querySelector('span.ml5');
          if (contactEl) {
            const text = contactEl.textContent?.trim() || '';
            // Clean up the name - remove "Online:" and time info
            const nameMatch = text.match(/^([^\n]+?)(?:\s*Online:|$)/);
            if (nameMatch) {
              provider = nameMatch[1].trim();
            } else {
              provider = text.split('\n')[0].trim();
            }
          }
          
          // Fallback: try other selectors if ml5 didn't work
          if (!provider) {
            const selectors = [
              '.list-details-ml > span:last-child',
              '.ml5.mr5.mb5'
            ];
            
            for (const selector of selectors) {
              const el = item.querySelector(selector);
              if (el) {
                const text = el.textContent?.trim() || '';
                // Look for "von" (from) pattern
                const vonMatch = text.match(/von\s+([^,\n]+)/);
                if (vonMatch) {
                  provider = vonMatch[1].trim();
                  break;
                }
              }
            }
          }
          
          listings.push({
            id,
            externalId: id,
            url,
            title,
            price,
            size,
            rooms,
            district,
            address,
            availableFrom,
            thumbnail,
            provider,
            platform: 'wg_gesucht'
          });
        } catch (error) {
          console.error('Error extracting listing:', error);
        }
      });
      
      return listings;
    });
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      captchaCount: this.captchaCount,
      successCount: this.successCount,
      captchaRate: this.requestCount > 0 ? (this.captchaCount / this.requestCount * 100).toFixed(1) + '%' : '0%',
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Scrape detailed information from a single listing page
   */
  async scrapeListingDetails(url: string, page: Page): Promise<Partial<UniversalListing>> {
    console.log(`🔍 Scraping details from: ${url}`);
    
    try {
      // Set up response listener to capture phone data from AJAX
      let capturedPhoneData: any = null;
      page.on('response', async (response) => {
        const url = response.url();
        // Look for phone-related AJAX endpoints
        if (url.includes('phone') || url.includes('contact') || url.includes('telefon')) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('json')) {
              const data = await response.json().catch(() => null);
              if (data && (data.phone || data.mobile || data.telephone || data.handy)) {
                capturedPhoneData = data;
                console.log('📞 Captured phone data from AJAX:', data);
              }
            }
          } catch (e) {
            // Ignore errors in response parsing
          }
        }
      });
      
      // Block ads before navigation
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (url.includes('googlesyndication') || 
            url.includes('googletagmanager') ||
            url.includes('doubleclick') ||
            url.includes('/ads/') ||
            url.includes('adsystem')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Navigate to detail page with retry
      await this.retryOperation(async () => {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Check for CAPTCHA
        if (await this.handleCaptcha(page)) {
          await page.reload({ waitUntil: 'domcontentloaded' });
        }
        
        // Wait for main content
        await page.waitForSelector('.headline-detailed-view-title, h1', { 
          timeout: 15000 
        }).catch(() => {
          // Fallback selectors for different page layouts
          return page.waitForSelector('.panel-body, .section_panel_content', { 
            timeout: 10000 
          });
        });
      });

      // Human-like behavior
      await this.humanDelay(500, 1000);
      
      // Try to click "weiter zu wohnungsfotos" link to access full gallery
      try {
        // Look for various photo gallery link patterns
        const selectors = [
          'a:has-text("weiter zu")',
          'a:has-text("weiter")',
          'a:has-text("Fotos")',
          'a[href*="fotos"]',
          '.photo-link',
          '.gallery-link',
          'a:has-text("mehr Bilder")',
          'a:has-text("Bildergalerie")'
        ];
        
        let photoLink = null;
        for (const selector of selectors) {
          photoLink = await page.$(selector);
          if (photoLink) {
            console.log(`📷 Found photo gallery link with selector: ${selector}`);
            break;
          }
        }
        
        if (photoLink) {
          // Scroll the link into view first
          await photoLink.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          
          // Try multiple click methods
          try {
            await photoLink.click({ force: true });
          } catch (e1) {
            try {
              await photoLink.click();
            } catch (e2) {
              // Try JavaScript click as fallback
              await page.evaluate((el) => {
                if (el instanceof HTMLElement) {
                  el.click();
                } else if ('dispatchEvent' in el) {
                  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
              }, photoLink);
            }
          }
          
          // Wait for gallery content to load
          await page.waitForTimeout(2000);
          
          // Wait for gallery initialization
          try {
            await page.waitForFunction(() => {
              return (window as any).image_gallery || 
                     document.querySelector('#WG-Pictures .sp-slide') ||
                     document.querySelector('.gallery-view');
            }, { timeout: 8000 });
            console.log('📷 Gallery content loaded successfully');
          } catch (e) {
            console.log('📷 Gallery content load timeout, continuing...');
          }
        } else {
          console.log('📷 No photo gallery link found, using current page');
          
          // Check if there's an ad blocking the photos
          try {
            const continueToPhotosButton = await page.$('a:has-text("Weiter zu den Wohnungsfotos"), button:has-text("Weiter zu den Wohnungsfotos")');
            if (continueToPhotosButton) {
              console.log('🚪 Found ad blocking photos, clicking continue button...');
              await continueToPhotosButton.click();
              await page.waitForTimeout(2000);
            }
          } catch (e) {
            // No ad blocking, continue normally
          }
        }
      } catch (e) {
        // Continue if photo link not found or click fails
        console.log('📷 Photo link click failed, using current page');
      }
      
      // Block ads that might interfere with gallery loading
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (url.includes('googlesyndication') || 
            url.includes('googletagmanager') ||
            url.includes('doubleclick') ||
            url.includes('/ads/') ||
            url.includes('adsystem')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Wait for potential JavaScript gallery initialization
      await page.waitForTimeout(3000);
      
      // Try to wait for the gallery to be initialized
      try {
        await page.waitForFunction(() => {
          return (window as any).image_gallery || 
                 document.querySelector('#WG-Pictures .sp-slide');
        }, { timeout: 5000 });
      } catch (e) {
        // Gallery might not initialize, continue with extraction
      }
      
      // Enhanced image extraction with all formats
      const imageData = await page.evaluate(() => {
        // Structure to hold all image variants
        const imageVariants: any[] = [];
        
        // Check if image_gallery exists on window after waiting
        if ((window as any).image_gallery && (window as any).image_gallery.images) {
          imageVariants.push(...(window as any).image_gallery.images);
        }
        
        // Look for ImageGallery initialization in script tags
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
          const content = scripts[i].textContent || '';
          
          // Skip if script is too small or is external
          if (content.length < 100 || scripts[i].src) continue;
          
          // Look for the ImageGallery initialization that contains the images array
          if (content.includes('ImageGallery(') && content.includes('images')) {
            // Extract the images array using a more robust approach
            const imagesStart = content.indexOf('images');
            const colonIndex = content.indexOf(':', imagesStart);
            
            if (colonIndex !== -1) {
              // Find the opening bracket after the colon
              let bracketStart = -1;
              for (let j = colonIndex + 1; j < content.length; j++) {
                if (content[j] === '[') {
                  bracketStart = j;
                  break;
                }
              }
              
              if (bracketStart !== -1) {
                // Find the matching closing bracket
                let bracketCount = 1;
                let inString = false;
                let escapeNext = false;
                let bracketEnd = -1;
                
                for (let j = bracketStart + 1; j < content.length; j++) {
                  const char = content[j];
                  
                  if (escapeNext) {
                    escapeNext = false;
                    continue;
                  }
                  
                  if (char === '\\') {
                    escapeNext = true;
                    continue;
                  }
                  
                  if (char === '"' && !escapeNext) {
                    inString = !inString;
                    continue;
                  }
                  
                  if (!inString) {
                    if (char === '[') {
                      bracketCount++;
                    } else if (char === ']') {
                      bracketCount--;
                      if (bracketCount === 0) {
                        bracketEnd = j + 1;
                        break;
                      }
                    }
                  }
                }
                
                if (bracketEnd !== -1) {
                  const arrayStr = content.substring(bracketStart, bracketEnd);
                  try {
                    const imagesArray = JSON.parse(arrayStr);
                    
                    if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                      imageVariants.push(...imagesArray);
                    }
                  } catch (e) {
                    // Parsing failed, continue to next approach
                  }
                }
              }
            }
          }
          
          // Fallback: Look for simple image arrays
          const patterns = [
            /"images"\s*:\s*\[(.*?)\]/s,
            /'images'\s*:\s*\[(.*?)\]/s,
          ];
          
          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              try {
                const jsonStr = '[' + match[1] + ']';
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  imageVariants.push(...parsed);
                }
              } catch (e) {
                // Parsing failed, try next pattern
              }
            }
          }
        }
        
        // Process all variants to extract all possible URLs
        const processedImages: any[] = [];
        const seenIds = new Set<string>();
        
        for (const img of imageVariants) {
          if (!img || typeof img !== 'object') continue;
          
          // Use ID or create one from available data
          const imgId = img.id || img.original || JSON.stringify(img);
          if (seenIds.has(imgId)) continue;
          seenIds.add(imgId);
          
          const imageInfo: any = {
            variants: []
          };
          
          // Extract all available formats
          if (img.original) {
            imageInfo.variants.push({
              type: 'original',
              url: 'https://img.wg-gesucht.de/media/up/' + img.original
            });
          }
          
          if (img.large) {
            imageInfo.variants.push({
              type: 'large',
              url: 'https://img.wg-gesucht.de/' + img.large
            });
          }
          
          if (img.sized) {
            imageInfo.variants.push({
              type: 'sized',
              url: 'https://img.wg-gesucht.de/' + img.sized
            });
          }
          
          if (img.small) {
            imageInfo.variants.push({
              type: 'small',
              url: 'https://img.wg-gesucht.de/' + img.small
            });
          }
          
          if (img.thumb) {
            imageInfo.variants.push({
              type: 'thumb',
              url: 'https://img.wg-gesucht.de/' + img.thumb
            });
          }
          
          // Handle direct URLs
          if (img.url && typeof img.url === 'string') {
            imageInfo.variants.push({
              type: 'direct',
              url: img.url
            });
          }
          
          if (imageInfo.variants.length > 0) {
            processedImages.push(imageInfo);
          }
        }
        
        return processedImages;
      });
      
      console.log('🔍 Enhanced image extraction:', imageData ? `${imageData.length} images with variants found` : 'not found');
      
      // Extract all details in a single evaluate call for performance
      // Note: Everything inside evaluate must be self-contained - no external references
      // IMPORTANT: Avoid nested functions due to TypeScript transpilation issues
      const details = await page.evaluate(function(imageData) {
        var result = {};
        
        // Pass image data into the window object for access inside evaluate
        (window as any).__imageData = imageData;
        
        // Extract title (if not already available) - inline extraction to avoid nested functions
        var el = document.querySelector('.headline-detailed-view-title');
        result.title = el && el.textContent ? el.textContent.trim() : null;
        
        if (!result.title) {
          el = document.querySelector('h1');
          result.title = el && el.textContent ? el.textContent.trim() : null;
        }
        
        if (!result.title) {
          el = document.querySelector('.headline');
          result.title = el && el.textContent ? el.textContent.trim() : null;
        }
        
        // Extract description - using innerText to preserve formatting
        var descriptionSelectors = [
          '.freitext',
          '.description',
          '.panel_description',
          'div[id*="description"]',
          '.objektbeschreibung',
          '.ad-description'
        ];
        
        for (var i = 0; i < descriptionSelectors.length; i++) {
          var selector = descriptionSelectors[i];
          var descEl = document.querySelector(selector);
          if (descEl) {
            // Use innerText to preserve line breaks from <br> tags
            var innerText = descEl.innerText;
            if (innerText && innerText.trim().length > 10) {
              // Preserve exact formatting from the website
              // Only remove lines that are ads or scripts
              result.description = innerText
                .split('\n')
                .filter(function(line) { 
                  return !line.includes('googletag') && !line.includes('script');
                })
                .join('\n');
              break;
            }
          }
        }
        
        // Extract costs with proper separation
        var costs = {};
        
        // Try structured extraction first
        var costElements = document.querySelectorAll('.section_panel_value, .key_fact_value');
        for (var j = 0; j < costElements.length; j++) {
          var el = costElements[j];
          var parent = el.parentElement;
          var label = '';
          if (parent) {
            var keyEl = parent.querySelector('.section_panel_key');
            if (keyEl && keyEl.textContent) {
              label = keyEl.textContent.trim();
            } else if (parent.previousElementSibling && parent.previousElementSibling.textContent) {
              label = parent.previousElementSibling.textContent.trim();
            }
          }
          var value = el.textContent ? el.textContent.trim() : '';
          
          var valueMatch = value.match(/(\d+)\s*€/);
          if (valueMatch) {
            var amount = parseInt(valueMatch[1]);
            
            if (label.includes('Miete:') && !label.includes('Warmmiete')) {
              costs.coldRent = amount;
            } else if (label.includes('Warmmiete:') || label.includes('Gesamtmiete:')) {
              costs.warmRent = amount;
            } else if (label.includes('Nebenkosten:')) {
              costs.utilities = amount;
            } else if (label.includes('Kaution:')) {
              costs.deposit = amount;
            }
          }
        }
        
        // Fallback to text parsing
        var pageText = document.body.innerText || '';
        
        if (!costs.coldRent) {
          var coldMatch = pageText.match(/(?:Kaltmiete|Miete):\s*(\d+)\s*€/i);
          if (coldMatch) costs.coldRent = parseInt(coldMatch[1]);
        }
        
        if (!costs.utilities) {
          var utilMatch = pageText.match(/(?:Nebenkosten|NK):\s*(\d+)\s*€/i);
          if (utilMatch) costs.utilities = parseInt(utilMatch[1]);
        }
        
        if (!costs.warmRent) {
          var warmMatch = pageText.match(/(?:Warmmiete|Gesamtmiete):\s*(\d+)\s*€/i);
          if (warmMatch) costs.warmRent = parseInt(warmMatch[1]);
        }
        
        if (!costs.deposit) {
          // Check for "no deposit" patterns first
          const noDepositPatterns = [
            /keine\s*Kaution/i,
            /Kaution:\s*keine/i,
            /no\s*deposit/i,
            /ohne\s*Kaution/i,
            /Kaution:\s*-/i,
            /Kaution:\s*0\s*€/i
          ];
          
          let hasNoDeposit = false;
          for (const pattern of noDepositPatterns) {
            if (pageText.match(pattern)) {
              hasNoDeposit = true;
              break;
            }
          }
          
          if (hasNoDeposit) {
            costs.deposit = 0;
          } else {
            // Try to extract numeric deposit
            var depositMatch = pageText.match(/Kaution:\s*(\d+)\s*€/i);
            if (depositMatch) costs.deposit = parseInt(depositMatch[1]);
          }
        }
        
        // Calculate warm rent if missing but we have cold rent and utilities
        if (!costs.warmRent && costs.coldRent && costs.utilities) {
          costs.warmRent = costs.coldRent + costs.utilities;
        }
        
        result.costs = costs;
        
        // Extract size if not already available
        if (!result.size) {
          var sizeMatch = pageText.match(/(\d+)\s*(?:m\u00B2|qm)/i);
          if (sizeMatch) result.size = parseInt(sizeMatch[1]);
        }
        
        // Extract rooms with German number words - more specific patterns
        var roomPatterns = [
          /(\d+(?:[,.]?\d+)?)\s*(?:Zimmer|Zi\.)(?:\s|$)/i,
          /(ein|eine|zwei|drei|vier|fünf|sechs)[\s-]?(?:Zimmer|Zi\.)(?:\s|$)/i,
          /(\d+)[\s-]?(?:Raum|Räume)/i
        ];
        
        var germanNumbers = {
          'ein': 1, 'eine': 1, 'zwei': 2, 'drei': 3, 
          'vier': 4, 'fünf': 5, 'sechs': 6
        };
        
        for (var k = 0; k < roomPatterns.length; k++) {
          var pattern = roomPatterns[k];
          var match = pageText.match(pattern);
          if (match) {
            var value = match[1].toLowerCase();
            var numValue = germanNumbers[value] || parseFloat(value.replace(',', '.'));
            // Sanity check - rooms should be between 0.5 and 20
            if (numValue >= 0.5 && numValue <= 20) {
              result.rooms = numValue;
              break;
            }
          }
        }
        
        // Extract floor
        var floorMatch = pageText.match(/(\d+)\.\s*(?:Stock|Etage|OG)/i);
        if (floorMatch) result.floor = parseInt(floorMatch[1]);
        
        // Extract total floors
        var totalFloorsMatch = pageText.match(/(?:Anzahl der Stockwerke|Stockwerke|floors total):\s*(\d+)/i);
        if (!totalFloorsMatch) {
          // Try alternative pattern
          totalFloorsMatch = pageText.match(/(\d+)[\s-]?(?:stöckig|geschossig)/i);
        }
        if (totalFloorsMatch) result.totalFloors = parseInt(totalFloorsMatch[1]);
        
        // Extract dates
        var fromMatch = pageText.match(/(?:frei ab|verfügbar ab)[\s:]*(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
        if (fromMatch) result.availableFrom = fromMatch[1];
        
        var toMatch = pageText.match(/(?:bis|befristet bis)[\s:]*(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
        if (toMatch) result.availableTo = toMatch[1];
        
        // Extract contact details - inline extraction
        el = document.querySelector('.user_profile_name');
        var contactName = el && el.textContent ? el.textContent.trim() : null;
        
        if (!contactName) {
          el = document.querySelector('.rhs_contact_information strong');
          contactName = el && el.textContent ? el.textContent.trim() : null;
        }
        
        if (contactName) result.contactName = contactName;
        
        // Try to extract phone number from JavaScript data without clicking
        // Similar to how we extract image gallery data
        var phoneNumber = null;
        
        // Method 1: Check for phone data in window object
        if (window.contactData && window.contactData.phone) {
          phoneNumber = window.contactData.phone;
        }
        
        // Method 2: Look for phone in data attributes
        if (!phoneNumber) {
          var phoneButton = document.querySelector('button[data-phone], a[data-phone], [data-tel]');
          if (phoneButton) {
            phoneNumber = phoneButton.getAttribute('data-phone') || phoneButton.getAttribute('data-tel');
          }
        }
        
        // Method 3: Check for phone in onclick handlers or JavaScript
        if (!phoneNumber) {
          var showPhoneElements = document.querySelectorAll('[onclick*="phone"], [onclick*="tel"], [onclick*="handy"]');
          showPhoneElements.forEach(function(el) {
            var onclickText = el.getAttribute('onclick') || '';
            var phoneMatch = onclickText.match(/['"](\+?[\d\s\-\/]+)['"]/);
            if (phoneMatch && phoneMatch[1].length > 8) {
              phoneNumber = phoneMatch[1].trim();
            }
          });
        }
        
        // Method 4: Search in script tags for phone data
        if (!phoneNumber) {
          var scripts = document.querySelectorAll('script');
          for (var i = 0; i < scripts.length; i++) {
            var scriptText = scripts[i].textContent || '';
            // Look for patterns like phone: "01234567" or mobile: "01234567"
            var phonePatterns = [
              /["'](?:phone|mobile|handy|telefon)["']\s*:\s*["'](\+?[\d\s\-\/]+)["']/i,
              /["']tel["']\s*:\s*["'](\+?[\d\s\-\/]+)["']/i,
              /contact_phone["']\s*:\s*["'](\+?[\d\s\-\/]+)["']/i
            ];
            
            for (var j = 0; j < phonePatterns.length; j++) {
              var match = scriptText.match(phonePatterns[j]);
              if (match && match[1] && match[1].length > 8) {
                phoneNumber = match[1].trim();
                break;
              }
            }
            if (phoneNumber) break;
          }
        }
        
        // Method 5: Check AJAX endpoint URLs that might contain phone data
        if (!phoneNumber) {
          var ajaxLinks = document.querySelectorAll('a[href*="show_phone"], a[href*="contact_phone"], [data-ajax*="phone"]');
          ajaxLinks.forEach(function(link) {
            var href = link.getAttribute('href') || link.getAttribute('data-ajax') || '';
            // Sometimes phone is encoded in the URL
            var urlPhoneMatch = href.match(/phone=(\+?[\d\s\-\/]+)/);
            if (urlPhoneMatch) {
              phoneNumber = decodeURIComponent(urlPhoneMatch[1]);
            }
          });
        }
        
        // Method 6: Note - #phone_numbers_modal is typically hidden until button is clicked
        // So we can't extract phone from it without clicking the button first
        // Just note if the modal exists in the DOM
        if (!phoneNumber) {
          var phoneModal = document.querySelector('#phone_numbers_modal');
          if (phoneModal) {
            console.log('Phone modal found in DOM but likely hidden until clicked');
            // Store the user_id and asset_id for potential AJAX request
            result.phoneModalData = {
              userId: phoneModal.getAttribute('data-user_id'),
              assetId: phoneModal.getAttribute('data-asset_id'),
              assetType: phoneModal.getAttribute('data-asset_type'),
              modalExists: true
            };
          }
        }
        
        // Method 7: Look for phone button with data attributes that might reveal the endpoint
        if (!phoneNumber) {
          var phoneButtons = document.querySelectorAll('button[class*="phone"], a[class*="phone"], .contact_box_footer_button');
          phoneButtons.forEach(function(button) {
            // Check data attributes
            var dataAttrs = button.dataset;
            for (var key in dataAttrs) {
              if (dataAttrs[key] && dataAttrs[key].match(/^\+?[\d\s\-\/]+$/) && dataAttrs[key].length > 8) {
                phoneNumber = dataAttrs[key].trim();
                break;
              }
            }
            
            // Check if button has user/asset IDs for AJAX
            if (!phoneNumber && button.getAttribute('data-user_id')) {
              result.phoneButtonData = {
                userId: button.getAttribute('data-user_id'),
                assetId: button.getAttribute('data-asset_id'),
                assetType: button.getAttribute('data-asset_type')
              };
            }
          });
        }
        
        if (phoneNumber) {
          result.contactPhone = phoneNumber;
        }
        
        // Extract amenities - comprehensive extraction
        var amenities = {};
        
        // Basic features
        amenities.furnished = /möbliert|furnished|mobiliert/i.test(pageText);
        amenities.kitchen = /(?:Einbauküche|EBK|kitchen|Küche vorhanden)/i.test(pageText);
        amenities.balcony = /Balkon|balcony/i.test(pageText);
        amenities.terrace = /Terrasse|terrace/i.test(pageText);
        amenities.garden = /Garten|garden/i.test(pageText);
        amenities.basement = /(?:Keller|basement|cellar)/i.test(pageText);
        
        // Appliances
        amenities.washingMachine = /(?:Waschmaschine|washing machine|Waschküche)/i.test(pageText);
        amenities.dryer = /(?:Trockner|dryer|Wäschetrockner)/i.test(pageText);
        amenities.dishwasher = /(?:Spülmaschine|Geschirrspüler|dishwasher)/i.test(pageText);
        
        // Building features
        amenities.parking = /(?:Parkplatz|Stellplatz|parking|Tiefgarage)/i.test(pageText);
        amenities.elevator = /(?:Aufzug|Fahrstuhl|elevator|lift)/i.test(pageText);
        amenities.barrierFree = /(?:barrierefrei|barrier-free|rollstuhlgerecht|behindertengerecht)/i.test(pageText);
        
        // Internet & Utilities
        amenities.internetIncluded = /(?:Internet inklusive|Internet incl|WLAN inklusive|WiFi included)/i.test(pageText);
        amenities.heatingIncluded = /(?:Heizung inklusive|heating included|Heizkosten inklusive)/i.test(pageText);
        amenities.electricityIncluded = /(?:Strom inklusive|electricity included|Stromkosten inklusive)/i.test(pageText);
        
        // Rules
        amenities.petsAllowed = /(?:Haustiere erlaubt|pets allowed|Haustiere: Ja)/i.test(pageText);
        amenities.smokingAllowed = /(?:Rauchen erlaubt|smoking allowed|Raucher willkommen)/i.test(pageText);
        
        // Bathroom features
        amenities.bathtub = /(?:Badewanne|bathtub|Wanne)/i.test(pageText);
        amenities.shower = /(?:Dusche|shower)/i.test(pageText);
        amenities.guestToilet = /(?:Gäste-WC|guest toilet|Gästetoilette)/i.test(pageText);
        
        // Additional features
        amenities.floorHeating = /(?:Fußbodenheizung|floor heating|underfloor heating)/i.test(pageText);
        amenities.airConditioning = /(?:Klimaanlage|air conditioning|AC|Klima)/i.test(pageText);
        amenities.cableTv = /(?:Kabelfernsehen|cable TV|Kabel-TV)/i.test(pageText);
        
        result.amenities = amenities;
        
        // Extract gallery images - prefer JavaScript data if available
        var images = [];
        var seenUrls = {};
        
        // Note: imageData is passed from outside the evaluate function
        // Use JavaScript data if available, otherwise fall back to DOM extraction
        var hasJavaScriptData = window.__imageData !== null && window.__imageData !== undefined;
        
        if (hasJavaScriptData && window.__imageData.length > 0) {
          // Use the enhanced image data with all variants
          for (var i = 0; i < window.__imageData.length; i++) {
            var imageInfo = window.__imageData[i];
            
            if (imageInfo && imageInfo.variants && imageInfo.variants.length > 0) {
              // Store all variants for this image
              var imageWithVariants = {
                variants: [],
                primaryUrl: null
              };
              
              // Process each variant
              for (var v = 0; v < imageInfo.variants.length; v++) {
                var variant = imageInfo.variants[v];
                if (variant && variant.url) {
                  imageWithVariants.variants.push({
                    type: variant.type,
                    url: variant.url
                  });
                }
              }
              
              // Select primary URL (prefer large > sized > original > small > thumb)
              var typePreference = ['large', 'sized', 'original', 'small', 'thumb', 'direct'];
              for (var t = 0; t < typePreference.length; t++) {
                var found = false;
                for (var v = 0; v < imageWithVariants.variants.length; v++) {
                  if (imageWithVariants.variants[v].type === typePreference[t]) {
                    imageWithVariants.primaryUrl = imageWithVariants.variants[v].url;
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
              
              // If we have a primary URL, add to images
              if (imageWithVariants.primaryUrl && !seenUrls[imageWithVariants.primaryUrl]) {
                seenUrls[imageWithVariants.primaryUrl] = true;
                images.push(imageWithVariants.primaryUrl);
              }
            }
          }
        } else if (!hasJavaScriptData) {
          // Fallback: Enhanced DOM-based extraction - only if no JavaScript data available
          // Look for the main gallery/photo section specifically
          var mainContent = document.querySelector('#main_column, .main_content, [role="main"]');
          var gallerySection = document.querySelector('#WG-Pictures, .photo-gallery, .image-gallery, .slider-wrapper');
          
          // Check if this listing explicitly has no photos
          var noPhotosIndicator = document.querySelector('.no_pic_info, .no-images-message, [class*="no-photo"], .dummy_image');
          var hasDummyImage = document.querySelector('img[src*="dummy"], img[alt*="no photo"], img[alt*="Kein Foto"]');
          
          if (noPhotosIndicator || hasDummyImage) {
            // This listing has no photos, return empty array
            images = [];
          } else if (gallerySection) {
            // We have a gallery section, look for images within it
            var searchScope = gallerySection;
            // Look for images only within the proper scope
            var scopedImages = searchScope.querySelectorAll('img[src*="/media/"][src*="wg-gesucht.de"]');
            
            // Filter images to only those that look like listing photos
            for (var i = 0; i < scopedImages.length; i++) {
              var img = scopedImages[i];
              
              // Skip if image is in a recommendation/similar listing section
              var parentSection = img.closest('.similar-listings, .recommendations, .offer_list_item, .list-details-ad-container');
              if (parentSection) continue;
              
              // Skip tiny images (likely icons)
              if (img.width > 0 && img.width < 150) continue;
              
              // Skip placeholder/dummy images
              if (img.src.includes('dummy') || img.src.includes('placeholder')) continue;
              
              var url = img.src;
              
              // Check if image is in a link to get full size
              var link = img.closest('a');
              if (link && link.href && link.href.includes('/media/')) {
                url = link.href;
              }
              
              // Convert to highest quality
              var highQualityUrl = url
                .replace(/\/scaler\/\d+\/\d+\//, '/scaler/1920/1080/')
                .replace('.small.', '.sized.')
                .replace('_small.', '_sized.')
                .replace('.thumb.', '.sized.')
                .replace('_thumb.', '_sized.')
                .replace('.medium.', '.sized.')
                .replace('_medium.', '_sized.');
              
              if (!seenUrls[highQualityUrl]) {
                seenUrls[highQualityUrl] = true;
                images.push(highQualityUrl);
              }
            }
            
            // Also check for lazy-loaded images within scope
            var lazyImages = searchScope.querySelectorAll('[data-src*="/media/"][data-src*="wg-gesucht.de"], [data-lazy*="/media/"][data-lazy*="wg-gesucht.de"]');
            
            for (var j = 0; j < lazyImages.length; j++) {
              var lazyImg = lazyImages[j];
              
              // Skip if in recommendations
              var parentSection = lazyImg.closest('.similar-listings, .recommendations, .offer_list_item');
              if (parentSection) continue;
              
              var lazyUrl = lazyImg.getAttribute('data-src') || lazyImg.getAttribute('data-lazy');
              
              if (lazyUrl && !seenUrls[lazyUrl]) {
                // Convert to highest quality
                var highQualityUrl = lazyUrl
                  .replace(/\/scaler\/\d+\/\d+\//, '/scaler/1920/1080/')
                  .replace('.small.', '.sized.')
                  .replace('_small.', '_sized.')
                  .replace('.thumb.', '.sized.')
                  .replace('_thumb.', '_sized.')
                  .replace('.medium.', '.sized.')
                  .replace('_medium.', '_sized.');
                
                seenUrls[highQualityUrl] = true;
                images.push(highQualityUrl);
              }
            }
          } else {
            // No gallery section found and no JavaScript data - likely no photos
            images = [];
          }
        }
        
        result.images = images;
        
        // Extract WG-specific details
        var wgDetails = {};
        
        // Total flatmates
        var flatmatesMatch = pageText.match(/(\d+)er[\s-]?WG/i);
        if (flatmatesMatch) {
          wgDetails.totalFlatmates = parseInt(flatmatesMatch[1]);
        }
        
        // Age preferences
        var ageMatch = pageText.match(/(?:Alter|age):\s*(\d+)[\s-]+(?:bis|to|-)[\s-]+(\d+)/i);
        if (ageMatch) {
          wgDetails.ageRange = {};
          wgDetails.ageRange.min = parseInt(ageMatch[1]);
          wgDetails.ageRange.max = parseInt(ageMatch[2]);
        }
        
        // Gender preferences
        if (/nur\s+(?:Frauen|weiblich|women|female)/i.test(pageText)) {
          wgDetails.targetGender = 'female';
        } else if (/nur\s+(?:Männer|männlich|men|male)/i.test(pageText)) {
          wgDetails.targetGender = 'male';
        }
        
        result.wgDetails = Object.keys(wgDetails).length > 0 ? wgDetails : null;
        
        return result;
      }, imageData);
      
      // Parse dates if needed
      if (details.availableFrom && typeof details.availableFrom === 'string') {
        const [day, month, year] = details.availableFrom.split('.');
        if (day && month && year) {
          const fullYear = year.length === 2 ? '20' + year : year;
          details.availableFrom = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
      
      if (details.availableTo && typeof details.availableTo === 'string') {
        const [day, month, year] = details.availableTo.split('.');
        if (day && month && year) {
          const fullYear = year.length === 2 ? '20' + year : year;
          details.availableTo = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
      
      // Map costs to flat structure used by current implementation
      const enrichedListing: Partial<UniversalListing> = {
        description: details.description || '',
        price: details.costs?.coldRent || details.costs?.warmRent,
        warmRent: details.costs?.warmRent,
        additionalCosts: details.costs?.utilities,
        deposit: details.costs?.deposit,
        size: details.size,
        rooms: details.rooms,
        floor: details.floor,
        totalFloors: details.totalFloors,
        availableFrom: details.availableFrom,
        availableTo: details.availableTo,
        images: details.images || [],
        amenities: details.amenities || {},
        detailsScraped: true
      };
      
      // Update contact info if available
      if (details.contactName || details.contactPhone) {
        enrichedListing.contact = {};
        enrichedListing.contact.name = details.contactName || null;
        enrichedListing.contact.phone = details.contactPhone || null;
        enrichedListing.contact.email = null;
        enrichedListing.contact.company = null;
        enrichedListing.contact.isAgent = false;
      }
      
      // If we found a phone number from JavaScript/data attributes, log it
      if (details.contactPhone) {
        console.log('📞 Phone number extracted from page data:', details.contactPhone);
      }
      
      // Check if we captured phone data from AJAX responses
      if (!details.contactPhone && capturedPhoneData) {
        const phone = capturedPhoneData.mobile || capturedPhoneData.handy || 
                      capturedPhoneData.phone || capturedPhoneData.telephone;
        if (phone) {
          if (!enrichedListing.contact) {
            enrichedListing.contact = {};
          }
          enrichedListing.contact.phone = phone;
          console.log('📞 Phone number extracted from AJAX response:', phone);
        }
      }
      
      // Try to extract phone number by clicking button if we're logged in and didn't find it yet
      if (!details.contactPhone && !enrichedListing.contact?.phone) {
        try {
          // Check if we're logged in by looking for user menu or logout button
          const isLoggedIn = await page.evaluate(() => {
            return !!(document.querySelector('.logout_button, .user_menu, a[href*="logout"]'));
          });
          
          if (isLoggedIn) {
            // Check if modal exists in DOM (it's usually hidden until clicked)
            const modalExists = await page.$('#phone_numbers_modal') !== null;
            
            // Look for "Telefonnummer anzeigen" button
            const phoneButton = await page.locator('button, a').filter({ hasText: 'Telefonnummer anzeigen' }).first();
            const phoneButtonExists = await phoneButton.count() > 0;
            
            if (phoneButtonExists) {
              console.log('📞 Found phone number button, clicking...');
              
              // Click the button to open the modal or trigger data loading
              // Use force:true to click even if aria-hidden
              try {
                await phoneButton.click({ force: true });
              } catch (clickError) {
                console.log('⚠️ Force click failed, trying JavaScript click...');
                // Fallback: click using JavaScript
                await page.evaluate(() => {
                  const btn = Array.from(document.querySelectorAll('button, a')).find(el => 
                    el.textContent && el.textContent.includes('Telefonnummer anzeigen')
                  );
                  if (btn) (btn as HTMLElement).click();
                });
              }
              
              // Wait for modal to become visible (Bootstrap modal animation)
              await page.waitForSelector('#phone_numbers_modal.show, #phone_numbers_modal[style*="display: block"]', { timeout: 5000 });
              
              // Wait for any loading spinners to disappear
              await page.waitForFunction(() => {
                const modal = document.querySelector('#phone_numbers_modal');
                if (!modal) return false;
                const spinner = modal.querySelector('.spinner, .loading, [class*="spinner"], [class*="loading"]');
                return !spinner;
              }, { timeout: 10000 }).catch(() => {
                console.log('⚠️ Timeout waiting for spinner to disappear');
              });
              
              // Small delay for data to fully load
              await this.humanDelay(1000, 2000);
              
              // Extract phone numbers from the now-visible modal
              const phoneData = await page.evaluate(() => {
                const result: any = {};
                
                // Look for the visible modal
                const modal = document.querySelector('#phone_numbers_modal.show, #phone_numbers_modal[style*="display: block"]');
                if (!modal) {
                  console.log('Modal not visible after click');
                  return result;
                }
                
                // Look for mobile number
                const mobileEl = modal.querySelector('.mobile_number');
                if (mobileEl && mobileEl.textContent) {
                  result.mobile = mobileEl.textContent.trim();
                }
                
                // Look for landline number
                const phoneEl = modal.querySelector('.telephone_number');
                if (phoneEl && phoneEl.textContent) {
                  result.landline = phoneEl.textContent.trim();
                }
                
                // Fallback: look for any phone number in the modal
                if (!result.mobile && !result.landline) {
                  const modalBody = modal.querySelector('.modal-body');
                  if (modalBody) {
                    const text = modalBody.textContent || '';
                    // Match German phone formats
                    const phoneMatches = text.match(/(?:\+49|0)[\d\s\-\/]+\d/g);
                    if (phoneMatches && phoneMatches.length > 0) {
                      result.phone = phoneMatches[0].replace(/\s+/g, '').trim();
                    }
                  }
                }
                
                return result;
              });
              
              // Update contact info with phone numbers
              if (phoneData) {
                if (!enrichedListing.contact) {
                  enrichedListing.contact = {};
                }
                
                // Prefer mobile over landline
                if (phoneData.mobile) {
                  enrichedListing.contact.phone = phoneData.mobile;
                } else if (phoneData.landline) {
                  enrichedListing.contact.phone = phoneData.landline;
                } else if (phoneData.phone) {
                  enrichedListing.contact.phone = phoneData.phone;
                }
                
                console.log('✅ Phone number extracted from modal:', enrichedListing.contact.phone);
              }
              
              // Close the modal if it's still open
              const closeButton = await page.$('.modal-dialog .close, .modal-header button[data-dismiss="modal"]');
              if (closeButton) {
                await closeButton.click();
                await this.humanDelay(300, 500);
              }
            }
          } else {
            console.log('📞 Not logged in, skipping phone button click');
          }
        } catch (error) {
          console.log('📞 Could not extract phone number from modal:', error.message);
          // Continue without phone - it's optional
        }
      }
      
      // Add WG details to amenities (flat structure)
      if (details.wgDetails) {
        enrichedListing.amenities.wgSize = details.wgDetails.totalFlatmates;
        enrichedListing.amenities.wgTargetGender = details.wgDetails.targetGender;
        if (details.wgDetails.ageRange) {
          enrichedListing.amenities.wgAgeMin = details.wgDetails.ageRange.min;
          enrichedListing.amenities.wgAgeMax = details.wgDetails.ageRange.max;
        }
      }
      
      // Update amenity flags in the flat structure
      if (details.amenities) {
        enrichedListing.isFurnished = details.amenities.furnished;
        enrichedListing.hasKitchen = details.amenities.kitchen;
        enrichedListing.hasBalcony = details.amenities.balcony;
        enrichedListing.hasGarden = details.amenities.garden;
        enrichedListing.hasParking = details.amenities.parking;
        enrichedListing.allowsPets = details.amenities.petsAllowed;
        enrichedListing.allowsSmoking = details.amenities.smokingAllowed;
      }
      
      // Validate and filter image URLs if we have enhanced image data
      if (imageData && imageData.length > 0) {
        const validatedImages = await this.validateImageUrls(imageData, page);
        enrichedListing.images = validatedImages;
      }
      
      console.log('✅ Details extracted successfully');
      return enrichedListing;
      
    } catch (error) {
      console.error(`❌ Failed to scrape details from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Validate image URLs and return working ones with intelligent fallback
   */
  private async validateImageUrls(
    imageData: Array<{
      variants: Array<{
        type: string;
        url: string;
      }>;
    }>, 
    page: Page
  ): Promise<string[]> {
    const validatedUrls: string[] = [];
    const urlCache = new Map<string, boolean>();
    
    for (const imageInfo of imageData) {
      if (!imageInfo || !imageInfo.variants || imageInfo.variants.length === 0) continue;
      
      let foundWorkingUrl = false;
      const typePreference = ['large', 'sized', 'original', 'small', 'thumb', 'direct'];
      
      for (const preferredType of typePreference) {
        if (foundWorkingUrl) break;
        
        const variant = imageInfo.variants.find(v => v.type === preferredType);
        if (!variant || !variant.url) continue;
        
        const url = variant.url;
        
        if (urlCache.has(url)) {
          if (urlCache.get(url)) {
            validatedUrls.push(url);
            foundWorkingUrl = true;
          }
          continue;
        }
        
        try {
          const response = await fetch(url, { method: 'HEAD' });
          
          if (response.ok) {
            validatedUrls.push(url);
            urlCache.set(url, true);
            foundWorkingUrl = true;
          } else if (response.status === 404) {
            urlCache.set(url, false);
            
            const alternativeUrls: string[] = [];
            
            if (url.includes('.sized.')) {
              alternativeUrls.push(
                url.replace('.sized.', '.large.'),
                url.replace('.sized.', '.original.')
              );
            } else if (url.includes('.large.')) {
              alternativeUrls.push(
                url.replace('.large.', '.sized.'),
                url.replace('.large.', '.original.')
              );
            }
            
            for (const altUrl of alternativeUrls) {
              try {
                const altResponse = await fetch(altUrl, { method: 'HEAD' });
                if (altResponse.ok) {
                  validatedUrls.push(altUrl);
                  urlCache.set(altUrl, true);
                  foundWorkingUrl = true;
                  break;
                }
              } catch (altError) {
                console.log(`Alternative URL ${altUrl} also failed`);
              }
            }
          }
          
        } catch (error) {
          console.log(`⚠️ Failed to validate image URL: ${url}`);
          urlCache.set(url, false);
        }
        
        await this.humanDelay(50, 100);
      }
      
      if (!foundWorkingUrl && imageInfo.variants.length > 0) {
        const firstVariant = imageInfo.variants[0];
        if (firstVariant && firstVariant.url) {
          validatedUrls.push(firstVariant.url);
        }
      }
    }
    
    console.log(`✅ Validated ${validatedUrls.length} image URLs`);
    return validatedUrls;
  }

  /**
   * Enrich multiple listings with detail page information
   */
  async enrichListingsWithDetails(
    listings: UniversalListing[], 
    options: {
      maxConcurrent?: number;
      delayBetweenRequests?: number;
      skipOnError?: boolean;
    } = {}
  ): Promise<UniversalListing[]> {
    const {
      maxConcurrent = 3,
      delayBetweenRequests = 2000,
      skipOnError = true
    } = options;
    
    console.log(`📚 Enriching ${listings.length} listings with details...`);
    
    const browser = await this.createStealthBrowser();
    const context = await this.createStealthContext(browser);
    
    try {
      const enrichedListings: UniversalListing[] = [];
      
      // Process in batches to control concurrency
      for (let i = 0; i < listings.length; i += maxConcurrent) {
        const batch = listings.slice(i, i + maxConcurrent);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(listings.length / maxConcurrent)}`);
        
        const batchPromises = batch.map(async (listing, index) => {
          const page = await context.newPage();
          
          try {
            // Set up cookie consent handler for each page
            await this.setupCookieConsentHandler(page);
            
            // Add delay for rate limiting (stagger requests)
            if (index > 0) {
              await this.humanDelay(
                delayBetweenRequests * index, 
                delayBetweenRequests * index + 500
              );
            }
            
            // Scrape details
            const details = await this.scrapeListingDetails(listing.url, page);
            
            // Merge with existing listing data
            const enriched = {
              ...listing,
              ...details,
              lastUpdated: new Date()
            };
            
            return enriched;
            
          } catch (error) {
            console.error(`❌ Failed to enrich listing ${listing.id}:`, error);
            
            if (skipOnError) {
              // Return original listing without enrichment
              return listing;
            } else {
              throw error;
            }
          } finally {
            await page.close();
          }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        enrichedListings.push(...batchResults);
        
        // Rate limiting between batches
        if (i + maxConcurrent < listings.length) {
          console.log('⏳ Rate limiting pause...');
          await this.humanDelay(delayBetweenRequests * 2, delayBetweenRequests * 3);
        }
      }
      
      const successCount = enrichedListings.filter(l => l.detailsScraped).length;
      console.log(`\n✅ Enrichment complete: ${successCount}/${listings.length} listings enriched`);
      
      return enrichedListings;
      
    } finally {
      await context.close();
      await browser.close();
    }
  }
}