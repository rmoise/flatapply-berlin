import { config } from 'dotenv';
import { chromium } from 'playwright';

config({ path: '.env.local' });

async function testWithStealth() {
  console.log('🔍 Testing WG-Gesucht with enhanced stealth...\n');

  const browser = await chromium.launch({
    headless: false, // Run in visible mode
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--disable-features=OutOfBlinkCors'
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      permissions: ['geolocation'],
      geolocation: { latitude: 52.520008, longitude: 13.404954 }, // Berlin coordinates
    });

    const page = await context.newPage();
    
    // Add extra stealth
    await page.addInitScript(() => {
      // Override the webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['de-DE', 'de', 'en-US', 'en'],
      });
      
      // Override chrome detection
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
    });

    const url = 'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html';
    console.log(`📡 Navigating to: ${url}`);
    
    try {
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      console.log(`Status: ${response?.status()}`);
      console.log(`URL after navigation: ${page.url()}`);
      
      // Wait a bit for content to load
      await page.waitForTimeout(3000);
      
      // Check page title
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      // Check for listings
      const listingInfo = await page.evaluate(() => {
        const selectors = [
          '.wgg_card.offer_list_item',
          '.offer_list_item',
          '.wgg_card',
          '.list-details-ad-border'
        ];
        
        const results: any = {
          listings: {}
        };
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            results.listings[selector] = elements.length;
          }
        });
        
        // Check for blocks/captchas
        results.blocked = {
          captcha: !!document.querySelector('.g-recaptcha, .captcha'),
          cloudflare: document.title.includes('Just a moment') || !!document.querySelector('#cf-content'),
          accessDenied: document.title.toLowerCase().includes('access denied'),
          errorPage: !!document.querySelector('.error-page, .alert-danger')
        };
        
        // Get some page content
        results.bodyText = document.body.innerText.substring(0, 200);
        
        return results;
      });
      
      console.log('\n📊 Results:');
      console.log('Listings found:', JSON.stringify(listingInfo.listings, null, 2));
      console.log('Blocking detected:', JSON.stringify(listingInfo.blocked, null, 2));
      console.log('Page preview:', listingInfo.bodyText);
      
      // Take a screenshot
      await page.screenshot({ path: 'wg-gesucht-test.png' });
      console.log('\n📸 Screenshot saved as wg-gesucht-test.png');
      
    } catch (error) {
      console.error(`❌ Navigation error: ${error instanceof Error ? error.message : error}`);
    }
    
    console.log('\n⏸️  Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await browser.close();
  }
}

testWithStealth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });