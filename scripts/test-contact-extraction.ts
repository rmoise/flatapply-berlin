import { WGGesuchtStealthScraper } from '../src/features/scraping/scrapers/wg-gesucht-stealth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testContactExtraction() {
  console.log('🧪 Testing contact name extraction from WG-Gesucht listings...\n');
  
  const scraper = new WGGesuchtStealthScraper({
    headless: true,
    requestDelay: 2000
  });
  
  try {
    // Scrape first page of listings
    const searchParams = {
      url: 'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html',
      forUserId: 'test-user',
      maxPages: 1
    };
    
    console.log('📋 Scraping listings...');
    const listings = await scraper.scrapeListings(searchParams);
    
    console.log(`✅ Found ${listings.length} listings\n`);
    
    // Show contact names found
    const listingsWithContacts = listings.filter(l => l.contact?.name);
    console.log(`📧 Listings with contact names: ${listingsWithContacts.length}/${listings.length}\n`);
    
    if (listingsWithContacts.length > 0) {
      console.log('Sample listings with contact names:');
      listingsWithContacts.slice(0, 5).forEach((listing, idx) => {
        console.log(`\n${idx + 1}. ${listing.title}`);
        console.log(`   👤 Contact: ${listing.contact?.name}`);
        console.log(`   💰 Price: €${listing.price || listing.costs?.baseRent}/month`);
        console.log(`   📍 Location: ${listing.location?.district || 'Unknown'}`);
      });
    } else {
      console.log('❌ No contact names found. Showing first 3 listings for debugging:');
      listings.slice(0, 3).forEach((listing, idx) => {
        console.log(`\n${idx + 1}. ${listing.title}`);
        console.log(`   Contact info:`, listing.contact);
      });
    }
    
    // Stats
    console.log('\n📊 Statistics:');
    console.log(`   Total listings: ${listings.length}`);
    console.log(`   With contact names: ${listingsWithContacts.length} (${Math.round(listingsWithContacts.length / listings.length * 100)}%)`);
    
    // Cleanup
    await scraper.cleanup();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Also test the phone extraction patterns
function testPhonePatterns() {
  console.log('\n\n📱 Testing phone number patterns:');
  
  const testTexts = [
    'Handy: 017630716170',
    'Mobile: +49 176 30716170',
    'Tel: 030-12345678',
    'Telefon: 0176 307 16170',
    'WhatsApp: +491763071617',
    'Contact me at 0176-3071-6170',
    'Call 030 1234 5678'
  ];
  
  const phonePatterns = [
    /(?:handy|mobile|telefon|tel|phone|whatsapp)[\s:]*\+?[\d\s\-\(\)]+/gi,
    /\+49[\s\-]?[\d\s\-\(\)]{10,}/g,
    /0[\d]{2,4}[\s\-]?[\d\s\-]{5,}/g,
    /\b\d{3,5}[\s\-]?\d{3,8}\b/g
  ];
  
  testTexts.forEach(text => {
    console.log(`\nTesting: "${text}"`);
    let found = false;
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/[^\d\+\s\-\(\)]/g, '').trim();
          const digitCount = cleaned.replace(/\D/g, '').length;
          if (digitCount >= 10 && digitCount <= 15) {
            console.log(`  ✅ Found: ${cleaned}`);
            found = true;
          }
        });
      }
    }
    if (!found) {
      console.log('  ❌ No valid phone number found');
    }
  });
}

testContactExtraction().catch(console.error);