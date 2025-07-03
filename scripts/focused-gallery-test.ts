import 'dotenv/config';
import * as cheerio from 'cheerio';

async function focusedGalleryTest() {
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🎯 Focused gallery test for:', testUrl);
  console.log('Goal: Find exactly the 13 gallery images, not all page images\n');
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('🔍 Looking for gallery-specific structures...\n');
    
    // Look for elements that are likely gallery containers
    const galleryContainers = [
      '.photo-gallery', '.image-gallery', '.apartment-gallery',
      '.listing-photos', '.property-images', '.gallery-container',
      '.photos', '.images', '.slider-container',
      '[data-gallery]', '[data-photos]', '[data-images]'
    ];
    
    galleryContainers.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`📸 Found potential gallery container: ${selector} (${elements.length} elements)`);
        
        // Look for images within this container
        const images = elements.find('img').map((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          return src;
        }).get().filter(src => src && src.includes('img.wg-gesucht.de'));
        
        if (images.length > 0) {
          console.log(`  └─ Contains ${images.length} WG-Gesucht images`);
          images.forEach((img, i) => console.log(`     ${i + 1}. ${img}`));
        }
        console.log();
      }
    });
    
    // Look for the main content area where gallery would be
    console.log('🏠 Checking main content area...');
    const mainContent = $('.panel-body').not('.panel-sidebar');
    if (mainContent.length > 0) {
      console.log(`Found ${mainContent.length} main content areas`);
      
      mainContent.each((i, content) => {
        const $content = $(content);
        
        // Look for images that are clearly apartment photos (larger size, not thumbnails)
        const apartmentImages = $content.find('img').filter((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (!src || !src.includes('img.wg-gesucht.de')) return false;
          
          // Skip small images, logos, thumbnails
          if (src.includes('.small.') || src.includes('_small') || 
              src.includes('thumb') || src.includes('logo') ||
              src.includes('icon')) return false;
          
          // Check if it's likely an apartment photo
          const isApartmentPhoto = src.includes('sized') || 
                                  src.includes('large') || 
                                  !src.includes('small');
          
          return isApartmentPhoto;
        }).map((_, img) => $(img).attr('src') || $(img).attr('data-src')).get();
        
        if (apartmentImages.length > 0) {
          console.log(`  Content area ${i + 1}: ${apartmentImages.length} apartment images`);
          apartmentImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${img}`));
        }
      });
    }
    
    // Look for elements with background images in main content only
    console.log('\n🎨 Checking for CSS background images in main content...');
    const mainArea = $('#main_column, .col-sm-8, .panel-body').not('.panel-sidebar');
    const backgroundImages: string[] = [];
    
    mainArea.find('[style*="background-image"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const matches = style.match(/url\(['"]?(https?:\/\/img\.wg-gesucht\.de\/[^'")\s]+)['"]?\)/g);
      if (matches) {
        matches.forEach(match => {
          const url = match.replace(/url\(['"]?/, '').replace(/['"]?\)$/, '');
          if (!url.includes('.small.') && !url.includes('_small') && 
              !url.includes('thumb') && !backgroundImages.includes(url)) {
            backgroundImages.push(url);
          }
        });
      }
    });
    
    if (backgroundImages.length > 0) {
      console.log(`Found ${backgroundImages.length} background images in main content:`);
      backgroundImages.forEach((img, i) => console.log(`  ${i + 1}. ${img}`));
    } else {
      console.log('No CSS background images found in main content');
    }
    
    // Look for clickable image elements (thumbnails that open gallery)
    console.log('\n🖱️ Checking for clickable gallery elements...');
    const clickableImages = $('a[href*="img.wg-gesucht.de"], [onclick*="image"], [data-toggle*="modal"]');
    if (clickableImages.length > 0) {
      console.log(`Found ${clickableImages.length} clickable image elements:`);
      clickableImages.each((i, el) => {
        const href = $(el).attr('href');
        const onclick = $(el).attr('onclick');
        const dataToggle = $(el).attr('data-toggle');
        console.log(`  ${i + 1}. href: ${href}, onclick: ${onclick}, data-toggle: ${dataToggle}`);
      });
    }
    
    // Final summary
    console.log('\n📊 SUMMARY:');
    console.log('We need to find the specific gallery structure that contains exactly 13 images.');
    console.log('The images might be loaded via JavaScript or in a specific gallery container.');
    console.log('Consider using Puppeteer to wait for JavaScript to load the full gallery.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

focusedGalleryTest();