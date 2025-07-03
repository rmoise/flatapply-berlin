import 'dotenv/config';
import * as cheerio from 'cheerio';

async function findAllImages() {
  const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🔍 Finding ALL images on:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('\n📸 All WG-Gesucht images found in HTML:');
    const allImages: Set<string> = new Set();
    
    // Check all img tags
    $('img').each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy');
      if (src && src.includes('img.wg-gesucht.de')) {
        allImages.add(src);
        console.log(`${i + 1}. <img> tag: ${src}`);
      }
    });
    
    // Check all links
    console.log('\n🔗 WG-Gesucht images in links:');
    $('a[href*="img.wg-gesucht.de"]').each((i, link) => {
      const href = $(link).attr('href');
      if (href) {
        allImages.add(href);
        console.log(`${i + 1}. <a> tag: ${href}`);
      }
    });
    
    // Search in all scripts
    console.log('\n📜 Searching for image URLs in scripts...');
    let scriptImageCount = 0;
    $('script').each((_, script) => {
      const content = $(script).html() || '';
      const matches = content.match(/https?:\/\/img\.wg-gesucht\.de\/[^"'\s]+/g);
      if (matches) {
        matches.forEach(url => {
          if (!allImages.has(url)) {
            allImages.add(url);
            scriptImageCount++;
            console.log(`Found in script: ${url}`);
          }
        });
      }
    });
    console.log(`Found ${scriptImageCount} unique images in scripts`);
    
    // Check inline styles
    console.log('\n🎨 Checking inline styles...');
    $('[style*="img.wg-gesucht.de"]').each((i, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?(https?:\/\/img\.wg-gesucht\.de\/[^'")]+)/);
      if (match) {
        allImages.add(match[1]);
        console.log(`${i + 1}. In style: ${match[1]}`);
      }
    });
    
    // Filter and categorize
    const fullSizeImages = Array.from(allImages).filter(img => 
      !img.includes('.small.') && 
      !img.includes('_small') && 
      !img.includes('/thumb/') &&
      !img.includes('_thumb')
    );
    
    const smallImages = Array.from(allImages).filter(img => 
      img.includes('.small.') || 
      img.includes('_small') || 
      img.includes('/thumb/') ||
      img.includes('_thumb')
    );
    
    console.log('\n📊 Summary:');
    console.log(`Total unique images found: ${allImages.size}`);
    console.log(`Full-size images: ${fullSizeImages.length}`);
    console.log(`Small/thumbnail images: ${smallImages.length}`);
    
    console.log('\n🖼️ Full-size images:');
    fullSizeImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findAllImages();