import { config } from 'dotenv';
import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';

// Load environment variables
config({ path: '.env.local' });

async function testSpecificListing() {
  console.log('🔍 Testing specific listing that has no images...\n');
  
  // Test one of the listings that has no images
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Charlottenburg-Wilmersdorf.12120381.html';
  console.log(`🎯 Testing: ${testUrl}`);
  console.log('This is "4-Zimmer Wohnung im August" which should have images but shows 0\n');
  
  try {
    const scraper = new WGGesuchtPuppeteerScraper();
    
    // Run scraper with detailed logging
    console.log('🚀 Running scraper...');
    const images = await scraper.extractImagesFromUrl(testUrl);
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 RESULTS');
    console.log('='.repeat(50));
    console.log(`📸 Images found: ${images.length}`);
    
    if (images.length > 0) {
      console.log('\n📸 Image URLs:');
      images.forEach((img, idx) => {
        console.log(`${idx + 1}. ${img}`);
      });
    } else {
      console.log('\n❌ No images found. Possible reasons:');
      console.log('   • Listing might be expired or inactive');
      console.log('   • Gallery might be behind additional login/verification');
      console.log('   • WG-Gesucht might have different structure for this listing');
      console.log('   • Anti-bot measures might be blocking access');
    }

  } catch (error) {
    console.error('❌ Error testing listing:', error);
  }
}

testSpecificListing();