# WG-Gesucht Captcha Solving Guide

## Overview
WG-Gesucht uses Google reCAPTCHA to prevent automated access. This guide explains how to handle captchas when using the Puppeteer scraper.

## Option 1: Manual Solving (Default)
When a captcha appears, the scraper will:
1. Display a message: "⚠️ CAPTCHA DETECTED - Manual intervention required!"
2. Keep the browser window open
3. Wait up to 2 minutes for you to solve the captcha manually
4. Continue automatically once solved

## Option 2: Using a Captcha Extension (Recommended)
You can use a Chrome profile with a captcha-solving extension installed.

### Setup Steps:

1. **Install a Captcha Extension in Chrome**
   - [Buster](https://chrome.google.com/webstore/detail/buster-captcha-solver-for/mpbjkejclgfgadiemmefgebjfooflfhl) - Free, works well with reCAPTCHA
   - [2Captcha](https://chrome.google.com/webstore/detail/2captcha-solver/ifibfemgeogfhoebkmokieepdoobkbpo) - Paid service, more reliable
   - [Anti-Captcha](https://chrome.google.com/webstore/detail/anticaptcha-plugin/lphohgfbmcncdpcdpchamimlkopallki) - Paid service

2. **Find Your Chrome Profile Path**
   - Open Chrome and go to `chrome://version/`
   - Look for "Profile Path"
   - Common locations:
     - **Mac**: `~/Library/Application Support/Google/Chrome/Default`
     - **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data\Default`
     - **Linux**: `~/.config/google-chrome/Default`

3. **Configure Environment Variables**
   Add to your `.env.local`:
   ```bash
   # Chrome profile with captcha extension
   CHROME_PROFILE_PATH=/Users/yourusername/Library/Application Support/Google/Chrome/Default
   
   # Chrome executable (optional, usually auto-detected)
   CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
   ```

4. **Important Notes**
   - Close all Chrome windows before running the scraper
   - The scraper will use your Chrome profile with all extensions
   - Your login sessions will be preserved between runs

## Option 3: Using Puppeteer-Extra Plugins
The scraper already uses `puppeteer-extra-plugin-stealth` to avoid detection. Additional plugins can be added:

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';

puppeteer.use(StealthPlugin());
puppeteer.use(RecaptchaPlugin({
  provider: {
    id: '2captcha',
    token: 'YOUR_2CAPTCHA_API_KEY'
  }
}));
```

## Tips for Avoiding Captchas

1. **Use Realistic Delays**
   - The scraper already adds random delays between requests
   - Don't scrape too many listings at once

2. **Maintain Login Sessions**
   - Once logged in, the session cookie helps avoid captchas
   - Use the Chrome profile to persist sessions

3. **Rotate User Agents**
   - The scraper uses a realistic user agent
   - Consider rotating if doing heavy scraping

4. **Limit Request Frequency**
   - Don't run the scraper too frequently
   - Space out scraping sessions

## Troubleshooting

### "Could not find login form"
- The site structure may have changed
- Try updating the selectors in the scraper

### "Captcha keeps appearing"
- Your IP might be flagged
- Try using a different network or VPN
- Reduce scraping frequency

### "Extension not working"
- Make sure Chrome is fully closed before running
- Check that the extension is enabled in your profile
- Some extensions require API keys or credits

## Testing the Setup

Run the test script:
```bash
npm run test:puppeteer-login
```

If setup correctly, you should see:
1. Chrome opens with your profile
2. Captchas are solved automatically (if using extension)
3. Login succeeds
4. Listings are scraped with images