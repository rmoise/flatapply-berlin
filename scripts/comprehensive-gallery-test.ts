import 'dotenv/config';
import puppeteer from 'puppeteer';

async function comprehensiveGalleryTest() {
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Comprehensive gallery test for:', testUrl);
  
  const browser = await puppeteer.launch({
    headless: false, // Let's see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading page...');
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a bit for any lazy loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's actually on the page
    const pageAnalysis = await page.evaluate(() => {
      const analysis: any = {
        totalImages: 0,
        wgImages: [],
        galleryStructures: [],
        interactiveElements: []
      };
      
      // Count all images
      const allImages = document.querySelectorAll('img');
      analysis.totalImages = allImages.length;
      
      // Find WG-Gesucht images
      allImages.forEach(img => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
        if (src && src.includes('img.wg-gesucht.de')) {
          analysis.wgImages.push({
            src,
            alt: img.alt,
            className: img.className,
            width: img.width,
            height: img.height
          });
        }
      });
      
      // Look for common gallery structures
      const gallerySelectors = [
        '.sp-wrap', '.sp-slide', '.sp-image',
        '.gallery', '.photo-gallery', '.image-gallery',
        '.slider', '.carousel', '.swiper',
        '[data-toggle="lightbox"]', '[data-fancybox]',
        '.thumbnail', '.thumbnails'
      ];
      
      gallerySelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          analysis.galleryStructures.push({
            selector,
            count: elements.length
          });
        }
      });
      
      // Look for clickable elements that might trigger gallery
      const clickableSelectors = [
        'img[onclick]', 'img[data-toggle]', 'img[data-target]',
        'a[data-toggle]', 'a[data-fancybox]', 'a[onclick]'
      ];
      
      clickableSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          analysis.interactiveElements.push({
            selector,
            count: elements.length
          });
        }
      });
      
      return analysis;
    });
    
    console.log('\n📊 Page Analysis:');
    console.log('Total images:', pageAnalysis.totalImages);
    console.log('WG-Gesucht images:', pageAnalysis.wgImages.length);
    console.log('Gallery structures found:', pageAnalysis.galleryStructures.length);
    console.log('Interactive elements:', pageAnalysis.interactiveElements.length);
    
    if (pageAnalysis.galleryStructures.length > 0) {
      console.log('\n🏗️ Gallery structures:');
      pageAnalysis.galleryStructures.forEach((struct: any) => {
        console.log(`  ${struct.selector}: ${struct.count}`);
      });
    }
    
    if (pageAnalysis.interactiveElements.length > 0) {
      console.log('\n⚡ Interactive elements:');
      pageAnalysis.interactiveElements.forEach((elem: any) => {
        console.log(`  ${elem.selector}: ${elem.count}`);
      });
    }
    
    console.log('\n🖼️ WG-Gesucht images found:');
    pageAnalysis.wgImages.forEach((img: any, i: number) => {
      console.log(`${i + 1}. ${img.src}`);
      console.log(`   Class: ${img.className}`);
      console.log(`   Size: ${img.width}x${img.height}`);
    });
    
    // Try to find and click on the first main image to see if it triggers a gallery
    console.log('\n🖱️ Trying to interact with main image...');
    try {
      // Look for the main apartment image (usually larger)
      const mainImageClicked = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img')).filter(img => {
          const src = img.src || '';
          return src.includes('img.wg-gesucht.de') && 
                 !src.includes('.small.') && 
                 !src.includes('_thumb') &&
                 img.width > 200; // Likely a main image, not an icon
        });
        
        if (images.length > 0) {
          const mainImg = images[0] as HTMLImageElement;
          mainImg.click();
          return true;
        }
        return false;
      });
      
      if (mainImageClicked) {
        console.log('✅ Clicked main image');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if any gallery appeared
        const galleryAppeared = await page.evaluate(() => {
          const gallerySelectors = ['.sp-wrap', '.lightbox', '.modal', '.overlay', '.gallery-modal'];
          return gallerySelectors.some(selector => 
            document.querySelectorAll(selector).length > 0
          );
        });
        
        console.log('Gallery appeared after click:', galleryAppeared);
      }
    } catch (error) {
      console.log('Could not interact with main image:', error);
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏸️ Browser staying open for manual inspection...');
    console.log('Press Ctrl+C to close');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error);
    await browser.close();
  }
}

comprehensiveGalleryTest();