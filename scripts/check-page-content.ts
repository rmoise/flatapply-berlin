import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function checkPageContent() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Checking page content...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Skip saving HTML for now
    
    // Check if the page is showing listing details
    const pageInfo = await page.evaluate(() => {
      return {
        hasH1: !!document.querySelector('h1'),
        h1Text: document.querySelector('h1')?.textContent?.trim(),
        hasPrice: document.body.innerText.includes('€'),
        hasSize: document.body.innerText.includes('m²'),
        hasImages: document.querySelectorAll('img').length,
        pageUrl: window.location.href,
        pageTitle: document.title
      };
    });
    
    console.log('\nPage info:', pageInfo);
    
    // Look for any text containing "2 Zimmer"
    const zimmerSearch = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const matches = [];
      const lines = bodyText.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('2 Zimmer') || line.includes('Zimmer')) {
          matches.push({
            lineIndex: index,
            line: line.trim(),
            prevLine: lines[index - 1]?.trim(),
            nextLine: lines[index + 1]?.trim()
          });
        }
      });
      
      return matches.slice(0, 5); // First 5 matches
    });
    
    console.log('\nLines containing "Zimmer":');
    zimmerSearch.forEach((match, i) => {
      console.log(`\n${i + 1}. Line ${match.lineIndex}:`);
      console.log(`   Previous: ${match.prevLine || '(none)'}`);
      console.log(`   >>> Current: ${match.line}`);
      console.log(`   Next: ${match.nextLine || '(none)'}`);
    });
    
  } finally {
    await browser.close();
  }
}

checkPageContent();