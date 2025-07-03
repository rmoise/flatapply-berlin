import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testLoginUrls() {
  console.log('Testing WG-Gesucht login URLs...\n');
  
  const urls = [
    'https://www.wg-gesucht.de/mein-wg-gesucht-einloggen.html',
    'https://www.wg-gesucht.de/login.html',
    'https://www.wg-gesucht.de/anmelden.html',
    'https://www.wg-gesucht.de/en/login.html',
    'https://www.wg-gesucht.de/'
  ];
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  for (const url of urls) {
    console.log(`Testing: ${url}`);
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      const status = response?.status();
      console.log(`  Status: ${status}`);
      
      // Look for login form
      const loginForm = await page.$('form[action*="login"], form[action*="anmelden"], #login_email_username, input[name="login[email]"]');
      console.log(`  Login form found: ${loginForm ? 'Yes' : 'No'}`);
      
      // Check page title
      const title = await page.title();
      console.log(`  Title: ${title}`);
      
      // Look for login link if no form found
      if (!loginForm) {
        const loginLink = await page.$('a[href*="login"], a[href*="anmelden"], .login-link, a:contains("Anmelden"), a:contains("Login")');
        console.log(`  Login link found: ${loginLink ? 'Yes' : 'No'}`);
        
        if (loginLink) {
          // Get the href
          const href = await page.evaluate(el => el.getAttribute('href'), loginLink);
          console.log(`  Login link href: ${href}`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
  
  await browser.close();
}

testLoginUrls().catch(console.error);