import 'dotenv/config';
import * as cheerio from 'cheerio';

async function testGalleryFetch() {
  const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Fetching gallery images from:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const images: Set<string> = new Set();
    
    // Method 1: Look for SmartPhoto data in script tags
    console.log('\n📜 Checking script tags for gallery data...');
    $('script').each((_, script) => {
      const content = $(script).html() || '';
      
      // Look for SmartPhoto initialization
      if (content.includes('new SmartPhoto') || content.includes('sp_config')) {
        console.log('Found SmartPhoto initialization!');
        
        // Extract image URLs from the script
        // SmartPhoto usually has an array of images like: [{src: "url1"}, {src: "url2"}]
        const imagePattern = /[{,]\s*['"]*src['"]*\s*:\s*['"](https?:\/\/[^'"]+)['"]/g;
        let match;
        while ((match = imagePattern.exec(content)) !== null) {
          if (match[1].includes('img.wg-gesucht.de') && !match[1].includes('.small.')) {
            images.add(match[1]);
          }
        }
        
        // Also look for simple URL arrays
        const urlPattern = /["'](https?:\/\/img\.wg-gesucht\.de\/[^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
        let urlMatch;
        while ((urlMatch = urlPattern.exec(content)) !== null) {
          if (!urlMatch[1].includes('.small.') && !urlMatch[1].includes('/thumb/')) {
            images.add(urlMatch[1]);
          }
        }
      }
    });
    
    // Method 2: Check data attributes
    console.log('\n🔍 Checking data attributes...');
    $('[data-sp-src]').each((_, el) => {
      const src = $(el).attr('data-sp-src');
      if (src && src.includes('img.wg-gesucht.de') && !src.includes('.small.')) {
        images.add(src);
      }
    });
    
    // Method 3: Check gallery thumbnails
    console.log('\n🖼️ Checking gallery thumbnails...');
    $('.sp-thumbs a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('img.wg-gesucht.de')) {
        images.add(href);
      }
    });
    
    // Method 4: Check noscript fallbacks
    $('noscript').each((_, noscript) => {
      const content = $(noscript).html() || '';
      const $noscript = cheerio.load(content);
      $noscript('img').each((_, img) => {
        const src = $noscript(img).attr('src');
        if (src && src.includes('img.wg-gesucht.de') && !src.includes('.small.')) {
          images.add(src);
        }
      });
    });
    
    // Convert to array and filter
    const uniqueImages = Array.from(images).filter(img => {
      // Remove query parameters for comparison
      const baseUrl = img.split('?')[0];
      // Skip small versions
      return !baseUrl.includes('.small.') && !baseUrl.includes('_small') && !baseUrl.includes('/thumb/');
    });
    
    console.log(`\n✅ Found ${uniqueImages.length} unique gallery images:`);
    uniqueImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img}`);
    });
    
    // Also show what we found in the HTML structure
    console.log('\n📊 HTML Structure Analysis:');
    console.log('- SmartPhoto wrapper found:', $('.sp-wrap').length > 0);
    console.log('- SmartPhoto thumbnails:', $('.sp-thumbs a').length);
    console.log('- Data-sp-src elements:', $('[data-sp-src]').length);
    console.log('- Total img tags:', $('img').length);
    console.log('- Gallery containers:', $('.gallery, .image-gallery, .slider').length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGalleryFetch();