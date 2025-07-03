import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugHTML() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Fetching page HTML structure...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug title selectors
    const titleDebug = await page.evaluate(() => {
      const selectors = [
        'h1.headline.headline-detailed-view-title',
        'h1.headline-detailed-view-title',
        'h1.headline',
        '.headline-title',
        'h1[itemprop="name"]',
        '.panel-title h1',
        'h1'
      ];
      
      const results = {};
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        results[sel] = el ? el.textContent?.trim() : 'NOT FOUND';
      });
      
      // Also check for any h1 elements
      const allH1 = Array.from(document.querySelectorAll('h1')).map(h1 => ({
        class: h1.className,
        text: h1.textContent?.trim()
      }));
      
      return { selectors: results, allH1 };
    });
    
    console.log('\n=== Title Debug ===');
    console.log('Selector results:', JSON.stringify(titleDebug.selectors, null, 2));
    console.log('\nAll H1 elements:', JSON.stringify(titleDebug.allH1, null, 2));
    
    // Debug description selectors
    const descDebug = await page.evaluate(() => {
      const selectors = [
        '.freitext',
        '.freitext_content',
        '#freitext',
        '.description_text',
        '.description',
        '.panel-body.wordWrap',
        '.wordWrap'
      ];
      
      const results = {};
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        results[sel] = el ? `Found (${el.textContent?.length} chars)` : 'NOT FOUND';
      });
      
      return results;
    });
    
    console.log('\n=== Description Debug ===');
    console.log(JSON.stringify(descDebug, null, 2));
    
    // Debug basic details
    const detailsDebug = await page.evaluate(() => {
      // Look for price
      const priceText = document.body.innerText.match(/(\d+)\s*€/);
      
      // Look for rooms
      const roomsText = document.body.innerText.match(/(\d+(?:,\d+)?)\s*Zimmer/i);
      
      // Look for size
      const sizeText = document.body.innerText.match(/(\d+)\s*m²/);
      
      return {
        priceFound: priceText ? priceText[0] : 'NOT FOUND',
        roomsFound: roomsText ? roomsText[0] : 'NOT FOUND',
        sizeFound: sizeText ? sizeText[0] : 'NOT FOUND'
      };
    });
    
    console.log('\n=== Basic Details Debug ===');
    console.log(JSON.stringify(detailsDebug, null, 2));
    
  } finally {
    await browser.close();
  }
}

debugHTML();