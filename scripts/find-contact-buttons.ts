import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function findContactButtons() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test multiple listings
    const urls = [
      'https://www.wg-gesucht.de/wohnungen-in-Berlin-Kreuzberg.11824906.html',
      'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html',
      'https://www.wg-gesucht.de/wohnungen-in-Berlin-Mitte.12120484.html'
    ];
    
    for (const url of urls) {
      console.log(`\n📍 Checking: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find all buttons/links in the contact area
      const contactInfo = await page.evaluate(() => {
        const info: any = {
          buttons: [],
          contactAreaText: '',
          hasPhoneLink: false,
          visiblePhoneNumbers: []
        };
        
        // Find contact area
        const contactSelectors = [
          '.panel_r',
          '.sidebar',
          '.contact_box',
          '.offer_contact_box',
          '[class*="contact"]'
        ];
        
        let contactArea = null;
        for (const selector of contactSelectors) {
          const area = document.querySelector(selector);
          if (area) {
            contactArea = area;
            break;
          }
        }
        
        if (contactArea) {
          info.contactAreaText = contactArea.textContent?.substring(0, 200);
          
          // Find all clickable elements
          const clickables = contactArea.querySelectorAll('a, button');
          clickables.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 2) {
              info.buttons.push({
                text: text,
                tag: el.tagName,
                href: (el as HTMLAnchorElement).href || '',
                classes: el.className
              });
            }
          });
        }
        
        // Check for any tel: links
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
          info.hasPhoneLink = true;
          info.visiblePhoneNumbers.push(link.getAttribute('href'));
        });
        
        // Look for phone patterns in text
        const pageText = document.body.textContent || '';
        const phoneMatches = pageText.match(/(?:\+49|0)\d{2,4}[\s\-]?\d{3,10}/g);
        if (phoneMatches) {
          info.visiblePhoneNumbers.push(...phoneMatches);
        }
        
        return info;
      });
      
      console.log('\n📊 Contact area info:');
      console.log('Buttons found:', contactInfo.buttons.length);
      contactInfo.buttons.forEach(btn => {
        console.log(`  - "${btn.text}" (${btn.tag})`);
      });
      
      if (contactInfo.hasPhoneLink) {
        console.log('\n📱 Phone numbers visible:');
        contactInfo.visiblePhoneNumbers.forEach(phone => {
          console.log(`  - ${phone}`);
        });
      }
      
      console.log('\n📝 Contact area preview:');
      console.log(contactInfo.contactAreaText);
    }
    
    console.log('\n⏰ Browser will close in 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } finally {
    await browser.close();
  }
}

findContactButtons();