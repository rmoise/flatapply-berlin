import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { CaptchaHandler } from '../utils/captcha-handler';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface ScrapedListing {
  platform: string;
  externalId: string;
  url: string;
  title: string;
  description: string;
  price: number;
  size: number;
  rooms: number;
  district: string;
  availableFrom: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  contactProfileImage?: string;
  images: string[];
  amenities: Record<string, any>;
  scrapedAt: Date;
  allowsAutoApply: boolean;
}

export class WGGesuchtPlaywrightScraperV3 {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private supabase: any;
  private isLoggedIn: boolean = false;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async init() {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS === 'true' ? true : false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox'
      ]
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin'
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async handleCookieConsent(page: Page) {
    try {
      console.log('🍪 Checking for cookie consent...');
      await page.waitForTimeout(3000);
      
      const consentSelectors = [
        '#cmpbntyestxt',
        '#cmpwelcomebtnyes',
        '.cmpboxbtnyes',
        'button:has-text("Alle akzeptieren")'
      ];
      
      for (const selector of consentSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click({ force: true });
            console.log(`✅ Cookie consent accepted with: ${selector}`);
            await page.waitForTimeout(2000);
            return;
          }
        } catch (e) {}
      }
      console.log('ℹ️ No cookie consent needed');
    } catch (e) {
      console.log('⚠️ Error handling cookie consent:', e);
    }
  }
  
  async handleCaptchaIfPresent(page: Page): Promise<boolean> {
    try {
      // Skip CAPTCHA check if we're already logged in
      if (this.isLoggedIn && await page.locator('a[href*="logout"]').count() > 0) {
        return true;
      }
      
      const captchaDetected = await CaptchaHandler.detectCaptcha(page);
      if (captchaDetected.found) {
        return await CaptchaHandler.checkForCaptchaAndHandle(page, {
          timeout: 180000, // 3 minutes
          checkInterval: 3000,
          takeScreenshot: true
        });
      }
      return true;
    } catch (error) {
      console.error('❌ CAPTCHA handling failed:', error);
      return false;
    }
  }

  async login(page: Page): Promise<boolean> {
    const email = process.env.WG_GESUCHT_EMAIL;
    const password = process.env.WG_GESUCHT_PASSWORD;
    
    if (!email || !password) {
      console.log('⚠️ No WG-Gesucht credentials found');
      return false;
    }

    try {
      // Check if already logged in
      if (await page.locator('a[href*="logout"]').count() > 0) {
        console.log('✅ Already logged in!');
        this.isLoggedIn = true;
        return true;
      }

      console.log('🔐 Attempting login...');
      
      // Click login link
      await page.locator('a:has-text("Mein Konto")').first().click();
      await page.waitForTimeout(2000);
      
      // Fill and submit form
      await page.locator('input[name="login_email_username"]:visible').fill(email);
      await page.locator('input[name="login_password"]:visible').fill(password);
      
      // Submit the form
      await page.locator('input[type="submit"][value="Login"]:visible, #login_submit:visible').first().click();
      
      // Check for CAPTCHA AFTER submit (this is when it usually appears)
      if (process.env.SKIP_CAPTCHA_CHECK !== 'true') {
        await page.waitForTimeout(2000); // Give CAPTCHA time to appear
        await this.handleCaptchaIfPresent(page);
      }
      
      // Wait for login to complete
      await page.waitForTimeout(3000);
      
      if (await page.locator('a[href*="logout"]').count() > 0) {
        console.log('✅ Login successful!');
        this.isLoggedIn = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  }

  async scrapeWithNavigation(limit: number = 20): Promise<ScrapedListing[]> {
    const page = await this.context!.newPage();
    const listings: ScrapedListing[] = [];
    
    try {
      // Navigate to homepage and login
      console.log('🏠 Navigating to WG-Gesucht...');
      await page.goto('https://www.wg-gesucht.de/', {
        waitUntil: 'domcontentloaded'
      });
      
      await this.handleCookieConsent(page);
      
      // Only check for CAPTCHA if not disabled
      if (process.env.SKIP_CAPTCHA_CHECK !== 'true') {
        await this.handleCaptchaIfPresent(page);
      }
      
      await this.login(page);
      
      // Go to Berlin listings
      console.log('\n📋 Navigating to Berlin listings...');
      await page.goto('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html', {
        waitUntil: 'domcontentloaded'
      });
      
      // Check for CAPTCHA on listings page if enabled
      if (process.env.SKIP_CAPTCHA_CHECK !== 'true') {
        await this.handleCaptchaIfPresent(page);
      }
      
      await page.waitForSelector('.wgg_card', { timeout: 10000 });
      
      // Find first valid listing
      const firstListingLink = await this.findFirstValidListing(page);
      if (!firstListingLink) {
        console.error('❌ No valid listings found');
        return listings;
      }
      
      // Navigate to first listing
      await page.goto(firstListingLink, {
        waitUntil: 'domcontentloaded'
      });
      
      // Now scrape using "Nächstes Angebot" navigation
      for (let i = 0; i < limit; i++) {
        console.log(`\n📄 Scraping listing ${i + 1}/${limit}`);
        
        try {
          // Wait for page to load
          await page.waitForTimeout(3000);
          
          // Check for CAPTCHA on detail page if enabled
          if (process.env.SKIP_CAPTCHA_CHECK !== 'true') {
            const captchaHandled = await this.handleCaptchaIfPresent(page);
            if (!captchaHandled) {
              console.log('Skipping this listing due to CAPTCHA');
              continue;
            }
          }
          
          // Extract current listing data
          const listingData = await this.extractDetailPageData(page);
          
          if (listingData) {
            const currentUrl = page.url();
            const externalId = this.extractIdFromUrl(currentUrl);
            
            listings.push({
              platform: 'wg_gesucht',
              externalId,
              url: currentUrl,
              title: listingData.title,
              description: listingData.description,
              price: listingData.price,
              size: listingData.size,
              rooms: listingData.rooms,
              district: listingData.district,
              availableFrom: listingData.availableFrom,
              contactName: listingData.contactName,
              contactPhone: listingData.contactPhone,
              contactEmail: listingData.contactEmail,
              contactProfileImage: listingData.contactProfileImage,
              images: listingData.images,
              amenities: listingData.amenities,
              scrapedAt: new Date(),
              allowsAutoApply: false
            });
            
            console.log(`✅ Extracted: ${listingData.title}`);
            if (listingData.contactPhone) {
              console.log(`📱 Phone: ${listingData.contactPhone}`);
            }
          }
          
          // Handle any ads that might be blocking navigation - just once
          await this.handleAdsInGallery(page);
          
          // Scroll to the top to ensure navigation is visible
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(1000);
          
          // Try to navigate to next listing with multiple selectors
          const nextSelectors = [
            'a:has-text("Nächstes Angebot")',
            'a:has-text("nächstes Angebot")',
            'a:has-text("Nächste Anzeige")',
            'a:has-text("nächste Anzeige")',
            'a:has-text("Weiter")',
            'a[title*="nächst"]',
            'a[href*="next"]',
            '.navigation a:last-child',
            'a.btn:has-text("Weiter")',
            'a[title="Zum nächsten Angebot"]',
            // Look for arrow or navigation patterns
            'a:has-text("→")',
            'a:has-text("►")',
            'a[class*="next"]',
            'a[class*="forward"]'
          ];
          
          let navigated = false;
          for (const selector of nextSelectors) {
            const nextButton = page.locator(selector).first();
            const isVisible = await nextButton.isVisible();
            console.log(`🔍 Checking selector "${selector}": visible=${isVisible}`);
            
            if (isVisible) {
              console.log(`➡️ Navigating to next listing with: ${selector}`);
              try {
                // Scroll to the button to ensure it's clickable
                await nextButton.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);
                
                // Don't handle ads here to avoid loops
                
                await nextButton.click({ force: true });
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(3000);
                navigated = true;
                break;
              } catch (e) {
                console.log(`❌ Failed to click ${selector}: ${e}`);
                // Try handling ads again and retry
                await this.handleAdsInGallery(page);
              }
            }
          }
          
          if (!navigated) {
            console.log('❌ No next button found or navigation failed');
            break;
          }
          
        } catch (error) {
          console.error(`Error scraping listing ${i + 1}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      await page.close();
    }
    
    return listings;
  }

  private async findFirstValidListing(page: Page): Promise<string | null> {
    const listings = await page.locator('.wgg_card a.detailansicht').all();
    
    for (const listing of listings) {
      const href = await listing.getAttribute('href');
      if (href && !href.includes('housinganywhere') && !href.includes('spotahome')) {
        return href.startsWith('http') ? href : `https://www.wg-gesucht.de${href}`;
      }
    }
    
    return null;
  }

  private parseGermanDate(dateStr: string): string {
    try {
      // Replace dots with dashes and parse
      const parts = dateStr.split(/[.\s]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) {
          year = '20' + year;
        }
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    return '';
  }

  private async extractDetailPageData(page: Page): Promise<any> {
    try {
      // Helper function to validate property images
      const isValidPropertyImage = (src: string): boolean => {
        return !!(src && 
          !src.includes('placeholder') && 
          !src.includes('logo') &&
          !src.includes('avatar') &&
          !src.includes('profile') &&
          !src.includes('user_') &&
          !src.includes('icon') &&
          !src.includes('blank') &&
          !src.includes('/profilepics/') &&
          !src.includes('/users/') &&
          !src.includes('_thumb') &&
          !src.includes('default_') &&
          !src.includes('user-') &&
          !src.includes('noimage') &&
          src.includes('/') &&
          (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp')));
      };
      
      // Helper function to navigate through gallery
      const navigateThroughGallery = async (page: Page, imageSelector: string, uniqueImages: Set<string>): Promise<number> => {
        const nextBtnSelectors = [
          '.fotorama__arr--next:visible',
          '.pswp__button--arrow--right:visible',
          '.lb-next:visible',
          '.mfp-arrow-right:visible',
          '.carousel-control-next:visible',
          'button[aria-label="Next"]:visible'
        ];
        
        let navigationCount = 0;
        const maxImages = 20; // Reasonable limit
        
        for (const btnSelector of nextBtnSelectors) {
          const nextBtn = page.locator(btnSelector).first();
          if (await nextBtn.isVisible()) {
            for (let i = 0; i < maxImages && uniqueImages.size < maxImages; i++) {
              try {
                await nextBtn.click();
                await page.waitForTimeout(1500); // Wait for image to load
                
                const img = page.locator(imageSelector).first();
                if (await img.isVisible()) {
                  const src = await img.getAttribute('src');
                  if (src && isValidPropertyImage(src)) {
                    const sizeBefore = uniqueImages.size;
                    uniqueImages.add(src);
                    if (uniqueImages.size > sizeBefore) {
                      navigationCount++;
                    }
                  }
                }
              } catch (e) {
                break;
              }
            }
            break;
          }
        }
        
        return navigationCount;
      };
      
      // Helper function to close gallery
      const closeGallery = async (page: Page) => {
        const closeSelectors = [
          '.fotorama__fullscreen-icon--off:visible',
          '.pswp__button--close:visible',
          '.lb-close:visible',
          '.mfp-close:visible',
          '.modal-header .close:visible',
          'button[aria-label="Close"]:visible',
          '[data-dismiss="modal"]:visible'
        ];
        
        for (const selector of closeSelectors) {
          const closeBtn = page.locator(selector).first();
          if (await closeBtn.isVisible()) {
            console.log('🔒 Closing gallery with selector:', selector);
            await closeBtn.click();
            await page.waitForTimeout(1000);
            break;
          }
        }
      };
      
      // Scroll to load all content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Extract all data
      const data = await page.evaluate(() => {
        const result: any = {
          title: '',
          description: '',
          price: 0,
          size: 0,
          rooms: 0,
          district: '',
          availableFrom: '',
          contactName: '',
          images: [],
          amenities: {}
        };
        
        // Title
        const titleEl = document.querySelector('h1');
        result.title = titleEl?.textContent?.trim() || '';
        
        // Description - get full description from all relevant sections
        const descriptionParts = [];
        
        // Main description
        const mainDesc = document.querySelector('#ad_description_text, .freitext');
        if (mainDesc) {
          descriptionParts.push(mainDesc.textContent?.trim());
        }
        
        // Object description (Objektbeschreibung)
        const objectDesc = document.querySelector('#objektbeschreibung, .objektbeschreibung');
        if (objectDesc) {
          const text = objectDesc.textContent?.trim();
          if (text && !descriptionParts.includes(text)) {
            descriptionParts.push('Objektbeschreibung: ' + text);
          }
        }
        
        // WG life description (WG-Leben)
        const wgLife = document.querySelector('#wg_leben, .wg_leben');
        if (wgLife) {
          const text = wgLife.textContent?.trim();
          if (text && !descriptionParts.includes(text)) {
            descriptionParts.push('WG-Leben: ' + text);
          }
        }
        
        // Looking for (Gesucht wird)
        const lookingFor = document.querySelector('#gesucht_wird, .gesucht_wird');
        if (lookingFor) {
          const text = lookingFor.textContent?.trim();
          if (text && !descriptionParts.includes(text)) {
            descriptionParts.push('Gesucht wird: ' + text);
          }
        }
        
        // Additional info sections
        const additionalSections = document.querySelectorAll('.panel-body .freitext, .section_panel_body');
        additionalSections.forEach(section => {
          const text = section.textContent?.trim();
          if (text && text.length > 20 && !descriptionParts.some(part => part?.includes(text))) {
            descriptionParts.push(text);
          }
        });
        
        // Combine all parts
        result.description = descriptionParts.filter(Boolean).join('\n\n');
        
        // Price - look for rent amount
        const allText = document.body.textContent || '';
        const priceMatch = allText.match(/(\d{3,4})\s*€(?!.*Service|.*Gebühr|.*29,90)/i);
        if (priceMatch) {
          result.price = parseInt(priceMatch[1]);
        }
        
        // Size and rooms
        const sizeMatch = allText.match(/(\d+)\s*m²/);
        if (sizeMatch) {
          result.size = parseInt(sizeMatch[1]);
        }
        
        // Room extraction
        const roomMatch = allText.match(/(\d+(?:,\d+)?)\s*Zimmer/);
        if (roomMatch) {
          result.rooms = parseFloat(roomMatch[1].replace(',', '.'));
        } else if (allText.match(/WG-Zimmer|WG Zimmer/i)) {
          // WG-Zimmer typically means 1 room
          result.rooms = 1;
        } else if (allText.match(/Studio|1-Zimmer/i)) {
          result.rooms = 1;
        }
        
        // District/Location extraction
        // Look for location in the breadcrumb or location section
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
          const breadcrumbText = breadcrumb.textContent || '';
          // Extract district from breadcrumb (usually format: "WG-Gesucht > Berlin > District")
          const parts = breadcrumbText.split('>').map(p => p.trim());
          if (parts.length >= 3) {
            result.district = parts[2];
          }
        }
        
        // Try location info box
        if (!result.district) {
          const locationBox = document.querySelector('.col-sm-4 .panel-body h3');
          if (locationBox && locationBox.textContent) {
            result.district = locationBox.textContent.trim();
          }
        }
        
        // Try to find in the main content
        if (!result.district) {
          // Look for "Stadtteil:" or similar patterns
          const stadteilMatch = allText.match(/(?:Stadtteil|Bezirk|Kiez):\s*([^,\n]+)/i);
          if (stadteilMatch) {
            result.district = stadteilMatch[1].trim();
          }
        }
        
        // Default to Berlin if no specific district found
        if (!result.district && allText.includes('Berlin')) {
          result.district = 'Berlin';
        }
        
        // Available from date - extract raw date string
        const availableMatch = allText.match(/(?:frei ab|verfügbar ab|available from)[:\s]*([0-9]{1,2}[.\s][0-9]{1,2}[.\s][0-9]{2,4})/i);
        if (availableMatch) {
          result.availableFrom = availableMatch[1].trim();
        } else {
          // Try another pattern
          const dateMatch = allText.match(/ab\s+([0-9]{1,2}[.\s][0-9]{1,2}[.\s][0-9]{2,4})/i);
          if (dateMatch) {
            result.availableFrom = dateMatch[1].trim();
          }
        }
        
        // Contact name - look in profile section with multiple selectors
        const profileSelectors = [
          '.rhs_contact_information .headline-name-title', // Profile name
          '.rhs_contact_information h1',                   // Alternative profile name
          '.headline-name',                                 // General headline
          '.text-capitalise',                              // Capitalized text
          '.profile_name_left',                            // Left profile name
          '.col-sm-4 .panel h3',                          // Panel header
          'a[href*="/users/"] .text-capitalise',          // User link
          '.contact-box-heading',                          // Contact box heading
          '.profile-name',                                 // Direct profile name
          'div[data-qa="profile-name"]'                   // QA selector
        ];
        
        for (const selector of profileSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const name = element.textContent.trim();
            // Filter out generic text
            if (name && !name.match(/mitglied seit|member since|nachricht|message/i)) {
              result.contactName = name;
              break;
            }
          }
        }
        
        // Also check for company/professional names like "URBANELITE.COM"
        if (!result.contactName) {
          // Look in the title or description for company names
          const companyMatch = result.title.match(/^([A-Z][A-Z0-9.\s-]+(?:\.COM|\.DE)?)\s*(?:\/\/|$)/);
          if (companyMatch) {
            result.contactName = companyMatch[1].trim();
          }
        }
        
        // Amenities - extract from feature lists
        result.amenities = {};
        const amenityElements = document.querySelectorAll('.objekteigenschaften li, .ausstattung li, ul.ul-detailed-view-datasheet li');
        amenityElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) {
            // Common amenities mapping
            if (text.match(/balkon/i)) result.amenities.balcony = true;
            if (text.match(/garten/i)) result.amenities.garden = true;
            if (text.match(/keller/i)) result.amenities.basement = true;
            if (text.match(/aufzug|fahrstuhl/i)) result.amenities.elevator = true;
            if (text.match(/möbliert|furnished/i)) result.amenities.furnished = true;
            if (text.match(/küche|einbauküche/i)) result.amenities.kitchen = true;
            if (text.match(/spülmaschine|dishwasher/i)) result.amenities.dishwasher = true;
            if (text.match(/waschmaschine|washing/i)) result.amenities.washingMachine = true;
            if (text.match(/internet|wlan|wifi/i)) result.amenities.internet = true;
            if (text.match(/parkplatz|parking/i)) result.amenities.parking = true;
            if (text.match(/haustiere|pets/i)) result.amenities.petsAllowed = true;
          }
        });
        
        // Images - initially empty, will be populated from gallery interaction
        // We don't extract images from the main page to avoid profile pictures
        result.images = [];
        
        return result;
      });
      
      // Phone extraction (requires interaction)
      let contactPhone = '';
      
      // Check if phone already visible
      const phoneLink = page.locator('a[href^="tel:"]').first();
      if (await phoneLink.count() > 0) {
        const href = await phoneLink.getAttribute('href');
        contactPhone = href?.replace('tel:', '').trim() || '';
      } else {
        // Try to click phone button
        const phoneBtn = page.locator('a:text("Telefonnummer anzeigen")').first();
        if (await phoneBtn.isVisible()) {
          await phoneBtn.click();
          await page.waitForTimeout(3000);
          
          // Check again for phone
          const newPhoneLink = page.locator('a[href^="tel:"]').first();
          if (await newPhoneLink.count() > 0) {
            const href = await newPhoneLink.getAttribute('href');
            contactPhone = href?.replace('tel:', '').trim() || '';
          }
        }
      }
      
      // Simple and robust image extraction
      let galleryImages: string[] = [];
      
      console.log('🔍 Extracting images from listing page...');
      
      // Extract all available images from the page
      galleryImages = await this.extractImagesFromPage(page);
      
      if (galleryImages.length > 0) {
        console.log(`✅ Found ${galleryImages.length} property images`);
      } else {
        console.log('⚠️ No images found, attempting gallery extraction...');
        
        // Try to find and click the gallery button first
        const gallerySelectors = [
          'a:has-text("Weiter zu den Wohnungsfotos")',
          'button:has-text("Weiter zu den Wohnungsfotos")',
          'a:has-text("Zu den Fotos")',
          'button:has-text("Zu den Fotos")',
          'img.sp-image',
          '.sp-image-container'
        ];
        
        let galleryOpened = false;
        for (const selector of gallerySelectors) {
          const galleryElement = page.locator(selector).first();
          if (await galleryElement.isVisible()) {
            try {
              console.log(`🖼️ Opening gallery with: ${selector}`);
              await galleryElement.click();
              await page.waitForTimeout(4000); // Wait for gallery to load
              galleryOpened = true;
              break;
            } catch (e) {
              console.log(`❌ Failed to click ${selector}: ${e}`);
            }
          }
        }
        
        if (galleryOpened) {
          // Handle any ads that might appear
          await this.handleAdsInGallery(page);
          
          // Extract from gallery if it opened
          const galleryImages2 = await this.extractGalleryImages(page);
          if (galleryImages2.length > 0) {
            galleryImages = galleryImages2;
            console.log(`✅ Extracted ${galleryImages.length} images from gallery`);
          }
          
          // Close gallery
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        } else {
          console.log('⚠️ No gallery button found or failed to open gallery');
        }
      }
      
      // Parse German date format if we have one
      if (data.availableFrom) {
        data.availableFrom = this.parseGermanDate(data.availableFrom);
      }
      
      return {
        ...data,
        contactPhone,
        images: galleryImages.length > 0 ? galleryImages : (data.images || [])
      };
      
    } catch (error) {
      console.error('Error extracting detail page data:', error);
      return null;
    }
  }

  private async extractImagesFromPage(page: Page): Promise<string[]> {
    try {
      const images = new Set<string>();
      
      // Wait for images to load
      await page.waitForTimeout(2000);
      
      console.log('🔍 Scanning SliderPro gallery for property images...');
      
      // First, try to extract from SliderPro gallery (based on the HTML you provided)
      const sliderImages = await page.locator('.sp-slides .sp-slide img.sp-image').all();
      if (sliderImages.length > 0) {
        console.log(`  Found ${sliderImages.length} SliderPro gallery images`);
        
        for (const img of sliderImages) {
          try {
            // SliderPro uses data attributes for different image sizes
            let src = await img.getAttribute('data-large') || // High res
                     await img.getAttribute('data-medium') || // Medium res
                     await img.getAttribute('data-default') || // Default
                     await img.getAttribute('src'); // Fallback
            
            if (src && this.isValidPropertyImage(src)) {
              // Convert relative URLs to absolute
              if (src.startsWith('./')) {
                src = 'https://img.wg-gesucht.de/' + src.substring(2);
              } else if (src.startsWith('/')) {
                src = 'https://img.wg-gesucht.de' + src;
              } else if (src.startsWith('//')) {
                src = 'https:' + src;
              } else if (!src.startsWith('http')) {
                src = 'https://img.wg-gesucht.de/' + src;
              }
              
              // Clean up URLs with /./  pattern
              src = src.replace('/./media/', '/media/');
              
              images.add(src);
              console.log(`    ✅ SliderPro image: ${src.split('/').pop()}`);
            }
          } catch (e) {}
        }
      }
      
      // If SliderPro didn't work, try other selectors
      if (images.size === 0) {
        console.log('🔍 Scanning page for other property images...');
        
        const imageSelectors = [
          'img.sp-image', // Main image
          '.fotorama__stage img', // Fotorama carousel
          '.carousel-inner img', // Bootstrap carousel
          'img[src*="/media/up/"]', // WG-Gesucht media uploads
          'img[src*="/up/"]', // Short upload path
          'img[data-large]', // High-res data attribute
          'img[data-src]', // Lazy loaded images
          'img[alt*="Zimmer"]', // German room images
          'img[title*="Zimmer"]' // German room titles
        ];
        
        for (const selector of imageSelectors) {
          const imgs = await page.locator(selector).all();
          if (imgs.length > 0) {
            console.log(`  Found ${imgs.length} images with selector: ${selector}`);
          }
          
          for (const img of imgs) {
            try {
              const isVisible = await img.isVisible();
              console.log(`    📷 Image visible: ${isVisible}`);
              
              // Try multiple attributes for image source
              let src = await img.getAttribute('src') ||
                       await img.getAttribute('data-large') ||
                       await img.getAttribute('data-src') ||
                       await img.getAttribute('data-medium') ||
                       await img.getAttribute('data-default');
              
              console.log(`    📷 Image src: ${src}`);
                
              if (src) {
                const isValid = this.isValidPropertyImage(src);
                console.log(`    🔍 Checking: ${src.split('/').pop()} - Valid: ${isValid}`);
                
                if (isValid) {
                  // Convert relative URLs to absolute
                  if (src.startsWith('./')) {
                    src = 'https://img.wg-gesucht.de/' + src.substring(2);
                  } else if (src.startsWith('/')) {
                    src = 'https://img.wg-gesucht.de' + src;
                  } else if (src.startsWith('//')) {
                    src = 'https:' + src;
                  } else if (!src.startsWith('http')) {
                    src = 'https://img.wg-gesucht.de/' + src;
                  }
                  
                  // Clean up URLs with /./  pattern
                  src = src.replace('/./media/', '/media/');
                  
                  images.add(src);
                  console.log(`    ✅ Added image: ${src.split('/').pop()}`);
                }
              }
            } catch (e) {
              console.log(`    ❌ Error processing image: ${e}`);
            }
          }
        }
      }
      
      // Try to click fullscreen button and extract from fullscreen gallery
      if (images.size < 5) {
        console.log('🖼️ Attempting to open fullscreen gallery...');
        try {
          const fullscreenBtn = page.locator('.sp-full-screen-button').first();
          if (await fullscreenBtn.isVisible()) {
            await fullscreenBtn.click();
            await page.waitForTimeout(3000);
            
            // Close any ads
            await this.handleAdsInGallery(page);
            
            // Extract from fullscreen
            const fullscreenImages = await this.extractFullscreenGalleryImages(page);
            fullscreenImages.forEach(img => images.add(img));
            
            // Close fullscreen
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          console.log('⚠️ Fullscreen gallery failed:', e.message);
        }
      }
      
      const result = Array.from(images);
      console.log(`📸 Total valid images found: ${result.length}`);
      return result;
      
    } catch (error) {
      console.log('Error extracting images from page:', error);
      return [];
    }
  }

  private async extractFullscreenGalleryImages(page: Page): Promise<string[]> {
    const images = new Set<string>();
    
    // Navigate through fullscreen gallery
    for (let i = 0; i < 20; i++) {
      // Get current image
      const currentImg = page.locator('.sp-slides .sp-slide.sp-selected img.sp-image').first();
      if (await currentImg.isVisible()) {
        const src = await currentImg.getAttribute('data-large') ||
                   await currentImg.getAttribute('src');
        if (src && this.isValidPropertyImage(src)) {
          images.add(src);
          console.log(`    📸 Fullscreen image: ${src.split('/').pop()}`);
        }
      }
      
      // Try to go to next image
      const nextArrow = page.locator('.sp-arrow.sp-next-arrow').first();
      if (await nextArrow.isVisible()) {
        await nextArrow.click();
        await page.waitForTimeout(1500);
        await this.handleAdsInGallery(page);
      } else {
        break;
      }
    }
    
    return Array.from(images);
  }

  private async handleAdsInGallery(page: Page): Promise<void> {
    // More comprehensive ad selectors
    const adSelectors = [
      '.ad-close',
      '.advertisement .close',
      '[aria-label="Close ad"]',
      '.popup-close',
      '.banner-close',
      '.modal .close',
      'button:has-text("×")',
      'button:has-text("Close")',
      'button:has-text("Schließen")',
      '.overlay .close',
      '[data-dismiss="modal"]',
      '.popup button',
      '.ad-banner .close',
      'iframe[src*="doubleclick"]', // Block iframe ads
      'iframe[src*="googleads"]',
      'button:has-text("✕")',
      'button:has-text("×")',
      '.fancybox-close'
    ];
    
    // Try to close ads - only once per call
    let adClosed = false;
    for (const adSelector of adSelectors) {
      const adClose = page.locator(adSelector).first();
      if (await adClose.isVisible()) {
        console.log(`🚫 Closing ad with: ${adSelector}`);
        try {
          await adClose.click();
          await page.waitForTimeout(500);
          adClosed = true;
          break; // Only close one ad per call
        } catch (e) {
          console.log(`❌ Failed to close ad: ${e.message}`);
        }
      }
    }
    
    if (!adClosed) {
      console.log('ℹ️ No ads found to close');
    }
  }

  private async extractGalleryImages(page: Page): Promise<string[]> {
    const images = new Set<string>();
    
    // Gallery-specific image selectors
    const gallerySelectors = [
      '.fotorama--fullscreen img',
      '.fotorama__active img',
      '.fotorama__img',
      '.pswp__img',
      '.lb-image',
      '.mfp-img',
      '.modal.show img',
      '.gallery-modal img'
    ];
    
    // First, get current visible image
    for (const selector of gallerySelectors) {
      const img = page.locator(selector).first();
      if (await img.isVisible()) {
        const src = await img.getAttribute('src');
        if (src && this.isValidPropertyImage(src)) {
          images.add(src);
          console.log(`📸 Gallery image: ${src.split('/').pop()}`);
          
          // Try to navigate through gallery
          await this.navigateGallery(page, selector, images);
          break;
        }
      }
    }
    
    return Array.from(images);
  }

  private async navigateGallery(page: Page, imageSelector: string, images: Set<string>): Promise<void> {
    console.log('🔄 Navigating through gallery...');
    
    for (let i = 0; i < 15; i++) {
      // Try different navigation methods
      let navigated = false;
      
      // Method 1: Arrow keys
      try {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(2000);
        navigated = true;
      } catch (e) {
        // Method 2: Click next button
        const nextButtons = [
          '.fotorama__arr--next',
          '.pswp__button--arrow--right',
          '.lb-next',
          '[aria-label="Next"]'
        ];
        
        for (const btnSelector of nextButtons) {
          const btn = page.locator(btnSelector).first();
          if (await btn.isVisible()) {
            try {
              await btn.click();
              await page.waitForTimeout(2000);
              navigated = true;
              break;
            } catch (e) {}
          }
        }
      }
      
      if (!navigated) break;
      
      // Handle ads again
      await this.handleAdsInGallery(page);
      
      // Get new image
      const img = page.locator(imageSelector).first();
      if (await img.isVisible()) {
        const src = await img.getAttribute('src');
        if (src && this.isValidPropertyImage(src)) {
          const sizeBefore = images.size;
          images.add(src);
          if (images.size > sizeBefore) {
            console.log(`  📸 New image: ${src.split('/').pop()}`);
          }
        }
      }
    }
  }

  private async closeGallery(page: Page): Promise<void> {
    console.log('🔒 Closing gallery...');
    
    // Try ESC first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Try close buttons
    const closeSelectors = [
      '.fotorama__fullscreen-icon--off',
      '.pswp__button--close',
      '.lb-close',
      '.mfp-close',
      '.modal-header .close',
      'button[aria-label="Close"]'
    ];
    
    for (const selector of closeSelectors) {
      const closeBtn = page.locator(selector).first();
      if (await closeBtn.isVisible()) {
        try {
          await closeBtn.click();
          await page.waitForTimeout(1000);
          break;
        } catch (e) {}
      }
    }
  }

  private isValidPropertyImage(src: string): boolean {
    if (!src) return false;
    
    const srcLower = src.toLowerCase();
    return !!(src && 
      !srcLower.includes('placeholder') && 
      !srcLower.includes('logo') &&
      !srcLower.includes('avatar') &&
      !srcLower.includes('profile') &&
      !srcLower.includes('user_') &&
      !srcLower.includes('icon') &&
      !srcLower.includes('blank') &&
      !srcLower.includes('/profilepics/') &&
      !srcLower.includes('/users/') &&
      !srcLower.includes('_thumb') &&
      !srcLower.includes('default_') &&
      !srcLower.includes('user-') &&
      !srcLower.includes('noimage') &&
      !srcLower.includes('plus.png') &&
      src.includes('/') &&
      (srcLower.includes('.jpg') || srcLower.includes('.jpeg') || srcLower.includes('.png') || srcLower.includes('.webp') || srcLower.includes('.sized.jpeg')));
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/([0-9]+)\.html/);
    return match ? `wg_${match[1]}` : `wg_${Date.now()}`;
  }

  async scrape(filters?: any): Promise<{ listings: ScrapedListing[]; totalFound: number; errors: string[] }> {
    try {
      await this.init();
      
      const limit = filters?.limit || process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT!) : 20;
      console.log(`🚀 Starting scraper with navigation (limit: ${limit})...\n`);
      
      const listings = await this.scrapeWithNavigation(limit);
      
      console.log(`\n✅ Successfully scraped ${listings.length} listings`);
      
      // Save to database with automatic match creation
      if (listings.length > 0) {
        await this.saveListingsWithMatches(listings);
      }
      
      return { 
        listings,
        totalFound: listings.length,
        errors: []
      };
      
    } catch (error) {
      console.error('Scraping failed:', error);
      return { 
        listings: [],
        totalFound: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      await this.cleanup();
    }
  }
  
  async saveListingsWithMatches(listings: ScrapedListing[]) {
    console.log('\n💾 Saving listings to database...');
    
    // Get all profiles for match creation
    const { data: profiles } = await this.supabase
      .from('profiles')
      .select('id, email');
    
    let savedCount = 0;
    let updatedCount = 0;
    const newListingIds = [];

    for (const listing of listings) {
      try {
        const { data: existing } = await this.supabase
          .from('listings')
          .select('id')
          .eq('platform', listing.platform)
          .eq('external_id', listing.externalId)
          .single();

        const listingData = {
          platform: listing.platform,
          external_id: listing.externalId,
          url: listing.url,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          size_sqm: listing.size,
          rooms: listing.rooms,
          district: listing.district,
          available_from: listing.availableFrom,
          contact_name: listing.contactName,
          contact_phone: listing.contactPhone,
          contact_email: listing.contactEmail,
          contact_profile_image: listing.contactProfileImage,
          images: listing.images,
          amenities: listing.amenities,
          scraped_at: new Date().toISOString(),
          is_active: true
        };

        if (existing) {
          await this.supabase
            .from('listings')
            .update(listingData)
            .eq('id', existing.id);
          updatedCount++;
        } else {
          const { data: newListing } = await this.supabase
            .from('listings')
            .insert(listingData)
            .select()
            .single();
          
          if (newListing) {
            savedCount++;
            newListingIds.push(newListing.id);
          }
        }
      } catch (error) {
        console.error(`Error saving listing:`, error);
      }
    }

    console.log(`✅ Saved ${savedCount} new, updated ${updatedCount} existing listings`);

    // Create matches for new listings
    if (newListingIds.length > 0 && profiles?.length > 0) {
      console.log(`\n🔗 Creating matches for new listings...`);
      
      for (const profile of profiles) {
        const matchData = newListingIds.map(listingId => ({
          user_id: profile.id,
          listing_id: listingId,
          match_score: Math.floor(Math.random() * 20) + 80,
          matched_at: new Date().toISOString()
        }));

        await this.supabase
          .from('user_matches')
          .insert(matchData)
          .select();
      }
      
      console.log(`✅ Created matches for ${profiles.length} users`);
    }
  }
}

// Export for use
export default WGGesuchtPlaywrightScraperV3;