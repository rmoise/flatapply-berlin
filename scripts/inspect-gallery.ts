import 'dotenv/config';
import puppeteer from 'puppeteer';

async function inspectGallery() {
  const url = process.argv[2] || 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Inspecting gallery structure on:', url);
  console.log('');

  const browser = await puppeteer.launch({
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for gallery to load
    await page.waitForSelector('.sp-wrap, .gallery, img[src*="img.wg-gesucht.de"]', { timeout: 5000 }).catch(() => {});
    
    console.log('⏳ Waiting for gallery to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Analyze gallery structure
    const galleryInfo = await page.evaluate(() => {
      const info: any = {
        hasSmartPhoto: false,
        smartPhotoImages: [],
        galleryContainers: [],
        scriptGalleryData: [],
        allImageUrls: []
      };
      
      // Check for SmartPhoto
      const spWrap = document.querySelector('.sp-wrap');
      if (spWrap) {
        info.hasSmartPhoto = true;
        
        // Get thumbnail links
        spWrap.querySelectorAll('.sp-thumbs a').forEach(thumb => {
          const href = thumb.getAttribute('href');
          if (href) info.smartPhotoImages.push(href);
        });
        
        // Get main image
        const mainImg = spWrap.querySelector('img.sp-image');
        if (mainImg) {
          const src = mainImg.getAttribute('src');
          if (src) info.smartPhotoImages.push(src);
        }
      }
      
      // Find gallery containers
      const gallerySelectors = ['.gallery', '.image-gallery', '.slider', '#photo-slider', '.fotorama'];
      gallerySelectors.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
          info.galleryContainers.push(selector);
        }
      });
      
      // Check scripts for gallery data
      document.querySelectorAll('script').forEach(script => {
        const content = script.innerHTML;
        if (content.includes('img.wg-gesucht.de') && (content.includes('gallery') || content.includes('SmartPhoto'))) {
          // Extract a snippet
          const snippet = content.substring(0, 200) + '...';
          info.scriptGalleryData.push(snippet);
          
          // Extract URLs
          const urls = content.match(/https?:\/\/img\.wg-gesucht\.de\/[^"'\s]+/g);
          if (urls) {
            urls.forEach(url => {
              if (!url.includes('.small.') && !url.includes('/thumb/')) {
                info.allImageUrls.push(url);
              }
            });
          }
        }
      });
      
      // Get all visible images
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src?.includes('img.wg-gesucht.de') && !src.includes('.small.') && !src.includes('/thumb/')) {
          info.allImageUrls.push(src);
        }
      });
      
      // Remove duplicates
      info.allImageUrls = [...new Set(info.allImageUrls)];
      
      return info;
    });
    
    console.log('\n📊 Gallery Analysis:');
    console.log('Has SmartPhoto:', galleryInfo.hasSmartPhoto);
    console.log('SmartPhoto images found:', galleryInfo.smartPhotoImages.length);
    console.log('Gallery containers found:', galleryInfo.galleryContainers);
    console.log('Scripts with gallery data:', galleryInfo.scriptGalleryData.length);
    console.log('Total unique images found:', galleryInfo.allImageUrls.length);
    
    if (galleryInfo.allImageUrls.length > 0) {
      console.log('\n🖼️ Images found:');
      galleryInfo.allImageUrls.forEach((url: string, i: number) => {
        console.log(`${i + 1}. ${url}`);
      });
    }
    
    // Try clicking on gallery to see if more images load
    console.log('\n🖱️ Trying to interact with gallery...');
    await page.click('.sp-wrap img').catch(() => console.log('Could not click main image'));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check again after interaction
    const afterClick = await page.evaluate(() => {
      const images: string[] = [];
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src?.includes('img.wg-gesucht.de') && !src.includes('.small.') && !src.includes('/thumb/')) {
          images.push(src);
        }
      });
      return [...new Set(images)];
    });
    
    console.log('\n🔄 After interaction, found:', afterClick.length, 'images');
    
    console.log('\n✅ Press Ctrl+C to close the browser');
    await new Promise(() => {}); // Keep browser open
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Browser will close when script is terminated
  }
}

inspectGallery();