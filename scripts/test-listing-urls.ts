import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testListingUrls() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const searchUrl = 'https://www.wg-gesucht.de/wohnungen-in-Berlin.8.2.1.0.html?rent_to=1500';
    
    console.log('Navigating to search page...');
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    
    // Extract listing URLs
    const listingUrls = await page.evaluate(() => {
      // Look for individual listing links
      const links = document.querySelectorAll(
        'a[href*="/wohnungen-in-Berlin"][href*=".html"]:not([href*="?"])'
      );
      
      const urls = Array.from(links)
        .map(link => link.getAttribute('href'))
        .filter(href => {
          if (!href) return false;
          // Filter out search pages and other non-listing pages
          return href.match(/\/wohnungen-in-Berlin-[^.]+\.\d{7,}\.html$/) ||
                 href.match(/\/wg-zimmer-in-Berlin-[^.]+\.\d{7,}\.html$/);
        })
        .map(href => href!.startsWith('http') ? href : `https://www.wg-gesucht.de${href}`);
      
      // Also show what we're seeing
      const allLinks = Array.from(document.querySelectorAll('a[href*=".html"]'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.includes('Berlin'));
      
      return {
        listingUrls: [...new Set(urls)],
        sampleLinks: allLinks.slice(0, 10)
      };
    });
    
    console.log('\n📍 Found listing URLs:');
    listingUrls.listingUrls.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
    console.log('\n📋 Sample of all Berlin links found:');
    listingUrls.sampleLinks.forEach(link => console.log(`   ${link}`));
    
    // Test one listing
    if (listingUrls.listingUrls.length > 0) {
      console.log('\n🔍 Testing first listing...');
      await page.goto(listingUrls.listingUrls[0], { waitUntil: 'domcontentloaded' });
      
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          hasPhoneButton: !!document.querySelector('a:contains("Telefonnummer"), button:contains("Telefonnummer")'),
          hasTelLink: !!document.querySelector('a[href^="tel:"]'),
          h1Text: document.querySelector('h1')?.textContent?.trim()
        };
      });
      
      console.log('Page title:', pageInfo.title);
      console.log('H1 text:', pageInfo.h1Text);
      console.log('Has phone button:', pageInfo.hasPhoneButton);
      console.log('Has tel link:', pageInfo.hasTelLink);
    }
    
  } finally {
    await browser.close();
  }
}

testListingUrls();