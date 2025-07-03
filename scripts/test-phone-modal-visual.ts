import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testPhoneModal() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test URL with phone button
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Kreuzberg.11824906.html';
    
    console.log('📍 Navigating to listing:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for phone button
    console.log('\n🔍 Looking for phone reveal button...');
    const phoneButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      const phoneBtn = buttons.find(el => 
        el.textContent?.includes('Telefonnummer anzeigen') ||
        el.textContent?.includes('Telefon anzeigen')
      );
      
      if (phoneBtn) {
        const rect = phoneBtn.getBoundingClientRect();
        return {
          found: true,
          text: phoneBtn.textContent?.trim(),
          tagName: phoneBtn.tagName,
          className: phoneBtn.className,
          id: phoneBtn.id,
          href: (phoneBtn as HTMLAnchorElement).href || '',
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        };
      }
      return { found: false };
    });
    
    if (phoneButton.found) {
      console.log('✅ Found phone button:', phoneButton.text);
      console.log('   Tag:', phoneButton.tagName);
      console.log('   Class:', phoneButton.className);
      console.log('   Position:', phoneButton.position);
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'before-phone-click.png' });
      console.log('📸 Screenshot saved: before-phone-click.png');
      
      // Click the button
      console.log('\n🖱️ Clicking phone button...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('a, button'));
        const phoneBtn = buttons.find(el => 
          el.textContent?.includes('Telefonnummer anzeigen')
        );
        if (phoneBtn) {
          (phoneBtn as HTMLElement).click();
        }
      });
      
      // Wait for modal
      console.log('⏳ Waiting for modal to appear...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check what appeared
      const modalInfo = await page.evaluate(() => {
        const info: any = {
          phoneModalFound: false,
          modalContent: '',
          visibleModals: [],
          phoneNumbers: [],
          contactNames: []
        };
        
        // Look for phone modal
        const phoneModal = document.querySelector('.phone_numbers_content');
        if (phoneModal) {
          info.phoneModalFound = true;
          info.modalContent = phoneModal.innerHTML.substring(0, 500);
          
          const name = phoneModal.querySelector('.contacted_user_name')?.textContent;
          const mobile = phoneModal.querySelector('.mobile_number')?.textContent;
          const phone = phoneModal.querySelector('.telephone_number')?.textContent;
          
          if (name) info.contactNames.push(name);
          if (mobile) info.phoneNumbers.push(`Mobile: ${mobile}`);
          if (phone) info.phoneNumbers.push(`Phone: ${phone}`);
        }
        
        // Look for any visible modals/overlays
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.zIndex && parseInt(style.zIndex) > 1000 && 
              style.display !== 'none' && 
              style.visibility !== 'hidden') {
            const classes = el.className || '';
            const id = el.id || '';
            if (classes || id) {
              info.visibleModals.push({
                tag: el.tagName,
                class: classes,
                id: id,
                zIndex: style.zIndex
              });
            }
          }
        });
        
        // Look for any tel: links
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
          info.phoneNumbers.push(`Tel link: ${link.getAttribute('href')}`);
        });
        
        return info;
      });
      
      console.log('\n📊 Modal check results:');
      console.log('Phone modal found:', modalInfo.phoneModalFound);
      console.log('Contact names:', modalInfo.contactNames);
      console.log('Phone numbers:', modalInfo.phoneNumbers);
      
      if (modalInfo.visibleModals.length > 0) {
        console.log('\n🪟 Visible overlays/modals:');
        modalInfo.visibleModals.slice(0, 10).forEach(modal => {
          console.log(`  - ${modal.tag} (z-index: ${modal.zIndex})`);
          console.log(`    class: ${modal.class}`);
          console.log(`    id: ${modal.id}`);
        });
      }
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-phone-click.png' });
      console.log('\n📸 Screenshot saved: after-phone-click.png');
      
    } else {
      console.log('❌ No phone button found');
    }
    
    console.log('\n⏰ Browser will close in 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } finally {
    await browser.close();
  }
}

testPhoneModal();