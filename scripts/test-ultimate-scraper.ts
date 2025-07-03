import 'dotenv/config';
import { WGGesuchtAdBlockerScraper } from '../src/features/scraping/scrapers/wg-gesucht-ad-blocker';

async function testUltimateScraper() {
  const scraper = new WGGesuchtAdBlockerScraper();
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Neukoelln.10667556.html';
  
  console.log('🚀 Testing AD-BLOCKING scraper approach for:', testUrl);
  console.log('Expected: 13 images');
  console.log('This will BLOCK ADS and force show gallery - watch the magic!\n');
  
  try {
    const images = await scraper.extractImagesFromUrl(testUrl);
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ FINAL RESULT: ${images.length} images found`);
    console.log('='.repeat(50));
    
    if (images.length > 0) {
      console.log('\n📸 Extracted Image URLs:');
      images.forEach((img, i) => {
        console.log(`${i + 1}. ${img}`);
      });
    }
    
    if (images.length === 13) {
      console.log('\n🎉 SUCCESS: Found all 13 images from the gallery!');
    } else if (images.length > 2) {
      console.log(`\n🎯 PROGRESS: Found ${images.length} images (more than previous attempts)`);
    } else {
      console.log(`\n⚠️  RESULT: Found ${images.length} images (same as before)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUltimateScraper();