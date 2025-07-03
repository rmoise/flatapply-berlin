import 'dotenv/config';
import puppeteer from 'puppeteer';

async function testPuppeteerGallery() {
  const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Testing Puppeteer gallery extraction for:', url);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for gallery to load
    console.log('⏳ Waiting for gallery...');
    await page.waitForSelector('.sp-wrap, img[src*="img.wg-gesucht.de"]', { timeout: 10000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract gallery info
    const galleryInfo = await page.evaluate(() => {
      const info: any = {
        hasSmartPhoto: false,
        mainGalleryImages: [],
        allImages: [],
        galleryStructure: ''
      };
      
      // Check for SmartPhoto
      const spWrap = document.querySelector('.sp-wrap');
      if (spWrap) {
        info.hasSmartPhoto = true;
        info.galleryStructure = 'SmartPhoto gallery found';
        
        // Get thumbnails (these link to full images)
        spWrap.querySelectorAll('.sp-thumbs a').forEach(thumb => {
          const href = thumb.getAttribute('href');
          if (href && href.includes('img.wg-gesucht.de')) {
            info.mainGalleryImages.push(href);
          }
        });
        
        // Get main image
        const mainImg = spWrap.querySelector('img.sp-image');
        if (mainImg) {
          const src = mainImg.getAttribute('src');
          if (src && !info.mainGalleryImages.includes(src)) {
            info.mainGalleryImages.push(src);
          }
        }
      }
      
      // If no SmartPhoto, check for other gallery structures
      if (!info.hasSmartPhoto) {
        // Check main content area
        const mainContent = document.querySelector('.panel-body:not(.panel-sidebar), #main_column, .col-sm-8');
        if (mainContent) {
          // Get all images in main content
          mainContent.querySelectorAll('img').forEach(img => {
            const src = img.src || img.getAttribute('src');
            if (src?.includes('img.wg-gesucht.de') && !src.includes('.small.') && !src.includes('/thumb/')) {
              info.mainGalleryImages.push(src);
            }
          });
          info.galleryStructure = 'Images found in main content area';
        }
      }
      
      // Get all images for comparison
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('src');
        if (src?.includes('img.wg-gesucht.de')) {
          info.allImages.push(src);
        }
      });
      
      // Remove duplicates
      info.mainGalleryImages = [...new Set(info.mainGalleryImages)];
      info.allImages = [...new Set(info.allImages)];
      
      return info;
    });
    
    console.log('\n📊 Gallery Analysis:');
    console.log('Gallery structure:', galleryInfo.galleryStructure);
    console.log('Has SmartPhoto:', galleryInfo.hasSmartPhoto);
    console.log('Main gallery images found:', galleryInfo.mainGalleryImages.length);
    console.log('Total images on page:', galleryInfo.allImages.length);
    
    // If we have SmartPhoto, try to trigger it to load all images
    if (galleryInfo.hasSmartPhoto && galleryInfo.mainGalleryImages.length < 13) {
      console.log('\n🔄 Trying to load more images by interacting with gallery...');
      
      // Click on the main image
      await page.click('.sp-wrap img').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try clicking through thumbnails
      const thumbnailCount = await page.evaluate(() => {
        return document.querySelectorAll('.sp-thumbs a').length;
      });
      
      console.log(`Found ${thumbnailCount} thumbnails to click`);
      
      // Click each thumbnail
      for (let i = 0; i < Math.min(thumbnailCount, 5); i++) {
        await page.evaluate((index) => {
          const thumb = document.querySelectorAll('.sp-thumbs a')[index];
          if (thumb) (thumb as HTMLElement).click();
        }, i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Re-extract after interactions
      const updatedImages = await page.evaluate(() => {
        const images: string[] = [];
        const spWrap = document.querySelector('.sp-wrap');
        
        if (spWrap) {
          // Get all loaded images
          spWrap.querySelectorAll('img').forEach(img => {
            const src = img.src || img.getAttribute('src');
            if (src?.includes('img.wg-gesucht.de') && !src.includes('.small.')) {
              images.push(src);
            }
          });
          
          // Also check for preloaded images in data attributes
          spWrap.querySelectorAll('[data-src]').forEach(el => {
            const src = el.getAttribute('data-src');
            if (src?.includes('img.wg-gesucht.de') && !src.includes('.small.')) {
              images.push(src);
            }
          });
        }
        
        return [...new Set(images)];
      });
      
      console.log(`After interaction, found ${updatedImages.length} images`);
      if (updatedImages.length > galleryInfo.mainGalleryImages.length) {
        galleryInfo.mainGalleryImages = updatedImages;
      }
    }
    
    console.log('\n🖼️ Main Gallery Images:');
    galleryInfo.mainGalleryImages.forEach((img: string, i: number) => {
      console.log(`${i + 1}. ${img}`);
    });
    
    await browser.close();
    
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
}

testPuppeteerGallery();