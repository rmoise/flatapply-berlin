import { chromium } from 'playwright';
import fs from 'fs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function loginToWGGesucht() {
  console.log('🔐 WG-Gesucht Login Setup\n');
  
  // Check for credentials in environment variables
  let email = process.env.WG_GESUCHT_EMAIL;
  let password = process.env.WG_GESUCHT_PASSWORD;
  
  if (!email || !password) {
    console.log('📝 Please enter your WG-Gesucht credentials:');
    console.log('   (These will only be used for this session)\n');
    
    if (!email) {
      email = await question('Email: ');
    }
    if (!password) {
      // Note: In a real terminal, you'd want to hide password input
      password = await question('Password: ');
    }
  } else {
    console.log('✅ Using credentials from environment variables');
  }
  
  rl.close();
  
  const browser = await chromium.launch({ 
    headless: false // Show browser so user can solve CAPTCHA if needed
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n🌐 Navigating to WG-Gesucht...');
    await page.goto('https://www.wg-gesucht.de/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Accept cookies if present
    try {
      const cookieSelectors = [
        '.cmpboxbtn.cmpboxbtnyes',
        '#cmpwelcomebtnyes',
        'button:has-text("Alle akzeptieren")'
      ];
      
      for (const selector of cookieSelectors) {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          console.log('✅ Accepted cookies');
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch (e) {
      // Cookie banner might not appear
    }
    
    // Click on "Mein Konto" to open login modal
    console.log('📝 Looking for login link...');
    
    // Debug: log what we see in the navbar
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.nav_item a, .navbar a, nav a'));
      return links.map(a => ({ text: a.textContent?.trim(), href: a.getAttribute('href') }));
    });
    console.log('Found nav links:', navLinks.filter(l => l.text?.toLowerCase().includes('konto') || l.text?.toLowerCase().includes('login')));
    
    // Try multiple selectors for the login link
    const loginSelectors = [
      'a:has-text("Mein Konto")',
      'a[href*="mein-wg-gesucht"]',
      '.nav_item a[href*="mein-wg-gesucht"]',
      'a:has-text("Anmelden")',
      'a:has-text("Login")',
      '[data-nav_item_name="login"]'
    ];
    
    let clicked = false;
    for (const selector of loginSelectors) {
      try {
        const link = await page.locator(selector).first();
        if (await link.isVisible({ timeout: 1000 })) {
          await link.click();
          console.log(`✅ Clicked login link with selector: ${selector}`);
          clicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find login link in navbar');
    }
    
    // Wait for login form to appear (could be modal or dropdown)
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[name="login_email_username"]', { timeout: 5000 });
    
    console.log('📝 Filling login form...');
    
    // Find and fill email field using the exact ID
    await page.fill('#login_email_username', email!);
    
    // Find and fill password field using the exact ID
    await page.fill('#login_password', password!);
    
    // Check "Remember me" if available - it's already checked by default
    const rememberMe = await page.locator('#auto_login');
    if (await rememberMe.isVisible() && !(await rememberMe.isChecked())) {
      await rememberMe.check();
    }
    
    console.log('🎯 Clicking login button...');
    console.log('⚠️  If a CAPTCHA appears, please solve it manually');
    
    // Click login submit button using the exact ID
    await page.click('#login_submit');
    
    // Wait for login to complete
    try {
      // Since it's a modal, we don't navigate - just wait for login indicators
      await page.waitForTimeout(2000); // Give login time to process
      
      // Check if we're logged in by looking for logout button or user menu
      const isLoggedIn = await page.evaluate(() => {
        return !!(
          document.querySelector('.logout_button') ||
          document.querySelector('.user_menu') ||
          document.querySelector('a[href*="logout"]') ||
          document.querySelector('a[href*="ausloggen"]')
        );
      });
      
      if (isLoggedIn) {
        console.log('\n✅ Login successful!');
        
        // Save session cookies
        const cookies = await context.storageState();
        fs.writeFileSync('.wg-cookies.json', JSON.stringify(cookies, null, 2));
        console.log('💾 Session saved to .wg-cookies.json');
        
        // Get username if available
        const username = await page.evaluate(() => {
          const userEl = document.querySelector('.user_name, .username, .nav-username');
          return userEl?.textContent?.trim();
        });
        
        if (username) {
          console.log(`👤 Logged in as: ${username}`);
        }
        
        console.log('\n🎉 You can now run the scraper with phone extraction!');
        console.log('   The session will be automatically loaded.');
        
      } else {
        console.error('\n❌ Login failed - could not find logged-in indicators');
        console.log('   Please check your credentials and try again');
      }
      
    } catch (error) {
      console.error('\n❌ Login failed or timed out');
      console.log('   This might be due to:');
      console.log('   - Incorrect credentials');
      console.log('   - CAPTCHA not solved');
      console.log('   - Network issues');
      console.error('\nError:', error.message);
    }
    
    // Keep browser open for a moment so user can see the result
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error during login:', error);
  } finally {
    await browser.close();
  }
}

// Run the login
loginToWGGesucht().catch(console.error);