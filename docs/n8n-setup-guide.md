# n8n Setup Guide for WG-Gesucht Scraping

## Quick Start

### 1. Install n8n
```bash
# Using npm
npm install -g n8n

# Or using Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### 2. Access n8n
- Open browser: http://localhost:5678
- Create your account

### 3. Import the Workflow
1. Click "Add workflow" 
2. Click menu (⋮) → "Import from File"
3. Select `n8n-complete-wg-gesucht-workflow.json`

### 4. Set Up Credentials

#### WG-Gesucht Credentials
1. Click on any node → Credentials → Create New
2. Add:
   - Name: `WG-Gesucht Login`
   - Email: Your WG-Gesucht email
   - Password: Your WG-Gesucht password

#### Supabase Credentials
1. Click Supabase node → Credentials → Create New
2. Add:
   - Host: Your Supabase URL
   - Database: `postgres`
   - User: `postgres`
   - Password: Your database password

#### Email Credentials (for notifications)
1. Click Email node → Credentials → Create New
2. Choose your email provider (Gmail, Outlook, SMTP)

### 5. Activate the Workflow
- Click "Active" toggle in top right
- The scraper will run every 30 minutes

## What This Workflow Does

1. **Login** - Authenticates with WG-Gesucht
2. **Search** - Gets apartment listings in Berlin
3. **Extract** - Pulls all listing details
4. **Phone Reveal** - Clicks phone buttons when logged in
5. **Save** - Stores in your Supabase database
6. **Match** - Checks against user preferences
7. **Notify** - Sends email for matches

## Advanced Features

### Handle Images (Add this node after "Extract Basic Info")
```json
{
  "parameters": {
    "extractionValues": {
      "values": [
        {
          "key": "images",
          "cssSelector": "img[src*='/media/up/']",
          "returnValue": "attribute",
          "attribute": "src",
          "returnArray": true
        }
      ]
    }
  },
  "name": "Extract Images",
  "type": "n8n-nodes-base.htmlExtract"
}
```

### Add Pagination (Replace "Get Search Results")
```json
{
  "parameters": {
    "url": "={{$json.searchUrl}}?page={{$json.page}}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Cookie",
          "value": "={{$json.cookies}}"
        }
      ]
    }
  },
  "name": "Get Page Results",
  "type": "n8n-nodes-base.httpRequest"
}
```

## Limitations & Solutions

### Current Limitations:
1. **No JavaScript execution** - Can't click gallery buttons
2. **Basic image extraction** - Only gets visible images
3. **No captcha handling** - May get blocked

### Solutions:

#### Option 1: Add Puppeteer Node (Recommended)
```javascript
// In Code node - requires n8n-nodes-puppeteer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// Your scraping logic here
await page.goto($json.url);
await page.click('a[onclick*="show_email_phone"]');

const data = await page.evaluate(() => {
  return {
    title: document.querySelector('h1')?.textContent,
    // ... more extraction
  };
});

await browser.close();
return data;
```

#### Option 2: Use HTTP Request with ScrapingBee
```json
{
  "parameters": {
    "url": "https://app.scrapingbee.com/api/v1/",
    "qs": {
      "api_key": "YOUR_API_KEY",
      "url": "{{$json.listingUrl}}",
      "render_js": true,
      "wait_for": ".phone_number_shown",
      "premium_proxy": true
    }
  },
  "name": "Scrape with ScrapingBee",
  "type": "n8n-nodes-base.httpRequest"
}
```

## Monitoring & Debugging

### Add Error Handling
1. Right-click any node
2. Select "Add Error Workflow"
3. Add notification on failure

### View Execution History
- Click "Executions" in sidebar
- See what data each node processed
- Debug failures step by step

### Test Individual Nodes
- Click node → "Execute Node"
- See output immediately
- Fix issues before running full workflow

## Performance Tips

1. **Batch Processing** - Process 10-20 listings per run
2. **Smart Scheduling** - Run more frequently during peak times
3. **Caching** - Store cookies between runs
4. **Rate Limiting** - Add waits between requests

## Next Steps

1. **Test the basic workflow** first
2. **Add image extraction** if needed
3. **Consider Puppeteer node** for full features
4. **Set up monitoring** for reliability

Need help? The n8n community is very active: https://community.n8n.io/