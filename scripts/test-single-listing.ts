import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testSingleListing() {
  const scraper = new WGGesuchtPuppeteerScraper();
  
  // Test with a specific listing that should have contact info
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Kreuzberg.11824906.html';
  
  console.log('🔍 Testing single listing extraction...');
  console.log('URL:', testUrl);
  console.log('\nExtracting listing details...\n');
  
  try {
    const listing = await scraper.extractFullListingDetails(testUrl);
    
    if (listing) {
      console.log('✅ Extraction completed!\n');
      console.log('📊 Results:');
      console.log('─'.repeat(50));
      console.log(`Title: ${listing.title || '[Empty]'}`);
      console.log(`Price: €${listing.price || 0}`);
      console.log(`Size: ${listing.size || 0}m²`);
      console.log(`Rooms: ${listing.rooms || 0}`);
      console.log(`District: ${listing.district || '[Not found]'}`);
      
      console.log('\n👤 Contact Information:');
      console.log('─'.repeat(50));
      console.log(`Name: ${listing.contactName || '[Not found]'}`);
      console.log(`Phone: ${listing.contactPhone || '[Not found]'}`);
      console.log(`Email: ${listing.contactEmail || '[Not found]'}`);
      
      console.log('\n📝 Description:');
      console.log('─'.repeat(50));
      if (listing.description) {
        console.log(listing.description.substring(0, 200) + '...');
      } else {
        console.log('[No description]');
      }
      
      console.log(`\n🖼️  Images: ${listing.images?.length || 0}`);
      
      // Check if we found any contact info
      const hasContactInfo = listing.contactName || listing.contactPhone || listing.contactEmail;
      if (hasContactInfo) {
        console.log('\n✅ SUCCESS: Contact information was extracted!');
      } else {
        console.log('\n⚠️  WARNING: No contact information was found. This could mean:');
        console.log('   - The listing doesn\'t have a phone reveal button');
        console.log('   - The scraper needs to be logged in');
        console.log('   - The modal didn\'t appear properly');
      }
      
    } else {
      console.log('❌ Failed to extract listing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSingleListing();