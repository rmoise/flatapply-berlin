import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

puppeteer.use(StealthPlugin());

async function testLogin() {
  const email = process.env.WG_GESUCHT_EMAIL;
  const password = process.env.WG_GESUCHT_PASSWORD;
  
  console.log('🔐 Testing WG-Gesucht login...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? '*'.repeat(password.length) : '[NOT SET]'}`);
  
  if (!email || !password) {
    console.error('❌ Missing credentials');
    return;
  }
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Try the login page
    console.log('\n📍 Navigating to login page...');
    await page.goto('https://www.wg-gesucht.de/mein-wg-gesucht-einloggen.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      const info: any = {
        title: document.title,
        url: window.location.href,
        hasEmailInput: false,
        hasPasswordInput: false,
        hasLoginButton: false,
        forms: [],
        inputs: []
      };
      
      // Look for login form elements
      const emailInputs = document.querySelectorAll('input[name*="email"], input[name*="username"], input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      
      info.hasEmailInput = emailInputs.length > 0;
      info.hasPasswordInput = passwordInputs.length > 0;
      
      // Get input names
      emailInputs.forEach(input => {
        info.inputs.push({
          name: input.getAttribute('name'),
          type: input.getAttribute('type'),
          id: input.id,
          placeholder: input.getAttribute('placeholder')
        });
      });
      
      passwordInputs.forEach(input => {
        info.inputs.push({
          name: input.getAttribute('name'),
          type: 'password',
          id: input.id,
          placeholder: input.getAttribute('placeholder')
        });
      });
      
      // Look for login buttons
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const loginButtons = buttons.filter(btn => 
        btn.textContent?.toLowerCase().includes('login') ||
        btn.textContent?.toLowerCase().includes('einloggen') ||
        btn.getAttribute('value')?.toLowerCase().includes('einloggen')
      );
      
      info.hasLoginButton = loginButtons.length > 0;
      info.loginButtonText = loginButtons[0]?.textContent || loginButtons[0]?.getAttribute('value');
      
      return info;
    });
    
    console.log('\n📋 Page Info:');
    console.log('Title:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('Has email input:', pageInfo.hasEmailInput);
    console.log('Has password input:', pageInfo.hasPasswordInput);
    console.log('Has login button:', pageInfo.hasLoginButton);
    console.log('Login button text:', pageInfo.loginButtonText);
    
    console.log('\n📝 Input fields found:');
    pageInfo.inputs.forEach(input => {
      console.log(`  - ${input.name} (${input.type}) - ${input.placeholder}`);
    });
    
    // Try to fill and submit
    if (pageInfo.hasEmailInput && pageInfo.hasPasswordInput) {
      console.log('\n✅ Login form found! Attempting to login...');
      
      // Fill email
      const emailFilled = await page.evaluate((email) => {
        const inputs = document.querySelectorAll('input[name*="email"], input[name*="username"], input[type="email"]');
        if (inputs.length > 0) {
          (inputs[0] as HTMLInputElement).value = email;
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, email);
      
      if (emailFilled) console.log('✅ Email filled');
      
      // Fill password
      const passwordFilled = await page.evaluate((password) => {
        const inputs = document.querySelectorAll('input[type="password"]');
        if (inputs.length > 0) {
          (inputs[0] as HTMLInputElement).value = password;
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, password);
      
      if (passwordFilled) console.log('✅ Password filled');
      
      // Take a screenshot before submitting
      await page.screenshot({ path: 'login-form.png' });
      console.log('📸 Screenshot saved as login-form.png');
      
      console.log('\n⏰ Browser will close in 15 seconds...');
      console.log('You can manually click the login button to test.');
    } else {
      console.log('\n❌ Login form not found on this page');
    }
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } finally {
    await browser.close();
  }
}

testLogin();