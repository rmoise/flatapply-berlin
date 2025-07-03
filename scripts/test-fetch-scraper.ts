import { config } from 'dotenv';
import { WGGesuchtFetchScraper } from '../src/features/scraping/scrapers/wg-gesucht-fetch';

config({ path: '.env.local' });

async function testFetchScraper() {
  console.log('🔍 Testing WG-Gesucht fetch-based scraper...\n');

  const scraper = new WGGesuchtFetchScraper();
  
  const testCases = [
    { name: 'WG Rooms', filters: { maxRent: 700 } },
    { name: '1-Room Apartments', filters: { maxRent: 1200, maxRooms: 1 } },
    { name: '2+ Room Apartments', filters: { maxRent: 2000, minRooms: 2 } }
  ];

  for (const test of testCases) {
    console.log(`\n📡 Testing: ${test.name}`);
    console.log(`Filters: ${JSON.stringify(test.filters)}`);
    
    try {
      const result = await scraper.scrape(test.filters);
      
      console.log(`✅ Found: ${result.totalFound} listings`);
      
      // Show first 3 listings
      if (result.listings.length > 0) {
        console.log('\nSample listings:');
        result.listings.slice(0, 3).forEach((listing, i) => {
          console.log(`\n${i + 1}. ${listing.title}`);
          console.log(`   Price: €${listing.price || 'N/A'}`);
          console.log(`   Size: ${listing.size || 'N/A'} m²`);
          console.log(`   Rooms: ${listing.rooms || 'N/A'}`);
          console.log(`   District: ${listing.district || 'Not specified'}`);
          console.log(`   Available: ${listing.availableFrom ? listing.availableFrom.toLocaleDateString() : 'Not specified'}`);
          console.log(`   URL: ${listing.url}`);
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }
}

testFetchScraper()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });