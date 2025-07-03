# Recommended Apify Actors for WG-Gesucht

## 🏆 Top Recommendations

### 1. **Web Scraper** (Most Recommended)
- **Actor ID**: `apify/web-scraper`
- **Cost**: ~$2.50 per 1000 pages
- **Why**: Most flexible and maintained by Apify team

**Setup:**
```javascript
{
  "startUrls": [
    {
      "url": "https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html",
      "method": "GET"
    }
  ],
  "pseudoUrls": [
    {
      "purl": "https://www.wg-gesucht.de/[.*]-in-Berlin[.*].html"
    }
  ],
  "pageFunction": `
    async function pageFunction(context) {
      const { $, request, log } = context;
      
      // For listing pages
      if (request.url.includes('.html') && !request.url.includes('offer_filter')) {
        const listings = [];
        
        $('.offer_list_item').each((i, el) => {
          const $el = $(el);
          listings.push({
            title: $el.find('h3').text().trim(),
            price: parseInt($el.find('.col-xs-3').first().text().replace(/[^0-9]/g, '')),
            size: $el.find('.col-xs-3').eq(1).text().trim(),
            district: $el.find('.col-xs-11').text().trim(),
            url: 'https://www.wg-gesucht.de' + $el.find('a').attr('href')
          });
        });
        
        return listings;
      }
    }
  `,
  "maxConcurrency": 5,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

### 2. **Puppeteer Scraper** (Current - Needs Fix)
- **Actor ID**: `apify/puppeteer-scraper`
- **Cost**: ~$3.75 per 1000 pages
- **Issue**: Your current implementation returns 0 results

**Fixed Configuration:**
```javascript
{
  "startUrls": [{
    "url": "https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?offer_filter=1&noDeact=1&city_id=8&rent_types=0"
  }],
  "pseudoUrls": [],
  "linkSelector": "a.detailansicht",
  "pageFunction": `
    async function pageFunction(context) {
      const { page, request, log } = context;
      
      // Wait for listings
      await page.waitForSelector('.offer_list_item', { timeout: 10000 });
      
      // Extract listings
      const listings = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.offer_list_item').forEach(item => {
          const title = item.querySelector('h3')?.innerText || '';
          const price = item.querySelector('.col-xs-3')?.innerText || '';
          const link = item.querySelector('a')?.href || '';
          
          if (title && price && link) {
            items.push({
              title: title.trim(),
              price: parseInt(price.replace(/[^0-9]/g, '')) || 0,
              url: link,
              externalId: link.match(/\\.([0-9]+)\\.html/)?.[1] || ''
            });
          }
        });
        return items;
      });
      
      return { listings };
    }
  `,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

### 3. **Cheerio Scraper** (Fastest & Cheapest)
- **Actor ID**: `apify/cheerio-scraper`
- **Cost**: ~$0.25 per 1000 pages
- **Best for**: High volume, when JavaScript rendering not needed

### 4. **Custom WG-Gesucht Actor** (If Available)
Search Apify Store for:
- "WG-Gesucht Scraper"
- "German Real Estate Scraper"
- "Wohnung Scraper"

## 🔧 How to Implement

### Step 1: Update Your Code

Replace the current Apify implementation in `wg-gesucht-apify.ts`:

```typescript
async scrape(filters: SearchFilters = {}): Promise<ScrapingResult> {
  const run = await this.apifyClient.actor('apify/web-scraper').call({
    startUrls: [
      {
        url: `https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?offer_filter=1&noDeact=1&sMin=${filters.minRent}&sMax=${filters.maxRent}`,
        method: 'GET',
        userData: { label: 'LIST' }
      }
    ],
    pageFunction: `
      async function pageFunction(context) {
        const { $, request, log, skipLinks } = context;
        
        if (request.userData.label === 'LIST') {
          const listings = [];
          
          $('.offer_list_item, .wgg_card, [data-id]').each((i, el) => {
            const $el = $(el);
            const link = $el.find('a.detailansicht, a[href*=".html"]').attr('href');
            if (!link) return;
            
            const id = link.match(/\\.([0-9]+)\\.html/)?.[1];
            if (!id) return;
            
            listings.push({
              externalId: id,
              url: link.startsWith('http') ? link : 'https://www.wg-gesucht.de' + link,
              title: $el.find('h3, .truncate_title').text().trim(),
              price: parseInt($el.find('.col-xs-3, .rent').first().text().replace(/[^0-9]/g, '')) || 0,
              size: parseInt($el.find('.col-xs-3').eq(1).text().replace(/[^0-9]/g, '')) || null,
              district: $el.find('.col-xs-11, .location').text().trim().split(',')[0],
              platform: 'wg_gesucht'
            });
          });
          
          log.info(\`Found \${listings.length} listings on page\`);
          
          // Don't follow detail links to save credits
          skipLinks();
          
          return { listings };
        }
      }
    `,
    maxRequestsPerCrawl: 10,
    maxConcurrency: 3,
    proxyConfiguration: {
      useApifyProxy: true
    }
  });
  
  // Process results...
}
```

### Step 2: Test Different Actors

```bash
# Install Apify CLI
npm install -g apify-cli

# Login
apify login

# Test actors locally
apify call apify/web-scraper -i input.json
```

### Step 3: Monitor Costs

Each actor has different pricing:
- **Web Scraper**: $2.50/1000 pages
- **Puppeteer**: $3.75/1000 pages  
- **Cheerio**: $0.25/1000 pages

For WG-Gesucht, Web Scraper usually works best.

## 💡 Pro Tips

1. **Use Residential Proxies**
   ```javascript
   "proxyConfiguration": {
     "useApifyProxy": true,
     "apifyProxyGroups": ["RESIDENTIAL"]
   }
   ```

2. **Limit Pages to Save Credits**
   ```javascript
   "maxRequestsPerCrawl": 20,
   "maxConcurrency": 3
   ```

3. **Skip Detail Pages**
   - Extract all info from list pages
   - Only visit details if needed

4. **Test in Apify Console First**
   - Go to: https://console.apify.com/actors
   - Try different actors with small runs
   - Check which gives best results

## 🚀 Quick Start

1. Add credits to your account
2. Use Web Scraper actor
3. Copy the configuration above
4. Test with 5-10 pages first
5. Scale up if working

The Web Scraper with residential proxies should work much better than the current Puppeteer setup!