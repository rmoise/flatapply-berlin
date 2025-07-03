import { config } from 'dotenv';
import { WGGesuchtScraper } from '../src/features/scraping/scrapers/wg-gesucht';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

async function debugScraperPrice() {
  console.log('🔍 Debugging scraper price extraction...\n');

  try {
    // First, let's manually check what the scraper sees
    const response = await fetch('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?sMax=700', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Check first listing
    const $el = $('.wgg_card.offer_list_item').first();
    
    console.log('First listing analysis:');
    
    // Check what the scraper would find
    const priceText = $el.find('.row.middle .col-xs-3 b').first().text().trim();
    console.log(`Price text found: "${priceText}"`);
    
    // Check the price extraction
    const priceMatch = priceText.match(/(\d+(?:[.,]\d+)?)/);
    console.log(`Regex match:`, priceMatch);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      console.log(`Extracted price: ${price}`);
    }
    
    // Now run the actual scraper
    console.log('\n\nRunning actual scraper:');
    const scraper = new WGGesuchtScraper();
    const result = await scraper.scrape({ maxRent: 700 }, false);
    
    console.log(`Found ${result.listings.length} listings`);
    
    if (result.listings.length > 0) {
      console.log('\nFirst listing from scraper:');
      const first = result.listings[0];
      console.log(`Title: ${first.title}`);
      console.log(`Price: ${first.price}`);
      console.log(`External ID: ${first.externalId}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugScraperPrice()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });