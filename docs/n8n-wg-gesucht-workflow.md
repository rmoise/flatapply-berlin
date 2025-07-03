# n8n Workflow for WG-Gesucht Scraping

## Overview
n8n can automate your WG-Gesucht scraping with a visual workflow. Here's how to set it up:

## Workflow Components

### 1. Schedule Trigger
- Run every 30 minutes
- Or webhook trigger for on-demand

### 2. HTTP Request Node
```json
{
  "url": "https://www.wg-gesucht.de/wohnungen-in-Berlin.8.2.1.0.html",
  "method": "GET",
  "headers": {
    "User-Agent": "Mozilla/5.0...",
    "Cookie": "{{$node["Login"].json["cookies"]}}"
  }
}
```

### 3. HTML Extract Node
- Extract listing URLs using CSS selectors
- Parse titles, prices, districts

### 4. Loop Over Items
- Process each listing URL
- Add delay between requests

### 5. Puppeteer Node (for JavaScript rendering)
```javascript
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.goto(items[0].url);

// Click phone reveal button
await page.click('a[onclick*="show_email_phone"]');

// Extract data
const data = await page.evaluate(() => {
  return {
    title: document.querySelector('h1')?.textContent,
    phone: document.querySelector('.phone_number_shown')?.textContent,
    // ... more fields
  };
});

await browser.close();
return [{ json: data }];
```

### 6. Supabase Node
- Insert/update listings in database
- Check for duplicates

### 7. Email/Notification Node
- Send alerts for new matches

## Advanced Features

### Use n8n with Proxy Services
```javascript
// In Code node
const browser = await puppeteer.launch({
  args: [
    '--proxy-server=http://proxy.brightdata.com:22225',
    '--no-sandbox'
  ]
});

// Authenticate proxy
await page.authenticate({
  username: 'your-username',
  password: 'your-password'
});
```

### Handle Login State
1. Create a separate workflow for login
2. Store cookies in n8n variables
3. Reuse cookies in scraping workflow

### Error Handling
- Use Error Trigger node
- Implement retry logic
- Log failures to database

## Benefits of n8n

1. **Visual Workflow** - Easy to understand and modify
2. **Self-hosted** - Full control over your data
3. **Integrations** - Connect to 400+ services
4. **Scheduling** - Built-in cron functionality
5. **Error Handling** - Visual debugging
6. **Version Control** - Export/import workflows as JSON

## Example Workflow Structure

```
[Schedule Trigger]
    ↓
[Login to WG-Gesucht]
    ↓
[Get Search Results]
    ↓
[Extract Listing URLs]
    ↓
[Loop: For Each Listing]
    ↓
[Scrape Listing Details]
    ↓
[Save to Supabase]
    ↓
[Check Preferences]
    ↓
[Send Notifications]
```

## Premium Alternative: n8n Cloud + ScrapingBee

Combine n8n with ScrapingBee for best results:

```javascript
// In HTTP Request node
{
  "url": "https://app.scrapingbee.com/api/v1/",
  "method": "GET",
  "qs": {
    "api_key": "{{$credentials.scrapingBee.apiKey}}",
    "url": "{{$json["listingUrl"]}}",
    "render_js": true,
    "premium_proxy": true,
    "country_code": "de"
  }
}
```

This gives you:
- No proxy management
- Automatic retry
- JavaScript rendering
- Anti-bot bypass

## Cost Comparison

1. **n8n Self-hosted**: Free (just server costs ~$5-20/month)
2. **n8n Cloud**: $20+/month
3. **n8n + ScrapingBee**: $20 + $49 = $69/month
4. **n8n + Bright Data**: $20 + $500+ = $520+/month

## Recommendation

For your use case, I recommend:
1. **Start with n8n self-hosted** + your current Puppeteer scraper
2. **If blocked**: Add ScrapingBee for €49/month
3. **For scale**: Consider Bright Data or Apify

Would you like me to create a complete n8n workflow JSON for you?