import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugContactExtraction() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin.12120181.html';
    
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click phone reveal button
    console.log('\n1️⃣ Looking for phone reveal button...');
    const phoneButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      const phoneBtn = buttons.find(el => 
        el.textContent?.includes('Telefonnummer anzeigen') ||
        el.textContent?.includes('Telefon anzeigen')
      );
      if (phoneBtn) {
        (phoneBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (phoneButtonClicked) {
      console.log('✅ Phone button clicked!');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Extract contact info
    console.log('\n2️⃣ Extracting contact information...');
    const contactInfo = await page.evaluate(() => {
      const info: any = {
        foundTelLink: false,
        phoneNumber: '',
        contactName: '',
        containerHTML: '',
        containerText: ''
      };
      
      // Find tel: link
      const telLink = document.querySelector('a[href^="tel:"]') as HTMLAnchorElement;
      if (telLink) {
        info.foundTelLink = true;
        info.phoneNumber = telLink.href.replace('tel:', '').trim();
        
        // Find the container
        const container = telLink.closest('.panel-body, .offer_contact_box, .contact_box, div');
        if (container) {
          info.containerHTML = container.innerHTML.substring(0, 500);
          info.containerText = container.textContent?.trim().substring(0, 500);
          
          // Try to extract name
          const lines = container.textContent?.split('\n').map(s => s.trim()).filter(s => s) || [];
          const phoneLineIndex = lines.findIndex(line => 
            line.includes(info.phoneNumber) || 
            line.match(/(?:Handy|Telefon|Tel|Mobile):/i)
          );
          
          if (phoneLineIndex > 0) {
            info.contactName = lines[phoneLineIndex - 1];
          }
        }
      }
      
      // Also check for any visible contact info
      const contactSelectors = [
        '.offer_contact_box',
        '.contact_box',
        '.panel-body:has(a[href^="tel:"])',
        '.print_phone_box'
      ];
      
      for (const selector of contactSelectors) {
        const elem = document.querySelector(selector);
        if (elem && elem.textContent) {
          info[`${selector}_text`] = elem.textContent.trim().substring(0, 200);
        }
      }
      
      return info;
    });
    
    console.log('\n📱 Contact Info Results:');
    console.log('Found tel link:', contactInfo.foundTelLink);
    console.log('Phone number:', contactInfo.phoneNumber);
    console.log('Contact name:', contactInfo.contactName);
    console.log('\nContainer HTML preview:');
    console.log(contactInfo.containerHTML);
    console.log('\nContainer text preview:');
    console.log(contactInfo.containerText);
    
    // Show other contact areas found
    console.log('\n📍 Other contact areas:');
    Object.keys(contactInfo).forEach(key => {
      if (key.includes('_text')) {
        console.log(`${key}:`, contactInfo[key]);
      }
    });
    
    console.log('\n⏰ Browser will close in 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } finally {
    await browser.close();
  }
}

debugContactExtraction();