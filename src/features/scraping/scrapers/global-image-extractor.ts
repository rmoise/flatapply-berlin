import puppeteer, { Browser, Page } from 'puppeteer';
import { ScrapedListing } from '../types.ts';

export class GlobalImageExtractor {
  private browser: Browser | null = null;
  
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
  
  async extractImagesForListing(url: string): Promise<string[]> {
    if (!this.browser) {
      await this.initialize();
    }
    
    const page = await this.browser!.newPage();
    
    try {
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the listing
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Handle captcha if present
      const hasCaptcha = await page.evaluate(() => {
        const title = document.title.toLowerCase();
        return title.includes('just a moment') || title.includes('checking your browser');
      });
      
      if (hasCaptcha) {
        console.log('Captcha detected, waiting...');
        await page.waitForSelector('.detail_view_picture_container, #WG-Pictures', { timeout: 120000 });
      }
      
      // Handle cookies
      await this.handleCookies(page);
      
      // Close overlay if present
      await this.closeOverlay(page);
      
      // Wait for gallery
      await page.waitForSelector('.slider-pro, #WG-Pictures, .gallery', { timeout: 10000 }).catch(() => {});
      
      // Extract images using multiple methods
      const images = await this.extractAllImages(page);
      
      return images;
    } finally {
      await page.close();
    }
  }
  
  private async handleCookies(page: Page) {
    try {
      await page.click('#cmpbntyestxt, button[aria-label*="akzeptieren"], button[aria-label*="accept"]');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {}
  }
  
  private async closeOverlay(page: Page) {
    try {
      // Click "Weiter zu den Wohnungsfotos" link
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const skipLink = links.find(link => 
          link.textContent?.includes('Weiter zu den Wohnungsfotos') ||
          link.getAttribute('href')?.includes('#WG-Pictures')
        );
        if (skipLink) skipLink.click();
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {}
  }
  
  private async extractAllImages(page: Page): Promise<string[]> {
    return await page.evaluate(async () => {
      const images = new Set<string>();
      
      // Method 1: Navigate through gallery
      const nextButton = document.querySelector('.sp-next-arrow, [class*="next"]');
      if (nextButton) {
        const seenImages = new Set<string>();
        let firstImage: string | null = null;
        
        for (let i = 0; i < 20; i++) {
          // Get current image
          const currentImg = document.querySelector('.sp-selected img, .selected img, img.active');
          if (currentImg && currentImg.src) {
            if (!firstImage) firstImage = currentImg.src;
            seenImages.add(currentImg.src);
            
            // Stop if we've cycled back
            if (i > 0 && currentImg.src === firstImage) break;
          }
          
          // Click next
          (nextButton as HTMLElement).click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Handle ads
          const adLink = document.querySelector('a[href*="#WG-Pictures"]');
          if (adLink) {
            (adLink as HTMLElement).click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        seenImages.forEach(img => images.add(img));
      }
      
      // Method 2: Get all slides
      document.querySelectorAll('.sp-slide img, .slide img').forEach(img => {
        if (img.src && img.src.includes('wg-gesucht.de')) {
          images.add(img.src);
        }
      });
      
      // Method 3: Get from thumbnails
      document.querySelectorAll('.sp-thumbnail img, .thumbnail img').forEach(img => {
        if (img.src) {
          const fullSize = img.src
            .replace('/thumbnail.', '/sized.')
            .replace('/thumb.', '/sized.')
            .replace('/small.', '/sized.');
          if (fullSize.includes('wg-gesucht.de')) {
            images.add(fullSize);
          }
        }
      });
      
      // Filter and clean
      return Array.from(images)
        .filter(img => img.includes('img.wg-gesucht.de'))
        .filter(img => img.includes('/sized.') || img.includes('/large.'))
        .slice(0, 20); // Max 20 images per listing
    });
  }
  
  async extractImagesForMultipleListings(listings: Array<{ id: string, url: string }>): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();
    
    console.log(`📸 Extracting images for ${listings.length} listings...`);
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`\n[${i + 1}/${listings.length}] Processing ${listing.url}`);
      
      try {
        const images = await this.extractImagesForListing(listing.url);
        results.set(listing.id, images);
        console.log(`✅ Found ${images.length} images`);
        
        // Rate limiting
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`❌ Error: ${error}`);
        results.set(listing.id, []);
      }
    }
    
    await this.close();
    return results;
  }
}

// Standalone function for single listing
export async function extractGalleryImages(url: string): Promise<string[]> {
  const extractor = new GlobalImageExtractor();
  try {
    return await extractor.extractImagesForListing(url);
  } finally {
    await extractor.close();
  }
}

// Batch processing function
export async function extractImagesForAllListings(listings: Array<{ id: string, url: string }>): Promise<Map<string, string[]>> {
  const extractor = new GlobalImageExtractor();
  return await extractor.extractImagesForMultipleListings(listings);
}