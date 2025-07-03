import { Page } from 'playwright';
import { 
  BasePlatformScraper, 
  ListingIdentifier, 
  SearchFilters, 
  RawListing, 
  DetailedListing,
  PlatformSelectors 
} from '../core/base-scraper';
import { 
  UniversalListing, 
  PropertyType, 
  ListingStatus, 
  StandardAmenities 
} from '../core/models';
import { browserPool } from '../core/browser-pool';

export class WGGesuchtUnifiedScraper extends BasePlatformScraper {
  readonly platform = 'wg_gesucht';
  readonly baseUrl = 'https://www.wg-gesucht.de';
  
  readonly selectors: PlatformSelectors = {
    listings: '.offer_list_item[data-id]',
    title: '.headline-list-view a, h3.truncate_title',
    price: '.detail-size-price-wrapper',
    size: '.detail-size-price-wrapper',
    rooms: '.detail-size-price-wrapper',
    district: '.col-xs-11 span:nth-child(2)',
    nextPage: 'a.page-link',
    cookieConsent: '#cmpbntyestxt, [data-cc-event="click:dismiss"]'
  };
  
  private credentials = {
    email: process.env.WG_GESUCHT_EMAIL,
    password: process.env.WG_GESUCHT_PASSWORD
  };
  
  /**
   * Parse WG-Gesucht URL to extract listing ID
   */
  async parseListingUrl(url: string): Promise<ListingIdentifier> {
    const match = url.match(/\.(\d+)\.html/);
    const externalId = match ? match[1] : '';
    
    return {
      platform: this.platform,
      externalId,
      url: url.startsWith('http') ? url : `${this.baseUrl}${url}`
    };
  }
  
  /**
   * Build search URL with filters
   */
  async buildSearchUrl(filters: SearchFilters, page: number = 1): Promise<string> {
    // Combined search for all property types
    const baseSearchUrl = `${this.baseUrl}/wg-zimmer-und-1-zimmer-wohnungen-und-wohnungen-in-Berlin.8.0+1+2.${page}.0.html`;
    
    const url = new URL(baseSearchUrl);
    
    // Add filters
    url.searchParams.set('offer_filter', '1');
    url.searchParams.set('noDeact', '1');
    url.searchParams.set('city_id', '8');
    url.searchParams.set('sort_order', '0');
    
    // Categories
    url.searchParams.append('categories[]', '0'); // WG rooms
    url.searchParams.append('categories[]', '1'); // 1-room apartments
    url.searchParams.append('categories[]', '2'); // Apartments
    
    // Rent filters
    if (filters.minRent) {
      url.searchParams.set('rent_from', filters.minRent.toString());
    }
    if (filters.maxRent) {
      url.searchParams.set('rent_to', filters.maxRent.toString());
    }
    
    // Room filters
    if (filters.minRooms) {
      url.searchParams.set('zimmer_min', filters.minRooms.toString());
    }
    if (filters.maxRooms) {
      url.searchParams.set('zimmer_max', filters.maxRooms.toString());
    }
    
    return url.toString();
  }
  
  /**
   * Extract listings from search page
   */
  async extractListingsFromSearchPage(page: Page): Promise<RawListing[]> {
    await page.waitForSelector(this.selectors.listings, { timeout: 10000 });
    
    return await page.evaluate((selectors) => {
      const listings: RawListing[] = [];
      const elements = document.querySelectorAll(selectors.listings);
      
      elements.forEach((element: any) => {
        const dataId = element.getAttribute('data-id');
        if (!dataId) return;
        
        // Get URL
        const linkElement = element.querySelector('a[href*="/wg-zimmer"], a[href*="/wohnungen"], a[href*="/1-zimmer"]');
        if (!linkElement) return;
        
        const href = linkElement.getAttribute('href') || '';
        const url = href.startsWith('http') ? href : 'https://www.wg-gesucht.de' + href;
        
        // Get title
        const titleElement = element.querySelector('.headline-list-view a, h3.truncate_title');
        const title = titleElement?.textContent?.trim() || '';
        
        // Extract basic info from text
        const listingText = element.textContent || '';
        
        // Price
        const priceMatch = listingText.match(/(\d+)\s*€/);
        const price = priceMatch ? parseInt(priceMatch[1]) : null;
        
        // Size
        const sizeMatch = listingText.match(/(\d+)\s*m²/);
        const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
        
        // Rooms
        let rooms = null;
        const roomMatch = listingText.match(/(\d+)[\s-]?(?:Zimmer|Zi\.|room)/i);
        if (roomMatch) {
          rooms = parseInt(roomMatch[1]);
        } else if (title.toLowerCase().includes('studio') || title.includes('1-Zimmer')) {
          rooms = 1;
        }
        
        // Location
        const locationElement = element.querySelector('.col-xs-11 span:nth-child(2)');
        const locationText = locationElement?.textContent?.trim() || '';
        
        // Parse location
        let district = '';
        let address = '';
        if (locationText) {
          const parts = locationText.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            district = parts[parts.length - 2].replace(/^Berlin\s*/i, '').trim();
            address = parts[parts.length - 1].trim();
          }
        }
        
        // Thumbnail
        const imgElement = element.querySelector('img[src*="/scaler/"]');
        const thumbnailUrl = imgElement?.getAttribute('src') || undefined;
        
        listings.push({
          externalId: dataId,
          url,
          title,
          price,
          size,
          rooms,
          district,
          address,
          thumbnailUrl
        });
      });
      
      return listings;
    }, this.selectors);
  }
  
  /**
   * Extract detailed data from listing page
   */
  async extractDetailPageData(page: Page, url: string): Promise<DetailedListing> {
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Extract all data
    const data = await page.evaluate(() => {
      const result: any = {
        title: '',
        description: '',
        price: 0,
        size: 0,
        rooms: 0,
        district: '',
        address: '',
        availableFrom: null,
        contactName: '',
        images: [],
        amenities: {}
      };
      
      // Title
      const titleEl = document.querySelector('h1');
      result.title = titleEl?.textContent?.trim() || '';
      
      // Full description
      const descriptionParts = [];
      
      // Main description
      const mainDesc = document.querySelector('#ad_description_text, .freitext');
      if (mainDesc) {
        descriptionParts.push(mainDesc.textContent?.trim());
      }
      
      // Additional sections
      const sections = [
        { selector: '#objektbeschreibung', prefix: 'Objektbeschreibung: ' },
        { selector: '#wg_leben', prefix: 'WG-Leben: ' },
        { selector: '#gesucht_wird', prefix: 'Gesucht wird: ' }
      ];
      
      sections.forEach(({ selector, prefix }) => {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && text.length > 20) {
            descriptionParts.push(prefix + text);
          }
        }
      });
      
      result.description = descriptionParts.filter(Boolean).join('\n\n');
      
      // Extract from detail boxes
      const allText = document.body.textContent || '';
      
      // Price
      const priceMatch = allText.match(/Miete:\s*(\d+)\s*€|(\d+)\s*€\s*(?:Warmmiete|Gesamtmiete)/i);
      if (priceMatch) {
        result.price = parseInt(priceMatch[1] || priceMatch[2]);
      }
      
      // Size
      const sizeMatch = allText.match(/(\d+)\s*m²/);
      if (sizeMatch) {
        result.size = parseInt(sizeMatch[1]);
      }
      
      // Rooms
      const roomMatch = allText.match(/(\d+(?:,\d+)?)\s*Zimmer/);
      if (roomMatch) {
        result.rooms = parseFloat(roomMatch[1].replace(',', '.'));
      } else if (result.title.match(/WG-Zimmer|WG Zimmer/i)) {
        result.rooms = 1;
      }
      
      // Location from breadcrumb
      const breadcrumb = document.querySelector('.breadcrumb');
      if (breadcrumb) {
        const parts = breadcrumb.textContent?.split('>').map(p => p.trim()) || [];
        if (parts.length >= 3) {
          result.district = parts[2];
        }
      }
      
      // Available from
      const availableMatch = allText.match(/(?:frei ab|verfügbar ab)[:\s]*([0-9]{1,2}[.\s][0-9]{1,2}[.\s][0-9]{2,4})/i);
      if (availableMatch) {
        result.availableFrom = availableMatch[1].trim();
      }
      
      // Contact name
      const contactSelectors = [
        '.rhs_contact_information .headline-name-title',
        '.rhs_contact_information h1',
        '.headline-name',
        '.text-capitalise'
      ];
      
      for (const selector of contactSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const name = element.textContent?.trim();
          if (name && !name.match(/mitglied seit|member since/i)) {
            result.contactName = name;
            break;
          }
        }
      }
      
      // Amenities
      const amenityElements = document.querySelectorAll('.objekteigenschaften li, .ausstattung li');
      amenityElements.forEach(el => {
        const text = el.textContent?.trim().toLowerCase();
        if (text) {
          if (text.includes('balkon')) result.amenities.balcony = true;
          if (text.includes('garten')) result.amenities.garden = true;
          if (text.includes('keller')) result.amenities.basement = true;
          if (text.includes('aufzug') || text.includes('fahrstuhl')) result.amenities.elevator = true;
          if (text.includes('möbliert')) result.amenities.furnished = true;
          if (text.includes('küche')) result.amenities.kitchen = true;
          if (text.includes('spülmaschine')) result.amenities.dishwasher = true;
          if (text.includes('waschmaschine')) result.amenities.washingMachine = true;
          if (text.includes('internet') || text.includes('wlan')) result.amenities.internet = true;
          if (text.includes('parkplatz')) result.amenities.parking = true;
          if (text.includes('haustiere')) result.amenities.petsAllowed = true;
        }
      });
      
      return result;
    });
    
    // Handle phone extraction (requires interaction)
    let contactPhone = '';
    let contactEmail = '';
    
    try {
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
          await page.waitForTimeout(2000);
          
          const newPhoneLink = page.locator('a[href^="tel:"]').first();
          if (await newPhoneLink.count() > 0) {
            const href = await newPhoneLink.getAttribute('href');
            contactPhone = href?.replace('tel:', '').trim() || '';
          }
        }
      }
      
      // Check for email
      const emailLink = page.locator('a[href^="mailto:"]').first();
      if (await emailLink.count() > 0) {
        const href = await emailLink.getAttribute('href');
        contactEmail = href?.replace('mailto:', '').trim() || '';
      }
    } catch (error) {
      // Phone/email extraction failed, continue
    }
    
    // Extract images
    const images = await this.extractGalleryImages(page);
    
    // Parse available date
    let availableFrom = null;
    if (data.availableFrom) {
      availableFrom = this.parseGermanDate(data.availableFrom);
    }
    
    // Get listing ID from URL
    const listingId = await this.parseListingUrl(url);
    
    return {
      externalId: listingId.externalId,
      url,
      title: data.title,
      description: data.description,
      price: data.price,
      size: data.size,
      rooms: data.rooms,
      district: data.district,
      address: data.address,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableTo: null,
      contactName: data.contactName,
      contactPhone,
      contactEmail,
      contactProfileImage: null,
      images,
      amenities: data.amenities,
      platformData: {
        wgSize: await this.extractWGSize(page),
        deposit: await this.extractDeposit(page),
        utilities: await this.extractUtilities(page)
      }
    };
  }
  
  /**
   * Handle platform-specific authentication
   */
  async handlePlatformSpecificAuth(page: Page): Promise<boolean> {
    if (!this.credentials.email || !this.credentials.password) {
      console.log('⚠️  No WG-Gesucht credentials configured');
      return false;
    }
    
    try {
      // Check if already logged in
      if (await page.locator('a[href*="logout"]').count() > 0) {
        console.log('✅ Already logged in');
        this.authenticated = true;
        return true;
      }
      
      // Navigate to login
      await page.goto(`${this.baseUrl}/mein-wg-gesucht-einloggen.html`);
      await page.waitForTimeout(2000);
      
      // Fill login form
      await page.fill('#login_email_username', this.credentials.email);
      await page.fill('#login_password', this.credentials.password);
      
      // Submit
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('#login_submit')
      ]);
      
      // Check if login successful
      if (await page.locator('a[href*="logout"]').count() > 0) {
        console.log('✅ Login successful');
        this.authenticated = true;
        
        // Mark browser as authenticated
        const browserInstance = await browserPool.getInstance();
        await browserInstance.markAuthenticated(browserInstance, { 
          platform: this.platform,
          loginTime: new Date()
        });
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }
  
  /**
   * Detect CAPTCHA on page
   */
  async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      '.g-recaptcha',
      '#captcha',
      'img[src*="captcha"]',
      'div[class*="captcha"]',
      // WG-Gesucht specific
      '.challenge-form',
      'h1:text("Überprüfung")',
      'h2:text("Sicherheitsabfrage")'
    ];
    
    for (const selector of captchaSelectors) {
      if (await page.locator(selector).count() > 0) {
        console.log(`🤖 CAPTCHA detected: ${selector}`);
        return true;
      }
    }
    
    // Check page title
    const title = await page.title();
    if (title.includes('Überprüfung') || title.includes('Sicherheit')) {
      console.log('🤖 CAPTCHA detected in title');
      return true;
    }
    
    return false;
  }
  
  /**
   * Convert to universal listing format
   */
  toUniversalListing(detailed: DetailedListing): UniversalListing {
    // Determine property type
    let propertyType = PropertyType.OTHER;
    if (detailed.title.match(/WG[- ]Zimmer/i) || detailed.platformData.wgSize) {
      propertyType = PropertyType.WG_ROOM;
    } else if (detailed.rooms === 1 || detailed.title.match(/1[- ]Zimmer|Studio/i)) {
      propertyType = PropertyType.STUDIO;
    } else if (detailed.rooms >= 2) {
      propertyType = PropertyType.APARTMENT;
    }
    
    // Calculate total rent
    const baseRent = detailed.price || 0;
    const utilities = detailed.platformData.utilities || 0;
    const totalRent = baseRent; // WG-Gesucht usually shows warm rent
    
    return {
      platform: this.platform,
      externalId: detailed.externalId,
      url: detailed.url,
      
      title: detailed.title,
      status: ListingStatus.ACTIVE,
      scrapedAt: new Date(),
      lastUpdatedAt: new Date(),
      firstSeenAt: new Date(),
      
      description: detailed.description,
      propertyType,
      size: detailed.size,
      rooms: detailed.rooms,
      floor: null,
      totalFloors: null,
      yearBuilt: null,
      
      location: {
        district: detailed.district,
        address: detailed.address,
        zipCode: null,
        city: 'Berlin',
        country: 'Germany',
        coordinates: null
      },
      
      availability: {
        from: detailed.availableFrom,
        to: detailed.availableTo,
        immediately: !detailed.availableFrom || detailed.availableFrom <= new Date(),
        flexible: false
      },
      
      costs: {
        baseRent,
        utilities,
        heatingCosts: null,
        additionalCosts: null,
        totalRent,
        deposit: detailed.platformData.deposit || null,
        commission: null
      },
      
      contact: {
        name: detailed.contactName,
        phone: detailed.contactPhone,
        email: detailed.contactEmail,
        profileImage: detailed.contactProfileImage,
        companyName: null,
        isAgent: false,
        preferredContactMethod: 'message',
        responseTime: null,
        languages: ['de']
      },
      
      media: {
        images: detailed.images,
        floorPlans: [],
        virtualTour: null,
        video: null
      },
      
      amenities: detailed.amenities as StandardAmenities,
      
      platformData: detailed.platformData,
      
      wgDetails: detailed.platformData.wgSize ? {
        totalRooms: detailed.platformData.wgSize,
        totalFlatmates: detailed.platformData.wgSize - 1,
        targetGender: detailed.platformData.targetGender,
        ageRange: detailed.platformData.ageRange,
        languages: detailed.platformData.languages,
        occupation: detailed.platformData.occupation,
        lifestyle: detailed.platformData.lifestyle
      } : undefined
    };
  }
  
  // Helper methods
  
  private parseGermanDate(dateStr: string): string {
    try {
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
  
  private async extractGalleryImages(page: Page): Promise<string[]> {
    const images = new Set<string>();
    
    try {
      // Try to open gallery
      const galleryLink = page.locator('a:text("Weiter zu den Wohnungsfotos")').first();
      if (await galleryLink.isVisible()) {
        await galleryLink.click();
        await page.waitForTimeout(3000);
      }
      
      // Extract visible images
      const imageSelectors = [
        '.sp-slide img.sp-image',
        '.fotorama__stage img',
        'img[src*="/media/up/"]'
      ];
      
      for (const selector of imageSelectors) {
        const imgs = await page.locator(selector).all();
        for (const img of imgs) {
          const src = await img.getAttribute('src') || 
                     await img.getAttribute('data-large') ||
                     await img.getAttribute('data-src');
          
          if (src && this.isValidPropertyImage(src)) {
            images.add(this.normalizeImageUrl(src));
          }
        }
      }
      
      // Try to navigate through gallery
      for (let i = 0; i < 10 && images.size < 20; i++) {
        const nextBtn = page.locator('.sp-next-arrow, .sp-next').first();
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(1000);
          
          // Get new image
          const currentImg = page.locator('.sp-slide.sp-selected img.sp-image').first();
          if (await currentImg.isVisible()) {
            const src = await currentImg.getAttribute('src') ||
                       await currentImg.getAttribute('data-large');
            if (src && this.isValidPropertyImage(src)) {
              images.add(this.normalizeImageUrl(src));
            }
          }
        } else {
          break;
        }
      }
      
    } catch (error) {
      console.log('Gallery extraction error:', error);
    }
    
    return Array.from(images);
  }
  
  private isValidPropertyImage(src: string): boolean {
    const invalid = ['placeholder', 'logo', 'avatar', 'profile', 'icon', 'user_'];
    return !invalid.some(term => src.toLowerCase().includes(term));
  }
  
  private normalizeImageUrl(src: string): string {
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('/')) return this.baseUrl + src;
    return src;
  }
  
  private async extractWGSize(page: Page): Promise<number | null> {
    const text = await page.textContent('body');
    const match = text?.match(/(\d+)er\s*WG/i);
    return match ? parseInt(match[1]) : null;
  }
  
  private async extractDeposit(page: Page): Promise<number | null> {
    const text = await page.textContent('body');
    const match = text?.match(/Kaution[:\s]*(\d+)\s*€/i);
    return match ? parseInt(match[1]) : null;
  }
  
  private async extractUtilities(page: Page): Promise<number | null> {
    const text = await page.textContent('body');
    const match = text?.match(/Nebenkosten[:\s]*(\d+)\s*€/i);
    return match ? parseInt(match[1]) : null;
  }
}

// Export for registration
export default WGGesuchtUnifiedScraper;