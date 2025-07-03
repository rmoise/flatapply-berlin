import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

puppeteer.use(StealthPlugin());

async function testWithLogin() {
  const email = process.env.WG_GESUCHT_EMAIL;
  const password = process.env.WG_GESUCHT_PASSWORD;
  
  console.log('🔐 Testing WG-Gesucht with login...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: First login on the homepage
    console.log('\n1️⃣ Going to homepage to login...');
    await page.goto('https://www.wg-gesucht.de', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click login link
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const loginLink = links.find(link => 
        link.textContent?.includes('Anmelden') || link.textContent?.includes('Login')
      );
      if (loginLink) (loginLink as HTMLElement).click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill login form
    try {
      await page.type('input[name="login_email_username"]', email!, { delay: 50 });
      await page.type('input[name="login_password"]', password!, { delay: 50 });
      
      // Submit form
      await page.evaluate(() => {
        const form = document.querySelector('input[name="login_email_username"]')?.closest('form');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
          if (submitBtn) (submitBtn as HTMLElement).click();
        }
      });
      
      console.log('✅ Login submitted, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (e) {
      console.log('❌ Could not login:', e.message);
    }
    
    // Step 2: Navigate to listing
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    console.log('\n2️⃣ Navigating to listing:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check for RHS contact info
    console.log('\n3️⃣ Checking for contact info...');
    const contactInfo = await page.evaluate(() => {
      const info: any = {
        loggedIn: !!document.querySelector('a[href*="logout"]'),
        rhsPanelFound: false,
        contactName: '',
        profileImage: '',
        phoneButtonFound: false,
        phoneButtonText: ''
      };
      
      // Check RHS panel
      const rhsPanel = document.querySelector('.rhs_contact_information .user_profile_info');
      if (rhsPanel) {
        info.rhsPanelFound = true;
        
        const nameEl = rhsPanel.querySelector('p:first-of-type');
        if (nameEl) {
          info.contactName = nameEl.textContent?.trim();
        }
        
        const avatarDiv = rhsPanel.querySelector('.avatar[style*="background-image"]');
        if (avatarDiv) {
          const style = avatarDiv.getAttribute('style') || '';
          const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch) info.profileImage = urlMatch[1];
        }
      }
      
      // Check for phone button
      const phoneBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
        el.textContent?.includes('Telefonnummer anzeigen')
      );
      if (phoneBtn) {
        info.phoneButtonFound = true;
        info.phoneButtonText = phoneBtn.textContent;
      }
      
      return info;
    });
    
    console.log('Logged in:', contactInfo.loggedIn);
    console.log('RHS panel found:', contactInfo.rhsPanelFound);
    console.log('Contact name:', contactInfo.contactName || '[Not found]');
    console.log('Profile image:', contactInfo.profileImage ? 'Found' : '[Not found]');
    console.log('Phone button found:', contactInfo.phoneButtonFound);
    
    // Step 4: Try clicking phone button if exists
    if (contactInfo.phoneButtonFound) {
      console.log('\n4️⃣ Clicking phone button...');
      await page.evaluate(() => {
        const phoneBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
          el.textContent?.includes('Telefonnummer anzeigen')
        );
        if (phoneBtn) (phoneBtn as HTMLElement).click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check what happened
      const afterClick = await page.evaluate(() => {
        const loginModal = document.querySelector('#login_modal.in');
        const phoneModal = document.querySelector('.phone_numbers_content');
        
        return {
          loginModalVisible: !!loginModal,
          phoneModalFound: !!phoneModal,
          phoneNumber: phoneModal?.querySelector('.mobile_number')?.textContent,
          modalContactName: phoneModal?.querySelector('.contacted_user_name')?.textContent
        };
      });
      
      console.log('\nAfter clicking phone button:');
      console.log('Login modal visible:', afterClick.loginModalVisible);
      console.log('Phone modal found:', afterClick.phoneModalFound);
      if (afterClick.phoneModalFound) {
        console.log('Phone number:', afterClick.phoneNumber);
        console.log('Modal contact name:', afterClick.modalContactName);
      }
    }
    
    console.log('\n⏰ Browser will close in 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } finally {
    await browser.close();
  }
}

testWithLogin();