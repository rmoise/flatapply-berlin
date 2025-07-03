import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { ScrapedListing } from '../types.ts';

interface ImageExtractionResult {
  listingId: string;
  images: string[];
  success: boolean;
  error?: string;
}

export class GlobalImageService {
  private browser: Browser | null = null;
  private supabase: any;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  
  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  /**
   * Extract images for a single listing
   */
  async extractImagesForListing(url: string, platform: string = 'wg_gesucht'): Promise<string[]> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Platform-specific extraction
      switch (platform) {
        case 'wg_gesucht':
          return await this.extractWgGesuchtImages(page);
        case 'immoscout24':
          return await this.extractImmoScout24Images(page);
        case 'kleinanzeigen':
          return await this.extractKleinanzeigenImages(page);
        default:
          return await this.extractGenericImages(page);
      }
    } catch (error) {
      console.error(`Error extracting images from ${url}:`, error);
      return [];
    } finally {
      await page.close();
    }
  }
  
  /**
   * WG-Gesucht specific image extraction
   */
  private async extractWgGesuchtImages(page: Page): Promise<string[]> {
    // Handle cookies
    try {
      await page.click('#cmpbntyestxt, button[aria-label*="akzeptieren"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {}
    
    // Close overlay
    try {
      await page.click('a[href*="#WG-Pictures"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {}
    
    // Extract images using stacked gallery method
    const images = await page.evaluate(async () => {
      const collectedImages: string[] = [];
      
      // Method 1: Navigate through gallery
      const getVisibleImage = () => {
        const selectedSlide = document.querySelector('.sp-selected, .sp-slide.sp-selected');
        if (selectedSlide) {
          const img = selectedSlide.querySelector('img');
          if (img && img.src && img.src.includes('img.wg-gesucht.de')) {
            return img.src;
          }
        }
        return null;
      };
      
      const firstImage = getVisibleImage();
      if (firstImage) collectedImages.push(firstImage);
      
      const nextButton = document.querySelector('.sp-next-arrow, .sp-arrow.sp-next-arrow, [class*="next"]');
      if (nextButton) {
        for (let i = 0; i < 20; i++) {
          (nextButton as HTMLElement).click();
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const currentImage = getVisibleImage();
          if (currentImage) {
            if (!collectedImages.includes(currentImage)) {
              collectedImages.push(currentImage);
            } else if (currentImage === firstImage && collectedImages.length > 1) {
              break;
            }
          }
        }
      }
      
      // Method 2: Get all images from page
      if (collectedImages.length === 0) {
        document.querySelectorAll('img[src*="img.wg-gesucht.de"]').forEach(img => {
          if (img.src && !img.src.includes('logo') && !img.src.includes('profile')) {
            collectedImages.push(img.src);
          }
        });
      }
      
      return collectedImages;
    });
    
    // Convert small images to full size
    return images.map(img => {
      if (img.includes('.small.')) {
        return img.replace('.small.', '.sized.');
      }
      return img;
    }).filter(img => 
      img.includes('/sized.') || img.includes('/large.')
    ).slice(0, 20);
  }
  
  /**
   * ImmoScout24 specific image extraction
   */
  private async extractImmoScout24Images(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const images: string[] = [];
      
      // Look for gallery images
      document.querySelectorAll('.gallery-image img, .sp-image img, [data-qa="gallery-image"]').forEach(img => {
        if (img.src && img.src.includes('pictures.immobilienscout24.de')) {
          images.push(img.src);
        }
      });
      
      return images.slice(0, 20);
    });
  }
  
  /**
   * Kleinanzeigen specific image extraction
   */
  private async extractKleinanzeigenImages(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const images: string[] = [];
      
      // Look for gallery images
      document.querySelectorAll('.galleryimage--image img, .ad-image img').forEach(img => {
        if (img.src && img.src.includes('ebayimg.com')) {
          images.push(img.src);
        }
      });
      
      return images.slice(0, 20);
    });
  }
  
  /**
   * Generic image extraction for any platform
   */
  private async extractGenericImages(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const images: string[] = [];
      
      // Get all images that look like property photos
      document.querySelectorAll('img').forEach(img => {
        if (img.src && 
            img.width > 200 && 
            !img.src.includes('logo') &&
            !img.src.includes('icon') &&
            !img.src.includes('avatar')) {
          images.push(img.src);
        }
      });
      
      return images.slice(0, 20);
    });
  }
  
  /**
   * Process all listings without images
   */
  async processListingsWithoutImages(limit: number = 50): Promise<ImageExtractionResult[]> {
    const results: ImageExtractionResult[] = [];
    
    // Get listings without images
    const { data: listings, error } = await this.supabase
      .from('listings')
      .select('id, url, platform')
      .or('images.is.null,images.eq.{}')
      .limit(limit);
      
    if (error || !listings) {
      console.error('Error fetching listings:', error);
      return results;
    }
    
    console.log(`🔍 Processing ${listings.length} listings without images...`);
    
    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      console.log(`\n📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(listings.length/batchSize)}`);
      
      const batchPromises = batch.map(async listing => {
        try {
          const images = await this.extractImagesForListing(listing.url, listing.platform);
          
          if (images.length > 0) {
            // Update database
            await this.supabase
              .from('listings')
              .update({ 
                images,
                updated_at: new Date().toISOString()
              })
              .eq('id', listing.id);
              
            console.log(`✅ ${listing.id}: ${images.length} images`);
            return { listingId: listing.id, images, success: true };
          } else {
            console.log(`❌ ${listing.id}: No images found`);
            return { listingId: listing.id, images: [], success: false, error: 'No images found' };
          }
        } catch (error) {
          console.log(`❌ ${listing.id}: Error - ${error}`);
          return { listingId: listing.id, images: [], success: false, error: String(error) };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting
      if (i + batchSize < listings.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return results;
  }
  
  /**
   * Update images for a specific listing
   */
  async updateListingImages(listingId: string): Promise<ImageExtractionResult> {
    const { data: listing, error } = await this.supabase
      .from('listings')
      .select('url, platform')
      .eq('id', listingId)
      .single();
      
    if (error || !listing) {
      return { listingId, images: [], success: false, error: 'Listing not found' };
    }
    
    try {
      const images = await this.extractImagesForListing(listing.url, listing.platform);
      
      if (images.length > 0) {
        await this.supabase
          .from('listings')
          .update({ 
            images,
            updated_at: new Date().toISOString()
          })
          .eq('id', listingId);
          
        return { listingId, images, success: true };
      } else {
        return { listingId, images: [], success: false, error: 'No images found' };
      }
    } catch (error) {
      return { listingId, images: [], success: false, error: String(error) };
    }
  }
  
  /**
   * Fix broken images by re-extracting or using placeholders
   */
  async fixBrokenImages(): Promise<void> {
    // Get all listings
    const { data: listings } = await this.supabase
      .from('listings')
      .select('id, images')
      .not('images', 'is', null)
      .limit(100);
      
    if (!listings) return;
    
    console.log(`🔍 Checking ${listings.length} listings for broken images...`);
    
    for (const listing of listings) {
      if (!listing.images || listing.images.length === 0) continue;
      
      // Test first image
      try {
        const response = await fetch(listing.images[0]);
        if (response.status !== 200) {
          console.log(`🔧 Fixing broken images for listing ${listing.id}`);
          const result = await this.updateListingImages(listing.id);
          console.log(result.success ? '✅ Fixed' : '❌ Failed to fix');
        }
      } catch {
        // Network error, try to fix
        await this.updateListingImages(listing.id);
      }
    }
  }
}

// Singleton instance
let globalImageService: GlobalImageService | null = null;

export function getGlobalImageService(): GlobalImageService {
  if (!globalImageService) {
    globalImageService = new GlobalImageService();
  }
  return globalImageService;
}