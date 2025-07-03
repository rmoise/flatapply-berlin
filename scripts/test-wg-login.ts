import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testWGLogin() {
  console.log('Testing WG-Gesucht login functionality...');
  
  // Check if credentials are set
  const email = process.env.WG_GESUCHT_EMAIL;
  const password = process.env.WG_GESUCHT_PASSWORD;
  
  if (!email || !password) {
    console.error('❌ WG_GESUCHT_EMAIL and WG_GESUCHT_PASSWORD must be set in .env.local');
    return;
  }
  
  console.log('✅ Credentials found in environment');
  
  const scraper = new WGGesuchtPuppeteerScraper();
  
  try {
    console.log('\nRunning scraper with login...');
    const result = await scraper.scrape({
      maxRent: 2000,
      minRooms: 2
    });
    
    console.log('\n📊 Scraping Results:');
    console.log(`Total listings found: ${result.totalFound}`);
    console.log(`Listings processed: ${result.listings.length}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.listings.length > 0) {
      console.log('\n🏠 Sample Listings with Contact Info:');
      result.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.title}`);
        console.log(`   Contact Name: ${listing.contactName || '[No name found]'}`);
        console.log(`   Contact Phone: ${listing.contactPhone || '[No phone found]'}`);
        console.log(`   Contact Email: ${listing.contactEmail || '[No email found]'}`);
        console.log(`   Price: €${listing.price}`);
        console.log(`   Size: ${listing.size}m²`);
        console.log(`   Images: ${listing.images?.length || 0}`);
        console.log(`   URL: ${listing.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
  }
}

testWGLogin();