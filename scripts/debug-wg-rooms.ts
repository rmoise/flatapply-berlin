import { config } from 'dotenv';
import { chromium } from 'playwright';

config({ path: '.env.local' });

async function debugWGRooms() {
  console.log('🔍 Debugging WG-Gesucht rooms page...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const url = 'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?sMax=1000';
    
    console.log(`📡 Fetching: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    await page.waitForTimeout(3000);

    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      const results: any = {
        title: document.title,
        listings: []
      };

      // Try different selectors
      const selectors = [
        '.wgg_card.offer_list_item',
        '.offer_list_item',
        '.wgg_card',
        '.list-details-ad-border',
        '.list-details',
        '.panel.panel-default',
        'article',
        '[data-ad-id]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = elements.length;
          
          // Get details from first element
          if (selector === '.wgg_card.offer_list_item' || selector === '.offer_list_item' || selector === '.wgg_card') {
            const firstEl = elements[0];
            const titleEl = firstEl.querySelector('a[title], .card-title a, h3 a');
            if (titleEl) {
              results.listings.push({
                selector,
                title: titleEl.textContent?.trim() || titleEl.getAttribute('title'),
                href: titleEl.getAttribute('href')
              });
            }
          }
        }
      });

      // Check if we're on an error page
      const errorMessages = document.querySelectorAll('.alert-danger, .error-message, .captcha');
      if (errorMessages.length > 0) {
        results.error = 'Possible error or captcha page';
      }

      return results;
    });

    console.log('Page title:', pageInfo.title);
    console.log('\nFound elements:');
    Object.entries(pageInfo).forEach(([key, value]) => {
      if (key !== 'title' && key !== 'listings' && key !== 'error') {
        console.log(`${key}: ${value}`);
      }
    });

    if (pageInfo.error) {
      console.log('\n⚠️ ', pageInfo.error);
    }

    if (pageInfo.listings.length > 0) {
      console.log('\n📋 Sample listings:');
      pageInfo.listings.forEach((listing: any) => {
        console.log(`- ${listing.title}`);
        console.log(`  URL: ${listing.href}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugWGRooms()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });