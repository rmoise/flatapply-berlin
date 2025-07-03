import { config } from 'dotenv';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

async function debugPriceExtraction() {
  console.log('🔍 Debugging price extraction...\n');

  try {
    const response = await fetch('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?sMax=700', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Get first few listings
    $('.wgg_card.offer_list_item').slice(0, 3).each((i, element) => {
      const $el = $(element);
      
      console.log(`\n--- Listing ${i + 1} ---`);
      
      // Get title
      const titleLink = $el.find('a[title]').first();
      const title = titleLink.attr('title') || titleLink.text().trim();
      console.log(`Title: ${title}`);
      
      // Debug all text in the card
      console.log('\nAll text blocks:');
      $el.find('.row').each((j, row) => {
        const rowText = $(row).text().replace(/\s+/g, ' ').trim();
        if (rowText) {
          console.log(`Row ${j}: ${rowText.substring(0, 100)}...`);
        }
      });
      
      // Try different price selectors
      console.log('\nPrice extraction attempts:');
      
      const selectors = [
        '.row.middle .col-xs-3 b',
        '.row.middle .col-xs-3:first-child b',
        '.row.middle .col-xs-3:first-child',
        '.col-xs-3 b',
        'b:contains("€")',
        ':contains("€")',
      ];
      
      selectors.forEach(selector => {
        const elements = $el.find(selector);
        if (elements.length > 0) {
          elements.each((k, el) => {
            const text = $(el).text().trim();
            if (text && (text.includes('€') || text.match(/^\d+$/))) {
              console.log(`  ${selector} => "${text}"`);
            }
          });
        }
      });
      
      // Check middle row specifically
      console.log('\nMiddle row analysis:');
      const middleRow = $el.find('.row.middle');
      if (middleRow.length > 0) {
        console.log(`Found middle row: ${middleRow.length}`);
        middleRow.find('.col-xs-3').each((k, col) => {
          const colText = $(col).text().trim();
          console.log(`  Col ${k}: "${colText}"`);
        });
      } else {
        // Try other row patterns
        console.log('No .row.middle found, checking other patterns:');
        $el.find('.row').each((k, row) => {
          const $row = $(row);
          if ($row.find('b').length > 0 || $row.text().includes('€')) {
            console.log(`  Row ${k} with price info:`);
            $row.find('.col-xs-3').each((l, col) => {
              const colText = $(col).text().trim();
              if (colText) console.log(`    Col ${l}: "${colText}"`);
            });
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugPriceExtraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });