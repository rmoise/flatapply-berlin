import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testContactExtraction() {
  console.log('Testing contact info extraction from WG-Gesucht...');
  
  const scraper = new WGGesuchtPuppeteerScraper();
  
  // Test with a specific listing URL
  const testUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Koepenick.8.2.1.0.html?offer=12100309';
  
  try {
    console.log('\nExtracting listing details from:', testUrl);
    const listing = await scraper.extractFullListingDetails(testUrl);
    
    if (listing) {
      console.log('\n✅ Listing extracted successfully:');
      console.log(`Title: ${listing.title}`);
      console.log(`Price: €${listing.price}`);
      console.log(`Size: ${listing.size}m²`);
      console.log(`Rooms: ${listing.rooms}`);
      console.log(`District: ${listing.district}`);
      console.log(`\n📞 Contact Information:`);
      console.log(`Name: ${listing.contactName || '[Not found]'}`);
      console.log(`Phone: ${listing.contactPhone || '[Not found]'}`);
      console.log(`Email: ${listing.contactEmail || '[Not found]'}`);
      console.log(`\n📝 Description preview:`);
      console.log(listing.description?.substring(0, 200) + '...');
      console.log(`\n🖼️  Images: ${listing.images?.length || 0}`);
    } else {
      console.log('❌ Failed to extract listing');
    }
    
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

testContactExtraction().then(() => {
  testPhonePatterns();
});