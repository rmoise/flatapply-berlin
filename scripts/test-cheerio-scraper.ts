import { config } from 'dotenv';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

async function testCheerioScraper() {
  console.log('🔍 Testing WG-Gesucht with Cheerio (no browser)...\n');

  try {
    const url = 'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?sMax=700';
    
    console.log(`📡 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ Fetched ${html.length} characters`);
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    
    // Check for captcha
    if ($('.g-recaptcha, .captcha').length > 0) {
      console.log('⚠️  Captcha detected on page');
    }
    
    // Find listings
    const listings: any[] = [];
    $('.wgg_card.offer_list_item').each((i, element) => {
      const $el = $(element);
      
      // Skip if it's a request (Gesuch)
      if ($el.hasClass('listenansicht-gesuch') || $el.find('.gesuch').length > 0) {
        return;
      }
      
      // Extract basic info
      const titleLink = $el.find('a[title]').first();
      const title = titleLink.attr('title') || titleLink.text().trim();
      const href = titleLink.attr('href');
      
      // Extract price
      const priceText = $el.find('.detail-size-price-wrapper .row .col-xs-3').first().text().trim();
      const price = priceText.match(/(\d+)/)?.[1];
      
      // Extract size and rooms
      const detailTexts = $el.find('.detail-size-price-wrapper .row .col-xs-3').map((i, el) => $(el).text().trim()).get();
      const sizeText = detailTexts.find(t => t.includes('m²')) || '';
      const roomsText = detailTexts.find(t => t.includes('Zimmer')) || '';
      
      // Extract district
      const locationText = $el.find('.col-xs-11').text().trim();
      
      listings.push({
        title: title?.replace('Anzeige ansehen: ', ''),
        price: price ? parseInt(price) : null,
        size: sizeText.match(/(\d+)/)?.[1],
        rooms: roomsText.match(/(\d+)/)?.[1],
        location: locationText,
        url: href ? `https://www.wg-gesucht.de${href}` : null
      });
    });
    
    console.log(`\n📊 Results:`);
    console.log(`Found ${listings.length} listings`);
    
    // Show first 5 listings
    console.log('\n📋 Sample listings:');
    listings.slice(0, 5).forEach((listing, i) => {
      console.log(`\n${i + 1}. ${listing.title}`);
      console.log(`   Price: €${listing.price || 'N/A'}`);
      console.log(`   Size: ${listing.size || 'N/A'} m²`);
      console.log(`   Rooms: ${listing.rooms || 'N/A'}`);
      console.log(`   Location: ${listing.location || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCheerioScraper()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });