import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

puppeteer.use(StealthPlugin());

async function testLoginAndPhone() {
  const email = process.env.WG_GESUCHT_EMAIL;
  const password = process.env.WG_GESUCHT_PASSWORD;
  
  console.log('🔐 Testing WG-Gesucht login and phone reveal...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? '*'.repeat(password.length) : '[NOT SET]'}`);
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to a listing
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Kreuzberg.11824906.html';
    console.log('\n📍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 1: Click phone button
    console.log('\n1️⃣ Clicking phone reveal button...');
    const phoneClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button'));
      const phoneBtn = buttons.find(el => 
        el.textContent?.includes('Telefonnummer anzeigen')
      );
      if (phoneBtn) {
        (phoneBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (!phoneClicked) {
      console.log('❌ Phone button not found');
      return;
    }
    
    console.log('✅ Phone button clicked');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Check if login modal appeared
    console.log('\n2️⃣ Checking for login modal...');
    const modalInfo = await page.evaluate(() => {
      const loginModal = document.querySelector('#login_modal');
      const modalVisible = loginModal && window.getComputedStyle(loginModal).display !== 'none';
      
      return {
        modalFound: !!loginModal,
        modalVisible: modalVisible,
        modalClasses: loginModal?.className || '',
        hasEmailInput: !!document.querySelector('#login_modal input[name="login_email_username"]'),
        hasPasswordInput: !!document.querySelector('#login_modal input[name="login_password"]')
      };
    });
    
    console.log('Login modal found:', modalInfo.modalFound);
    console.log('Modal visible:', modalInfo.modalVisible);
    console.log('Has email input:', modalInfo.hasEmailInput);
    console.log('Has password input:', modalInfo.hasPasswordInput);
    
    if (modalInfo.modalVisible && modalInfo.hasEmailInput && modalInfo.hasPasswordInput) {
      // Step 3: Fill login form
      console.log('\n3️⃣ Filling login form...');
      
      await page.type('#login_modal input[name="login_email_username"]', email!, { delay: 50 });
      console.log('✅ Email filled');
      
      await page.type('#login_modal input[name="login_password"]', password!, { delay: 50 });
      console.log('✅ Password filled');
      
      // Step 4: Submit login
      console.log('\n4️⃣ Submitting login...');
      const loginSubmitted = await page.evaluate(() => {
        const modal = document.querySelector('#login_modal');
        if (!modal) return false;
        
        const buttons = modal.querySelectorAll('button, input[type="submit"]');
        const loginBtn = Array.from(buttons).find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          const value = (btn as HTMLInputElement).value?.toLowerCase() || '';
          return text.includes('einloggen') || text.includes('login') || value.includes('einloggen');
        });
        
        if (loginBtn) {
          console.log('Found login button:', loginBtn.textContent || (loginBtn as HTMLInputElement).value);
          (loginBtn as HTMLElement).click();
          return true;
        }
        
        console.log('Available buttons:', Array.from(buttons).map(b => b.textContent || (b as HTMLInputElement).value));
        return false;
      });
      
      if (loginSubmitted) {
        console.log('✅ Login submitted');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if logged in
        const isLoggedIn = await page.evaluate(() => {
          return !!document.querySelector('a[href*="logout"]') || 
                 !document.querySelector('#login_modal.in');
        });
        
        console.log('Logged in:', isLoggedIn);
        
        if (isLoggedIn) {
          // Step 5: Click phone button again
          console.log('\n5️⃣ Clicking phone button again...');
          const phoneClickedAgain = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('a, button'));
            const phoneBtn = buttons.find(el => 
              el.textContent?.includes('Telefonnummer anzeigen')
            );
            if (phoneBtn) {
              (phoneBtn as HTMLElement).click();
              return true;
            }
            return false;
          });
          
          if (phoneClickedAgain) {
            console.log('✅ Phone button clicked again');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 6: Check for phone modal
            console.log('\n6️⃣ Checking for phone modal...');
            const phoneModalInfo = await page.evaluate(() => {
              const phoneModal = document.querySelector('.phone_numbers_content');
              if (phoneModal) {
                return {
                  found: true,
                  contactName: phoneModal.querySelector('.contacted_user_name')?.textContent?.trim(),
                  mobileNumber: phoneModal.querySelector('.mobile_number')?.textContent?.trim(),
                  telephoneNumber: phoneModal.querySelector('.telephone_number')?.textContent?.trim()
                };
              }
              return { found: false };
            });
            
            if (phoneModalInfo.found) {
              console.log('\n✅ SUCCESS! Phone modal found:');
              console.log('Contact Name:', phoneModalInfo.contactName || '[Not found]');
              console.log('Mobile:', phoneModalInfo.mobileNumber || '[Not found]');
              console.log('Telephone:', phoneModalInfo.telephoneNumber || '[Not found]');
            } else {
              console.log('❌ Phone modal not found');
            }
          }
        }
      } else {
        console.log('❌ Could not find login button');
      }
    } else {
      console.log('❌ Login modal did not appear or is not ready');
    }
    
    console.log('\n⏰ Browser will close in 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } finally {
    await browser.close();
  }
}

testLoginAndPhone();