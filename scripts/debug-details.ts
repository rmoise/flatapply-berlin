import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugDetails() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Analyzing page structure for details extraction...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const detailsDebug = await page.evaluate(() => {
      const results = {
        tables: [],
        definitionLists: [],
        keyFactItems: [],
        detailLists: [],
        roomsText: []
      };
      
      // Find all tables
      document.querySelectorAll('.table tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent?.trim());
        if (cells.length > 0) {
          results.tables.push(cells);
        }
      });
      
      // Find definition lists
      document.querySelectorAll('dl').forEach(dl => {
        const dts = Array.from(dl.querySelectorAll('dt')).map(dt => ({
          label: dt.textContent?.trim(),
          value: dt.nextElementSibling?.textContent?.trim()
        }));
        results.definitionLists.push(dts);
      });
      
      // Find key-fact-items
      document.querySelectorAll('.key-fact-item').forEach(item => {
        results.keyFactItems.push(item.textContent?.trim());
      });
      
      // Find detail lists
      document.querySelectorAll('.detail-list li').forEach(li => {
        results.detailLists.push(li.textContent?.trim());
      });
      
      // Find any text containing "Zimmer"
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Zimmer') && text.length < 100) {
          results.roomsText.push({
            tag: el.tagName,
            class: el.className,
            text: text.trim()
          });
        }
      });
      
      return results;
    });
    
    console.log('\n=== Tables ===');
    console.log(JSON.stringify(detailsDebug.tables, null, 2));
    
    console.log('\n=== Definition Lists ===');
    console.log(JSON.stringify(detailsDebug.definitionLists, null, 2));
    
    console.log('\n=== Key Fact Items ===');
    console.log(JSON.stringify(detailsDebug.keyFactItems, null, 2));
    
    console.log('\n=== Detail Lists ===');
    console.log(JSON.stringify(detailsDebug.detailLists, null, 2));
    
    console.log('\n=== Elements containing "Zimmer" ===');
    detailsDebug.roomsText.slice(0, 10).forEach(item => {
      console.log(`<${item.tag} class="${item.class}">: ${item.text}`);
    });
    
  } finally {
    await browser.close();
  }
}

debugDetails();