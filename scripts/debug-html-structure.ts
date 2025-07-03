import 'dotenv/config';
import * as cheerio from 'cheerio';

async function debugHtmlStructure() {
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Debugging HTML structure for:', testUrl);
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for SmartPhoto structure
    console.log('\n🔍 Checking for SmartPhoto elements:');
    console.log('sp-wrap count:', $('.sp-wrap').length);
    console.log('sp-slide count:', $('.sp-slide').length);
    console.log('sp-image count:', $('.sp-image').length);
    console.log('sp-thumbs count:', $('.sp-thumbs').length);
    
    // Check if SmartPhoto slides exist
    if ($('.sp-slide').length > 0) {
      console.log('\n📸 SmartPhoto slides found:');
      $('.sp-slide').each((i, slide) => {
        const $slide = $(slide);
        const img = $slide.find('img.sp-image');
        console.log(`Slide ${i + 1}:`);
        console.log('  Has sp-image:', img.length > 0);
        if (img.length > 0) {
          console.log('  data-large:', img.attr('data-large'));
          console.log('  data-default:', img.attr('data-default'));
          console.log('  src:', img.attr('src'));
        }
      });
    } else {
      console.log('❌ No .sp-slide elements found');
    }
    
    // Look for any elements with data-large or data-default
    console.log('\n📸 Elements with data-large or data-default:');
    $('[data-large], [data-default]').each((i, el) => {
      console.log(`${i + 1}. ${el.tagName} - data-large: ${$(el).attr('data-large')} | data-default: ${$(el).attr('data-default')}`);
    });
    
    // Check for gallery container classes
    console.log('\n🏗️ Checking for gallery containers:');
    const galleryClasses = ['.gallery', '.photo-gallery', '.image-gallery', '.slider', '.carousel'];
    galleryClasses.forEach(cls => {
      const count = $(cls).length;
      if (count > 0) {
        console.log(`${cls}: ${count} found`);
      }
    });
    
    // Look for script content with SmartPhoto or gallery data
    console.log('\n📜 Checking scripts for gallery data:');
    let foundGalleryScript = false;
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      if (content.includes('SmartPhoto') || content.includes('sp_') || content.includes('gallery')) {
        foundGalleryScript = true;
        console.log(`Script ${i + 1} contains gallery data`);
        // Look for image URLs in this script
        const imageMatches = content.match(/https?:\/\/img\.wg-gesucht\.de\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi);
        if (imageMatches) {
          console.log(`  Found ${imageMatches.length} image URLs in script`);
          imageMatches.forEach((url, idx) => {
            if (idx < 5) { // Show first 5
              console.log(`    ${idx + 1}. ${url}`);
            }
          });
          if (imageMatches.length > 5) {
            console.log(`    ... and ${imageMatches.length - 5} more`);
          }
        }
      }
    });
    
    if (!foundGalleryScript) {
      console.log('❌ No gallery-related scripts found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugHtmlStructure();