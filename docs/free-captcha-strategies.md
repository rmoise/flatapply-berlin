# Free Strategies for Dealing with Captchas

## 1. 🔄 Session Persistence (Most Effective)

Save cookies after manually solving one captcha:

```typescript
// Save cookies after manual solve
const cookies = await page.cookies();
fs.writeFileSync('cookies.json', JSON.stringify(cookies));

// Load cookies on next run
const cookies = JSON.parse(fs.readFileSync('cookies.json'));
await page.setCookie(...cookies);
```

**Result**: Often no captcha for hours/days after initial solve

## 2. 🏠 Use Login Credentials

Since you have WG_GESUCHT_EMAIL and WG_GESUCHT_PASSWORD:

```typescript
// Login once
await page.goto('https://www.wg-gesucht.de/login.html');
await page.type('#login_email_username', process.env.WG_GESUCHT_EMAIL);
await page.type('#login_password', process.env.WG_GESUCHT_PASSWORD);
await page.click('#login_submit');

// Now browse without captchas (usually)
```

**Result**: Logged-in users see fewer captchas

## 3. 🕐 Smart Timing

Run scrapers when captchas are less frequent:
- Early morning (5-7 AM)
- Late evening (10 PM - midnight)
- Avoid peak hours (6-9 PM)

## 4. 🔀 Request Spacing

Add human-like delays:
```typescript
// Random delay between 3-7 seconds
const delay = 3000 + Math.random() * 4000;
await page.waitForTimeout(delay);
```

## 5. 🎯 Minimal Scraping

Only scrape what you need:
- Check specific listings you're interested in
- Avoid crawling entire categories
- Use direct URLs when possible

## 6. 🖱️ Human Behavior

Simulate real user actions:
```typescript
// Move mouse randomly
await page.mouse.move(100, 100);
await page.mouse.move(200, 300);

// Scroll naturally
await page.evaluate(() => {
  window.scrollBy(0, window.innerHeight / 2);
});
```

## 7. 🔄 Browser Profile Reuse

Keep browser profile between sessions:
```typescript
const browser = await puppeteer.launch({
  userDataDir: './browser-data', // Persists cookies, cache, etc.
  headless: false // Let it run visible sometimes
});
```

## Recommended Free Approach

1. **First Run**: Manually solve captcha, save cookies
2. **Daily Runs**: Load cookies, scrape gently
3. **If Captcha**: Wait a few hours, try again
4. **Alternative**: Use at different time

## Cost Comparison

| Method | Cost | Effectiveness | Effort |
|--------|------|--------------|---------|
| Manual solve | $0 | High | Low (once/week) |
| 2captcha | $3-15/month | Very High | None |
| Login + cookies | $0 | High | Very Low |
| Smart timing | $0 | Medium | None |

## Code Example: Cookie Persistence

```typescript
import fs from 'fs';

class WGScraperWithCookies {
  private cookieFile = './wg-cookies.json';
  
  async scrape() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Load existing cookies
    if (fs.existsSync(this.cookieFile)) {
      const cookies = JSON.parse(fs.readFileSync(this.cookieFile, 'utf-8'));
      await page.setCookie(...cookies);
      console.log('✅ Loaded saved cookies');
    }
    
    await page.goto('https://www.wg-gesucht.de/...');
    
    // Check for captcha
    const hasCaptcha = await page.$('.g-recaptcha');
    if (hasCaptcha) {
      console.log('⚠️ Captcha detected! Please solve manually...');
      console.log('💡 The browser will stay open for you to solve it');
      
      // Wait for user to solve
      await page.waitForNavigation({ timeout: 300000 }); // 5 min timeout
      
      // Save cookies after solve
      const cookies = await page.cookies();
      fs.writeFileSync(this.cookieFile, JSON.stringify(cookies, null, 2));
      console.log('✅ Cookies saved for future use');
    }
    
    // Continue scraping...
  }
}
```

## The Truth About Captchas

For personal, low-volume scraping:
- **You don't need to pay** for captcha solving
- **Manual solving once a week** is usually enough
- **Cookie persistence** works great
- **Being logged in** helps significantly

Save your money! 💰