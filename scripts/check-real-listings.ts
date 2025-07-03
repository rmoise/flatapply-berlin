import { config } from 'dotenv';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

async function checkRealListings() {
  console.log('🔍 Checking real WG-Gesucht listings...\n');

  try {
    // Fetch without price filter to see all listings
    const response = await fetch('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('Analyzing all listings on page:\n');
    
    const priceDistribution: Record<string, number> = {};
    
    $('.wgg_card.offer_list_item').each((i, element) => {
      const $el = $(element);
      
      // Skip requests
      if ($el.hasClass('listenansicht-gesuch')) {
        return;
      }
      
      const title = $el.find('a[title]').first().attr('title')?.replace('Anzeige ansehen: ', '') || '';
      
      // Find price
      let priceText = '';
      $el.find('.row.middle .col-xs-3').each((_, col) => {
        const text = $(col).text().trim();
        if (text.includes('€')) {
          priceText = text;
          return false;
        }
      });
      
      const priceMatch = priceText.match(/(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 0;
      
      // Track price distribution
      const priceRange = price <= 1 ? '€1 or less' : 
                       price <= 500 ? '€2-500' :
                       price <= 700 ? '€501-700' :
                       price <= 1000 ? '€701-1000' : '€1000+';
      
      priceDistribution[priceRange] = (priceDistribution[priceRange] || 0) + 1;
      
      if (i < 10) {
        console.log(`${i + 1}. ${title.substring(0, 60)}...`);
        console.log(`   Price: €${price} (raw: "${priceText}")`);
      }
    });
    
    console.log('\n\nPrice distribution:');
    Object.entries(priceDistribution).forEach(([range, count]) => {
      console.log(`${range}: ${count} listings`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRealListings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });