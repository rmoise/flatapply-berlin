import { config } from 'dotenv';
import { chromium } from 'playwright';
import * as fs from 'fs';

// Load environment variables
config({ path: '.env.local' });

async function debugWGGesucht() {
  console.log('🔍 Debugging WG-Gesucht page structure...\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'de-DE'
    });

    // Override navigator properties
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Test URL - a specific listing
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10017642.html';
    
    console.log(`📡 Fetching: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    // Save the HTML for inspection
    const html = await page.content();
    fs.writeFileSync('debug-wg-gesucht.html', html);
    console.log('📄 Saved HTML to debug-wg-gesucht.html');

    // Try to find images using JavaScript in the browser context
    const imageInfo = await page.evaluate(() => {
      const results: any = {
        allImages: [],
        galleryImages: [],
        sliderImages: [],
        lazyImages: []
      };

      // Get all img tags
      document.querySelectorAll('img').forEach(img => {
        if (img.src || img.dataset.src || img.dataset.lazy) {
          results.allImages.push({
            src: img.src,
            dataSrc: img.dataset.src,
            dataLazy: img.dataset.lazy,
            className: img.className,
            id: img.id,
            parent: img.parentElement?.className
          });
        }
      });

      // Check for gallery containers
      const gallerySelectors = [
        '.sp-slide img',
        '.gallery img',
        '.image-gallery img',
        '.slider img',
        '#photo-slider img',
        '.apartment-pictures img',
        '.images img',
        '.foto img',
        '.fotorama img',
        '.carousel img',
        '.slick-slider img'
      ];

      gallerySelectors.forEach(selector => {
        const images = document.querySelectorAll(selector);
        if (images.length > 0) {
          images.forEach(img => {
            results.galleryImages.push({
              selector,
              src: (img as HTMLImageElement).src,
              dataSrc: (img as HTMLImageElement).dataset.src
            });
          });
        }
      });

      // Check for background images
      const bgElements = document.querySelectorAll('[style*="background-image"]');
      bgElements.forEach(el => {
        const style = el.getAttribute('style');
        const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match) {
          results.lazyImages.push({
            type: 'background',
            url: match[1],
            className: (el as HTMLElement).className
          });
        }
      });

      return results;
    });

    console.log('\n📸 Image Analysis:');
    console.log(`Total images found: ${imageInfo.allImages.length}`);
    console.log(`Gallery images: ${imageInfo.galleryImages.length}`);
    console.log(`Lazy/background images: ${imageInfo.lazyImages.length}`);

    if (imageInfo.allImages.length > 0) {
      console.log('\nFirst 5 images:');
      imageInfo.allImages.slice(0, 5).forEach((img: any, i: number) => {
        console.log(`${i + 1}. ${img.src || img.dataSrc || img.dataLazy}`);
        console.log(`   Class: ${img.className}`);
        console.log(`   Parent: ${img.parent}`);
      });
    }

    // Also check if we're being blocked
    const pageTitle = await page.title();
    const isBlocked = pageTitle.includes('Access Denied') || 
                     pageTitle.includes('Zugriff verweigert') ||
                     html.includes('captcha') ||
                     html.includes('blocked');
    
    if (isBlocked) {
      console.log('\n⚠️  Warning: Page might be blocking our access!');
      console.log(`Page title: ${pageTitle}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugWGGesucht()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });