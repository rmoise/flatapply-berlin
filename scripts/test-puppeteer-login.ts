import { config } from 'dotenv';
config({ path: '.env.local' });
import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';

async function testPuppeteerLogin() {
  console.log('🔍 Testing WG-Gesucht Puppeteer scraper with login...\n');
  
  const username = process.env.WG_GESUCHT_EMAIL;
  const password = process.env.WG_GESUCHT_PASSWORD;
  
  if (!username || !password) {
    console.error('❌ Missing WG_GESUCHT_EMAIL or WG_GESUCHT_PASSWORD in .env.local');
    console.log('Please add these credentials to test login functionality');
    return;
  }
  
  console.log(`📧 Using credentials for: ${username}`);
  console.log(`🔑 Password: ${'*'.repeat(password.length)}`);
  
  try {
    const scraper = new WGGesuchtPuppeteerScraper();
    
    console.log('\n📡 Starting scrape with login...');
    
    const result = await scraper.scrape({
      maxRent: 1500,
      minRooms: 1,
      maxRooms: 3,
      districts: ['mitte']
    }, true); // Enable detail page enhancement
    
    console.log(`\n📊 Scraping Results:`);
    console.log(`Found: ${result.totalFound} listings`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🏠 First 3 listings:');
    for (let i = 0; i < Math.min(3, result.listings.length); i++) {
      const listing = result.listings[i];
      console.log(`\n${i + 1}. ${listing.title}`);
      console.log(`   Price: €${listing.price}`);
      console.log(`   Size: ${listing.size}m²`);
      console.log(`   Rooms: ${listing.rooms}`);
      console.log(`   URL: ${listing.url}`);
      console.log(`   Images: ${listing.images?.length || 0}`);
      console.log(`   Contact: ${listing.contactName || 'Not available'}`);
      console.log(`   Phone: ${listing.contactPhone || 'Not available (login required)'}`);
      
      if (listing.images && listing.images.length > 0) {
        console.log('   Sample images:');
        listing.images.slice(0, 2).forEach((img, idx) => {
          console.log(`     ${idx + 1}. ${img}`);
        });
      }
    }
    
    // Check if we got contact information (indicates successful login)
    const listingsWithPhone = result.listings.filter(l => l.contactPhone).length;
    if (listingsWithPhone > 0) {
      console.log(`\n✅ Login successful! Found ${listingsWithPhone} listings with phone numbers`);
    } else {
      console.log('\n⚠️  No phone numbers found - login may have failed or listings don\'t have phone numbers');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPuppeteerLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });