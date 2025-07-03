import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugRoomsFinal() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Debugging rooms extraction logic...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const debug = await page.evaluate(() => {
      const results = {
        size: 0,
        title: '',
        bodyTextSample: '',
        roomsFound: {
          strategy1: null,
          strategy2: null,
          strategy3: null
        }
      };
      
      // Get size first
      const sizeMatch = document.body.innerText.match(/(\d+)\s*m²/);
      if (sizeMatch) {
        results.size = parseInt(sizeMatch[1]);
      }
      
      // Get title
      const titleEl = document.querySelector('h1');
      if (titleEl) {
        results.title = titleEl.textContent?.trim() || '';
      }
      
      // Strategy 1: Look for pattern with size
      if (results.size) {
        const sizeStr = results.size.toString();
        const roomPattern = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*Zimmer\\s*\\w*\\s*\\|\\s*${sizeStr}\\s*m²`, 'i');
        const roomMatch = document.body.innerText.match(roomPattern);
        if (roomMatch) {
          results.roomsFound.strategy1 = roomMatch[0];
        }
      }
      
      // Show sample of body text around "65 m²"
      const bodyText = document.body.innerText;
      const sizeIndex = bodyText.indexOf('65 m²');
      if (sizeIndex > -1) {
        results.bodyTextSample = bodyText.substring(Math.max(0, sizeIndex - 50), sizeIndex + 50);
      }
      
      // Strategy 2: First bold with Zimmer
      const allBolds = document.querySelectorAll('b');
      for (const bold of allBolds) {
        const text = bold.textContent || '';
        if (text.includes('Zimmer')) {
          let parent = bold.parentElement;
          let isInMapCard = false;
          while (parent && parent !== document.body) {
            if (parent.className.includes('map_card')) {
              isInMapCard = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!isInMapCard) {
            results.roomsFound.strategy2 = text;
            break;
          }
        }
      }
      
      // Strategy 3: In title
      if (results.title) {
        const titleRoomMatch = results.title.match(/(\d+(?:[.,]\d+)?)\s*Zimmer/i);
        if (titleRoomMatch) {
          results.roomsFound.strategy3 = titleRoomMatch[0];
        }
      }
      
      return results;
    });
    
    console.log('\n=== Debug Results ===');
    console.log('Size found:', debug.size);
    console.log('Title:', debug.title);
    console.log('\nBody text around "65 m²":');
    console.log(debug.bodyTextSample);
    console.log('\nRooms extraction results:');
    console.log('- Strategy 1 (pattern with size):', debug.roomsFound.strategy1);
    console.log('- Strategy 2 (first bold):', debug.roomsFound.strategy2);
    console.log('- Strategy 3 (in title):', debug.roomsFound.strategy3);
    
  } finally {
    await browser.close();
  }
}

debugRoomsFinal();