import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugRooms() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Finding rooms information...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const roomsDebug = await page.evaluate(() => {
      const results = [];
      
      // Find all <b> tags that might contain room info
      document.querySelectorAll('b').forEach(b => {
        const text = b.textContent || '';
        if (text.includes('Zimmer')) {
          const parent = b.parentElement;
          results.push({
            boldText: text.trim(),
            parentTag: parent?.tagName,
            parentClass: parent?.className,
            parentText: parent?.textContent?.trim().substring(0, 200),
            selector: parent?.tagName ? `${parent.tagName.toLowerCase()}${parent.className ? '.' + parent.className.split(' ').join('.') : ''}` : 'unknown'
          });
        }
      });
      
      // Also check spans and other elements
      const roomsMatch = document.body.innerText.match(/(\d+(?:[.,]\d+)?)\s*Zimmer/);
      
      return {
        boldTags: results,
        bodyMatch: roomsMatch ? roomsMatch[0] : null
      };
    });
    
    console.log('\n=== Bold tags with "Zimmer" ===');
    roomsDebug.boldTags.forEach((item, i) => {
      console.log(`\n${i + 1}. Bold text: "${item.boldText}"`);
      console.log(`   Parent: <${item.parentTag} class="${item.parentClass}">`);
      console.log(`   Parent text: "${item.parentText}"`);
      console.log(`   Selector: ${item.selector}`);
    });
    
    console.log('\n=== Body text match ===');
    console.log('Rooms found:', roomsDebug.bodyMatch);
    
    // Now let's check the main content area structure
    const contentStructure = await page.evaluate(() => {
      const mainContent = document.querySelector('.panel-body, .main-content, [class*="content"]');
      if (!mainContent) return null;
      
      // Get first few elements to understand structure
      const children = Array.from(mainContent.children).slice(0, 10).map(child => ({
        tag: child.tagName,
        class: child.className,
        text: child.textContent?.trim().substring(0, 100)
      }));
      
      return {
        mainSelector: mainContent.tagName + '.' + mainContent.className,
        children
      };
    });
    
    console.log('\n=== Main content structure ===');
    console.log(JSON.stringify(contentStructure, null, 2));
    
  } finally {
    await browser.close();
  }
}

debugRooms();