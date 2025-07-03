import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

puppeteer.use(StealthPlugin());

async function testPhoneReveal() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test URL - you can change this to any WG-Gesucht listing
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin.12120181.html';
    
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for contact info before clicking
    console.log('\n📱 Before clicking phone button:');
    const beforeInfo = await page.evaluate(() => {
      const info: any = {};
      
      // Check for phone button
      const phoneButton = document.querySelector('a[data-rel="phone_number"], .show_phone_number') ||
                         Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('Telefonnummer anzeigen'));
      info.hasPhoneButton = !!phoneButton;
      info.phoneButtonText = phoneButton?.textContent?.trim();
      
      // Check for visible phone
      const telLink = document.querySelector('a[href^="tel:"]');
      info.hasPhoneLink = !!telLink;
      info.phoneNumber = telLink?.getAttribute('href')?.replace('tel:', '');
      
      // Check for contact name
      const nameElements = document.querySelectorAll('.text-capitalize, .user_name, .contact_name');
      info.contactNames = Array.from(nameElements).map(el => el.textContent?.trim()).filter(Boolean);
      
      return info;
    });
    
    console.log('Has phone button:', beforeInfo.hasPhoneButton);
    console.log('Phone button text:', beforeInfo.phoneButtonText);
    console.log('Has phone link:', beforeInfo.hasPhoneLink);
    console.log('Phone number:', beforeInfo.phoneNumber);
    console.log('Contact names found:', beforeInfo.contactNames);
    
    // Try to click phone button
    if (beforeInfo.hasPhoneButton) {
      console.log('\n🖱️ Clicking phone reveal button...');
      
      const clicked = await page.evaluate(() => {
        const selectors = [
          'a[data-rel="phone_number"]',
          '.show_phone_number',
          'a[onclick*="show_phone"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            (element as HTMLElement).click();
            return true;
          }
        }
        
        // Try text-based search
        const links = Array.from(document.querySelectorAll('a, button'));
        const phoneBtn = links.find(el => 
          el.textContent?.includes('Telefonnummer anzeigen') ||
          el.textContent?.includes('Telefon anzeigen')
        );
        if (phoneBtn) {
          (phoneBtn as HTMLElement).click();
          return true;
        }
        
        return false;
      });
      
      if (clicked) {
        console.log('✅ Phone button clicked!');
        
        // Wait for phone to appear
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for contact info after clicking
        console.log('\n📱 After clicking phone button:');
        const afterInfo = await page.evaluate(() => {
          const info: any = {};
          
          // Check for visible phone
          const telLink = document.querySelector('a[href^="tel:"]');
          info.hasPhoneLink = !!telLink;
          info.phoneNumber = telLink?.getAttribute('href')?.replace('tel:', '');
          info.phoneText = telLink?.textContent?.trim();
          
          // Check for contact name again
          const nameElements = document.querySelectorAll('.text-capitalize, .user_name, .contact_name, .print_phone_box .name');
          info.contactNames = Array.from(nameElements).map(el => el.textContent?.trim()).filter(Boolean);
          
          // Get all text from contact area
          const contactArea = document.querySelector('.panel_r, .sidebar, .contact_box');
          info.contactAreaText = contactArea?.textContent?.replace(/\s+/g, ' ').trim();
          
          return info;
        });
        
        console.log('Has phone link:', afterInfo.hasPhoneLink);
        console.log('Phone number:', afterInfo.phoneNumber);
        console.log('Phone text:', afterInfo.phoneText);
        console.log('Contact names found:', afterInfo.contactNames);
        console.log('\nContact area text:', afterInfo.contactAreaText?.substring(0, 200) + '...');
      } else {
        console.log('❌ Could not click phone button');
      }
    }
    
    // Keep browser open for 10 seconds to inspect
    console.log('\n⏰ Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPhoneReveal();