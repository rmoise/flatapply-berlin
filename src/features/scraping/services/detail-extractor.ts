import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'puppeteer';

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

interface DetailExtractionResult {
  title?: string;
  description?: string;
  coldRent?: number;
  warmRent?: number;
  utilities?: number;
  deposit?: number;
  rooms?: number;
  size?: number;
  floor?: number;
  totalFloors?: number;
  availableFrom?: string | Date;
  availableTo?: string | Date;
  contactName?: string;
  contactPhone?: string;
  images?: string[];
  amenities?: Record<string, any>;
}

export class DetailExtractorService {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Extract detailed information from a WG-Gesucht listing page
   */
  async extractDetails(url: string): Promise<DetailExtractionResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to listing
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('.headline-detailed-view-title, h1', { timeout: 10000 }).catch(() => {});
      
      // Extract all details in a single evaluate call
      const details = await page.evaluate(() => {
        const result: any = {};
        
        // Extract title
        const titleEl = document.querySelector('.headline-detailed-view-title, h1');
        if (titleEl) {
          result.title = titleEl.textContent?.trim();
        }
        
        // Skip description extraction - handled by dedicated description scraper
        // to avoid conflicts and ensure proper extraction with full context
        
        // Extract costs with proper separation
        let coldRent = 0;
        let warmRent = 0;
        let utilities = 0;
        let deposit = 0;
        
        // First try to extract from structured panel sections with labels
        const panelElements = document.querySelectorAll('.section_panel_value');
        panelElements.forEach(el => {
          const parent = el.parentElement;
          const prevSibling = parent?.previousElementSibling;
          const labelText = prevSibling?.textContent?.trim() || 
                           parent?.querySelector('.section_panel_key')?.textContent?.trim() || '';
          const valueText = el.textContent?.trim() || '';
          const valueMatch = valueText.match(/(\d+)\s*€/);
          
          if (valueMatch) {
            const value = parseInt(valueMatch[1]);
            
            if (labelText.includes('Miete:') && !labelText.includes('Nebenkosten')) {
              coldRent = value;
            } else if (labelText.includes('Nebenkosten:')) {
              utilities = value;
            } else if (labelText.includes('Kaution:')) {
              deposit = value;
            }
          }
        });
        
        // Extract total rent from key facts
        const keyFacts = document.querySelectorAll('.key_fact_detail');
        keyFacts.forEach(el => {
          if (el.textContent?.includes('Gesamtmiete')) {
            const parent = el.parentElement;
            const valueEl = parent?.querySelector('.key_fact_value');
            if (valueEl) {
              const match = valueEl.textContent?.match(/(\d+)\s*€/);
              if (match) warmRent = parseInt(match[1]);
            }
          }
        });
        
        // Search for cost information in text as fallback
        const pageText = document.body.textContent || '';
        
        // Extract Kaltmiete (cold rent) if not already found
        if (coldRent === 0) {
          const coldRentPatterns = [
            /Kaltmiete:\s*(\d+)\s*€/i,
            /Miete:\s*(\d+)\s*€(?!\s*\+)/i, // Rent without utilities
            /(\d+)\s*€\s*Kaltmiete/i,
            /Grundmiete:\s*(\d+)\s*€/i
          ];
          
          for (const pattern of coldRentPatterns) {
            const match = pageText.match(pattern);
            if (match) {
              coldRent = parseInt(match[1]);
              break;
            }
          }
        }
        
        // Extract Nebenkosten (utilities/additional costs) if not already found
        if (utilities === 0) {
          const utilitiesPatterns = [
            /Nebenkosten:\s*(\d+)\s*€/i,
            /\+\s*(\d+)\s*€\s*(?:Nebenkosten|NK)/i,
            /Betriebskosten:\s*(\d+)\s*€/i,
            /zusätzliche\s+Kosten:\s*(\d+)\s*€/i,
            /\+\s*(\d+)\s*€/i // Generic pattern for "+ 250€"
          ];
          
          for (const pattern of utilitiesPatterns) {
            const match = pageText.match(pattern);
            if (match) {
              utilities = parseInt(match[1]);
              break;
            }
          }
        }
        
        // Extract Warmmiete (warm rent / total rent) if not already found
        if (warmRent === 0) {
          const warmRentPatterns = [
            /Warmmiete:\s*(\d+)\s*€/i,
            /Gesamtmiete:\s*(\d+)\s*€/i,
            /Gesamt:\s*(\d+)\s*€/i,
            /Total:\s*(\d+)\s*€/i
          ];
          
          for (const pattern of warmRentPatterns) {
            const match = pageText.match(pattern);
            if (match) {
              warmRent = parseInt(match[1]);
              break;
            }
          }
        }
        
        // If we have warm rent but not cold rent, calculate it
        if (warmRent > 0 && coldRent === 0 && utilities > 0) {
          coldRent = warmRent - utilities;
        }
        
        // If we have cold rent and utilities but not warm rent, calculate it
        if (coldRent > 0 && utilities > 0 && warmRent === 0) {
          warmRent = coldRent + utilities;
        }
        
        // Extract Kaution (deposit)
        // First check for "no deposit" patterns
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
            deposit = 0;
            break;
          }
        }
        
        // If no "no deposit" pattern found, look for numeric deposit
        if (!hasNoDeposit) {
          const depositPatterns = [
            /Kaution:\s*(\d+)\s*€/i,
            /Deposit:\s*(\d+)\s*€/i,
            /(\d+)\s*€\s*Kaution/i,
            /Sicherheitsleistung:\s*(\d+)\s*€/i
          ];
          
          for (const pattern of depositPatterns) {
            const match = pageText.match(pattern);
            if (match) {
              deposit = parseInt(match[1]);
              break;
            }
          }
        }
        
        result.coldRent = coldRent;
        result.warmRent = warmRent;
        result.utilities = utilities;
        result.deposit = deposit;
        
        // Extract rooms with support for German word numbers
        let rooms = 0;
        
        // German number words mapping
        const germanNumbers: Record<string, number> = {
          'ein': 1, 'eine': 1, 'einen': 1,
          'zwei': 2, 'zwo': 2,
          'drei': 3,
          'vier': 4,
          'fünf': 5, 'fuenf': 5,
          'sechs': 6,
          'sieben': 7,
          'acht': 8,
          'neun': 9,
          'zehn': 10
        };
        
        // Room patterns including German word numbers
        const roomPatterns = [
          // Numeric patterns with reasonable room count limits (1-20)
          /(\d{1,2})\s*(?:Zimmer|Zi\.|Raum|Räume|Room)(?:\s|$|[^0-9])/i,
          /(\d{1,2})-?Zimmer(?:\s|$|[^0-9])/i,
          /(\d{1,2})\s*rooms?(?:\s|$|[^0-9])/i,
          
          // Decimal patterns (e.g., 1.5 rooms)
          /(\d{1}[.,]\d{1})\s*(?:Zimmer|Zi\.|Room)/i,
          
          // German word patterns
          /(ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn)[\s-]?(?:Zimmer|Zi\.)/i,
          /(Ein|Eine|Zwei|Zwo|Drei|Vier|Fünf|Fuenf|Sechs|Sieben|Acht|Neun|Zehn)[\s-]?(?:Zimmer|Zi\.)/i,
          
          // Compound patterns like "Zwei-Zimmer-Wohnung"
          /(ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn)[\s-]?Zimmer[\s-]?Wohnung/i
        ];
        
        // Try each pattern
        for (const pattern of roomPatterns) {
          const match = pageText.match(pattern);
          if (match) {
            const captured = match[1];
            
            // Check if it's a number word
            const lowerCaptured = captured.toLowerCase();
            if (germanNumbers[lowerCaptured]) {
              rooms = germanNumbers[lowerCaptured];
              break;
            }
            
            // Otherwise parse as number
            const numericValue = parseFloat(captured.replace(',', '.'));
            if (!isNaN(numericValue) && numericValue > 0 && numericValue <= 20) {
              rooms = numericValue;
              break;
            }
          }
        }
        
        result.rooms = rooms;
        
        // Extract size
        const sizePatterns = [
          /(\d+)\s*(?:m²|qm|sqm)/i,
          /(\d+)\s*Quadratmeter/i,
          /Wohnfläche:\s*(\d+)/i
        ];
        
        for (const pattern of sizePatterns) {
          const match = pageText.match(pattern);
          if (match) {
            result.size = parseInt(match[1]);
            break;
          }
        }
        
        // Extract floor information
        const floorPatterns = [
          /(\d+)\.\s*(?:Stock|Etage|OG)/i,
          /(\d+)\.\s*floor/i,
          /Etage:\s*(\d+)/i
        ];
        
        for (const pattern of floorPatterns) {
          const match = pageText.match(pattern);
          if (match) {
            result.floor = parseInt(match[1]);
            break;
          }
        }
        
        // Extract available from date
        const fromDatePatterns = [
          /(?:frei ab|verfügbar ab|available from)[\s:]*(\d{1,2}\.\d{1,2}\.\d{2,4})/i,
          /(?:frei ab|verfügbar ab|available from)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
          /(?:ab|from)\s+(\d{1,2}\.\d{1,2}\.\d{2,4})/i
        ];
        
        for (const pattern of fromDatePatterns) {
          const match = pageText.match(pattern);
          if (match) {
            // Keep as string in DD.MM.YYYY format
            result.availableFrom = match[1];
            break;
          }
        }
        
        // Extract available to date (for temporary rentals)
        const toDatePatterns = [
          /(?:frei bis|verfügbar bis|available until|bis)[\s:]*(\d{1,2}\.\d{1,2}\.\d{2,4})/i,
          /(?:frei bis|verfügbar bis|available until|bis)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
          /(?:bis|until)\s+(\d{1,2}\.\d{1,2}\.\d{2,4})/i
        ];
        
        for (const pattern of toDatePatterns) {
          const match = pageText.match(pattern);
          if (match) {
            // Keep as string in DD.MM.YYYY format
            result.availableTo = match[1];
            break;
          }
        }
        
        // Extract contact name
        const contactEl = document.querySelector('.user_profile_info p:first-of-type, .partner_detail_name');
        if (contactEl) {
          result.contactName = contactEl.textContent?.trim();
        }
        
        // Extract images (limited to first 7)
        const images: string[] = [];
        
        // Look for gallery images
        const imageSelectors = [
          '.sp-thumbnail img',
          '.sp-slide img',
          'img[data-large]',
          'img[data-src*="/media/up/"]'
        ];
        
        for (const selector of imageSelectors) {
          document.querySelectorAll(selector).forEach((img: any) => {
            const largeUrl = img.getAttribute('data-large') || 
                           img.getAttribute('data-src') || 
                           img.src;
            
            if (largeUrl && largeUrl.includes('/media/up/') && !images.includes(largeUrl)) {
              // Convert to full-size image
              const fullSize = largeUrl.replace('.small.', '.sized.');
              images.push(fullSize);
            }
          });
        }
        
        result.images = images.slice(0, 7);
        
        return result;
      });
      
      return details;
      
    } finally {
      await browser.close();
    }
  }
  
  /**
   * Update a listing in the database with extracted details
   */
  async updateListing(listingId: string, details: DetailExtractionResult): Promise<void> {
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only update fields that have valid values
    // Skip description - handled by dedicated description scraper
    
    if (details.coldRent && details.coldRent > 0) {
      updates.price = details.coldRent; // price field stores cold rent
    }
    
    if (details.warmRent && details.warmRent > 0) {
      updates.warm_rent = details.warmRent;
    }
    
    // Always save utilities, even if 0, to distinguish between "0€" and "unknown"
    if (details.utilities !== undefined) {
      updates.utilities = { amount: details.utilities };
    }
    
    if (details.deposit && details.deposit > 0) {
      updates.deposit = details.deposit;
    }
    
    if (details.rooms && details.rooms > 0) {
      updates.rooms = details.rooms;
    }
    
    if (details.size && details.size > 0) {
      updates.size_sqm = details.size;
    }
    
    if (details.floor !== undefined) {
      updates.floor = details.floor;
    }
    
    if (details.totalFloors !== undefined) {
      updates.total_floors = details.totalFloors;
    }
    
    if (details.availableFrom) {
      // Handle both Date objects and date strings (DD.MM.YYYY format)
      if (typeof details.availableFrom === 'string' && details.availableFrom.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/)) {
        const [day, month, year] = details.availableFrom.split('.');
        const fullYear = year.length === 2 ? '20' + year : year;
        updates.available_from = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (details.availableFrom instanceof Date) {
        updates.available_from = details.availableFrom.toISOString().split('T')[0];
      }
    }
    
    if (details.availableTo) {
      // Handle both Date objects and date strings (DD.MM.YYYY format)
      if (typeof details.availableTo === 'string' && details.availableTo.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/)) {
        const [day, month, year] = details.availableTo.split('.');
        const fullYear = year.length === 2 ? '20' + year : year;
        updates.available_to = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (details.availableTo instanceof Date) {
        updates.available_to = details.availableTo.toISOString().split('T')[0];
      }
    }
    
    if (details.contactName) {
      updates.contact_name = details.contactName;
    }
    
    if (details.contactPhone) {
      updates.contact_phone = details.contactPhone;
    }
    
    if (details.images && details.images.length > 0) {
      updates.images = details.images;
    }
    
    if (details.amenities && Object.keys(details.amenities).length > 0) {
      updates.amenities = details.amenities;
    }
    
    const { error } = await this.supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId);
    
    if (error) {
      throw new Error(`Failed to update listing: ${error.message}`);
    }
  }
  
  /**
   * Extract details for multiple listings
   */
  async extractForListings(listingIds: string[]): Promise<void> {
    console.log(`📋 Extracting details for ${listingIds.length} listings...`);
    
    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];
      
      try {
        // Get listing URL
        const { data: listing } = await this.supabase
          .from('listings')
          .select('url, title')
          .eq('id', listingId)
          .single();
        
        if (!listing) {
          console.log(`❌ Listing ${listingId} not found`);
          continue;
        }
        
        console.log(`\n[${i + 1}/${listingIds.length}] Processing: ${listing.title}`);
        console.log(`URL: ${listing.url}`);
        
        // Extract details
        const details = await this.extractDetails(listing.url);
        
        // Log what we found
        console.log('✅ Extracted:');
        if (details.coldRent) console.log(`  - Cold rent: ${details.coldRent}€`);
        if (details.utilities) console.log(`  - Utilities: ${details.utilities}€`);
        if (details.warmRent) console.log(`  - Warm rent: ${details.warmRent}€`);
        if (details.deposit) console.log(`  - Deposit: ${details.deposit}€`);
        if (details.rooms) console.log(`  - Rooms: ${details.rooms}`);
        if (details.size) console.log(`  - Size: ${details.size}m²`);
        if (details.images) console.log(`  - Images: ${details.images.length}`);
        
        // Update listing
        await this.updateListing(listingId, details);
        console.log('✅ Updated successfully');
        
        // Small delay between requests
        if (i < listingIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing listing ${listingId}:`, error);
      }
    }
    
    console.log('\n✅ Detail extraction complete!');
  }
}