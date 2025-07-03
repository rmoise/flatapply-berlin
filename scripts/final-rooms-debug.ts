import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function finalRoomsDebug() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Final rooms debug...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const debug = await page.evaluate(() => {
      const results = {
        zimmerLineFound: false,
        contextLines: [],
        firstZimmerIndex: -1
      };
      
      const bodyLines = document.body.innerText.split('\n');
      
      // Find the first occurrence of a line containing just "Zimmer"
      for (let i = 0; i < bodyLines.length; i++) {
        const line = bodyLines[i].trim();
        
        if (line === 'Zimmer' || line.toLowerCase() === 'zimmer') {
          results.zimmerLineFound = true;
          results.firstZimmerIndex = i;
          
          // Get context (5 lines before and after)
          for (let j = Math.max(0, i - 5); j <= Math.min(bodyLines.length - 1, i + 5); j++) {
            results.contextLines.push({
              index: j,
              line: bodyLines[j],
              isCurrent: j === i
            });
          }
          break;
        }
      }
      
      // Also check if there's a different pattern
      const pageText = document.body.innerText;
      const patterns = [
        /(\d+)\s*Zimmer/g,
        /Zimmer:\s*(\d+)/g,
        /(\d+)-Zimmer/g
      ];
      
      const matches = [];
      patterns.forEach((pattern, idx) => {
        let match;
        while ((match = pattern.exec(pageText)) !== null) {
          matches.push({
            pattern: idx,
            match: match[0],
            number: match[1]
          });
        }
      });
      
      return { ...results, patternMatches: matches.slice(0, 5) };
    });
    
    console.log('\nDebug results:');
    console.log('Found "Zimmer" line:', debug.zimmerLineFound);
    console.log('Line index:', debug.firstZimmerIndex);
    
    if (debug.contextLines.length > 0) {
      console.log('\nContext lines:');
      debug.contextLines.forEach(item => {
        const marker = item.isCurrent ? '>>>' : '   ';
        console.log(`${marker} [${item.index}] "${item.line}"`);
      });
    }
    
    console.log('\nPattern matches:');
    debug.patternMatches.forEach(m => {
      console.log(`- Pattern ${m.pattern}: "${m.match}" (number: ${m.number})`);
    });
    
    // Test the actual extraction logic
    const extractedRooms = await page.evaluate(() => {
      let rooms = 0;
      
      // Same logic as in scraper
      const bodyLines = document.body.innerText.split('\n');
      for (let i = 0; i < bodyLines.length - 1; i++) {
        const line = bodyLines[i].trim();
        const nextLine = bodyLines[i + 1].trim();
        
        if (line === 'Zimmer' && /^\d+(?:[.,]\d+)?$/.test(nextLine)) {
          rooms = parseFloat(nextLine.replace(',', '.'));
          break;
        }
      }
      
      return rooms;
    });
    
    console.log('\nExtracted rooms using scraper logic:', extractedRooms);
    
  } finally {
    await browser.close();
  }
}

finalRoomsDebug();