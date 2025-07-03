import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testModalExtraction() {
  const scraper = new WGGesuchtPuppeteerScraper();
  
  // Test URLs - you can add more
  const testUrls = [
    'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html',
    'https://www.wg-gesucht.de/wohnungen-in-Berlin-Mitte.12120484.html',
    'https://www.wg-gesucht.de/wohnungen-in-Berlin-Kreuzberg.11824906.html'
  ];
  
  console.log('🔍 Testing contact extraction with phone modal...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`\n📍 Testing: ${url}`);
      console.log('Extracting listing details...');
      
      const listing = await scraper.extractFullListingDetails(url);
      
      if (listing) {
        console.log('\n✅ Results:');
        console.log(`Title: ${listing.title || '[Empty]'}`);
        console.log(`Contact Name: ${listing.contactName || '[Not found]'}`);
        console.log(`Contact Phone: ${listing.contactPhone || '[Not found]'}`);
        console.log(`Contact Email: ${listing.contactEmail || '[Not found]'}`);
        console.log(`Price: €${listing.price || 0}`);
        console.log(`Size: ${listing.size || 0}m²`);
        console.log(`District: ${listing.district || '[Not found]'}`);
        console.log(`Images: ${listing.images?.length || 0}`);
        
        // Show a sample of the description
        if (listing.description) {
          console.log(`Description preview: ${listing.description.substring(0, 100)}...`);
        }
      } else {
        console.log('❌ Failed to extract listing');
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error processing ${url}:`, error.message);
    }
  }
  
  console.log('\n✅ Test complete!');
}

testModalExtraction().catch(console.error);