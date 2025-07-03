import { config } from 'dotenv';
import { chromium } from 'playwright';

config({ path: '.env.local' });

async function debugScraper() {
  console.log('🔍 Debugging WG-Gesucht scraper...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Test URLs
    const urls = [
      'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html',
      'https://www.wg-gesucht.de/1-zimmer-wohnungen-in-Berlin.8.1.1.0.html',
      'https://www.wg-gesucht.de/wohnungen-in-Berlin.8.2.1.0.html'
    ];

    for (const url of urls) {
      console.log(`\n📡 Testing: ${url}`);
      
      try {
        const response = await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        console.log(`Status: ${response?.status()}`);
        console.log(`URL after navigation: ${page.url()}`);
        
        // Check for captcha or block
        const title = await page.title();
        console.log(`Page title: ${title}`);
        
        // Check for listings
        const listingCount = await page.evaluate(() => {
          const selectors = [
            '.wgg_card.offer_list_item',
            '.offer_list_item',
            '.wgg_card'
          ];
          
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              return { selector, count: elements.length };
            }
          }
          
          return { selector: 'none', count: 0 };
        });
        
        console.log(`Found ${listingCount.count} listings with selector: ${listingCount.selector}`);
        
        // Check for error messages
        const errorCheck = await page.evaluate(() => {
          const errors = [];
          if (document.querySelector('.captcha')) errors.push('Captcha detected');
          if (document.querySelector('.g-recaptcha')) errors.push('ReCaptcha detected');
          if (document.querySelector('.alert-danger')) errors.push('Alert danger found');
          if (document.title.toLowerCase().includes('access denied')) errors.push('Access denied');
          return errors;
        });
        
        if (errorCheck.length > 0) {
          console.log(`⚠️  Issues detected: ${errorCheck.join(', ')}`);
        }
        
        // Wait a bit to see the page
        await page.waitForTimeout(3000);
        
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      }
    }
    
    console.log('\n\nPress Enter to close browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    await browser.close();
  }
}

debugScraper()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });