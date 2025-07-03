import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function findLoginUrl() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🏠 Going to WG-Gesucht homepage...');
    await page.goto('https://www.wg-gesucht.de', { waitUntil: 'networkidle2' });
    
    // Look for login links
    const loginLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const loginRelated = links
        .filter(link => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.href?.toLowerCase() || '';
          return text.includes('login') || 
                 text.includes('einloggen') || 
                 text.includes('anmelden') ||
                 href.includes('login') ||
                 href.includes('einloggen') ||
                 href.includes('sign');
        })
        .map(link => ({
          text: link.textContent?.trim(),
          href: link.href
        }));
      
      return loginRelated;
    });
    
    console.log('\n🔍 Found login-related links:');
    loginLinks.forEach(link => {
      console.log(`\n📌 "${link.text}"`);
      console.log(`   URL: ${link.href}`);
    });
    
    // Try clicking the first login link
    if (loginLinks.length > 0) {
      console.log('\n🖱️ Clicking first login link...');
      await page.goto(loginLinks[0].href, { waitUntil: 'networkidle2' });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = page.url();
      console.log('\n✅ Current URL after clicking:', currentUrl);
      
      // Check if we're on a login page
      const hasLoginForm = await page.evaluate(() => {
        return !!(document.querySelector('input[type="password"]') && 
                 (document.querySelector('input[type="email"]') || 
                  document.querySelector('input[name*="username"]')));
      });
      
      console.log('Has login form:', hasLoginForm);
    }
    
    console.log('\n⏰ Browser will close in 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } finally {
    await browser.close();
  }
}

findLoginUrl();