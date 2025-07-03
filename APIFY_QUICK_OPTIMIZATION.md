# Quick Apify Cost Optimization Guide

## 🚀 Immediate Actions (Save 80% Today)

### 1. Reduce Cron Frequency (2 minutes)

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scraper",
      "schedule": "0 8,18 * * *"
    }
  ]
}
```
This changes from 6 runs/day to 2 runs/day (8 AM and 6 PM).

### 2. Limit Requests Per Crawl (5 minutes)

Edit `src/features/scraping/scrapers/wg-gesucht-apify.ts`:

```typescript
// Line 359 - Change this:
maxRequestsPerCrawl: maxListings * 2,

// To this:
maxRequestsPerCrawl: 30,  // Limit to 30 pages max
```

### 3. Add Cost Tracking (10 minutes)

Create `src/features/scraping/utils/cost-tracker.ts`:

```typescript
import { ApifyClient } from 'apify-client';

export class ApifyCostTracker {
  private static COST_ALERT_THRESHOLD = 0.10; // $0.10 per run
  
  static async trackRun(runId: string, apifyClient: ApifyClient) {
    try {
      const run = await apifyClient.run(runId).get();
      const cost = run?.usageTotalUsd || 0;
      
      console.log(`💰 Run cost: $${cost.toFixed(4)}`);
      
      // Alert if expensive
      if (cost > this.COST_ALERT_THRESHOLD) {
        console.warn(`⚠️ HIGH COST RUN: $${cost.toFixed(4)}`);
        // TODO: Send email/Slack notification
      }
      
      // Log to database
      // await logCostToDatabase(runId, cost);
      
      return cost;
    } catch (error) {
      console.error('Error tracking cost:', error);
      return 0;
    }
  }
  
  static async getDailyCost(apifyClient: ApifyClient): Promise<number> {
    const runs = await apifyClient.runs().list({
      limit: 100,
      desc: true
    });
    
    const today = new Date().toDateString();
    const todayRuns = runs.items.filter(run => 
      new Date(run.startedAt).toDateString() === today
    );
    
    const totalCost = todayRuns.reduce((sum, run) => 
      sum + (run.usageTotalUsd || 0), 0
    );
    
    return totalCost;
  }
}
```

Update the scraper to use it (in `wg-gesucht-apify.ts` around line 369):

```typescript
// After the run completes
console.log(`✅ Apify run completed: ${run.id}`);

// Add cost tracking
const cost = await ApifyCostTracker.trackRun(run.id, this.apifyClient);
```

### 4. Implement Daily Limit (15 minutes)

Add to `src/features/scraping/services/automated-scraper.ts`:

```typescript
private async checkDailyBudget(): Promise<boolean> {
  const DAILY_BUDGET = 0.50; // $0.50 per day
  
  const dailyCost = await ApifyCostTracker.getDailyCost(this.apifyClient);
  
  if (dailyCost >= DAILY_BUDGET) {
    console.warn(`⚠️ Daily budget exceeded: $${dailyCost.toFixed(2)}/$${DAILY_BUDGET}`);
    return false;
  }
  
  console.log(`💰 Daily spend: $${dailyCost.toFixed(2)}/$${DAILY_BUDGET}`);
  return true;
}

// In runAutomatedScraping method, add at the beginning:
async runAutomatedScraping() {
  // Check budget first
  if (!await this.checkDailyBudget()) {
    console.log('🛑 Skipping run - daily budget exceeded');
    return;
  }
  
  // ... rest of the method
}
```

### 5. Quick Switch to Web Scraper (20 minutes)

For search pages only, create `src/features/scraping/scrapers/wg-gesucht-web-scraper.ts`:

```typescript
import { ApifyClient } from 'apify-client';

export class WGGesuchtWebScraper {
  private apifyClient: ApifyClient;
  
  constructor() {
    this.apifyClient = new ApifyClient({
      token: process.env.APIFY_TOKEN,
    });
  }
  
  async discoverListings(filters: any) {
    // Use lighter Web Scraper for search pages
    const run = await this.apifyClient.actor('apify/web-scraper').call({
      startUrls: [
        {
          url: `https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html?offer_filter=1&city_id=8&noDeact=1&sMin=${filters.minRent}&sMax=${filters.maxRent}`,
        }
      ],
      keepUrlFragments: false,
      linkSelector: 'a.detailansicht[href*=".html"]',
      pageFunction: async function pageFunction(context) {
        const { $, request } = context;
        
        // Extract listing URLs only
        const listings = [];
        $('a.detailansicht').each((i, el) => {
          const url = $(el).attr('href');
          if (url && !url.includes('housinganywhere')) {
            listings.push({
              url: url.startsWith('http') ? url : 'https://www.wg-gesucht.de' + url
            });
          }
        });
        
        return { listings: listings.slice(0, 20) }; // Limit to 20
      },
      maxRequestsPerCrawl: 5, // Only search pages
      maxConcurrency: 1,
    });
    
    const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
    const allListings = items.flatMap(item => item.listings || []);
    
    console.log(`Found ${allListings.length} listings to process`);
    return allListings;
  }
}
```

## 📊 Expected Results

After implementing these changes:

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Daily runs | 6 | 2 | 67% |
| Pages/run | 100-150 | 30 | 70% |
| Daily cost | ~$0.50 | ~$0.08 | 84% |
| Monthly cost | ~$15 | ~$2.40 | 84% |

## 🔍 Monitoring Commands

Create `check-apify-costs.ts`:

```typescript
#!/usr/bin/env npx tsx
import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkCosts() {
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  
  // Get user info
  const user = await client.user().get();
  console.log(`\n💰 Apify Account Status`);
  console.log(`Credits: $${user.credit || 0}`);
  console.log(`Monthly limit: $${user.limits?.monthlyUsageUsd || 5}`);
  
  // Calculate daily spending
  const runs = await client.runs().list({ limit: 50, desc: true });
  
  const dailyCosts = new Map();
  runs.items.forEach(run => {
    const date = new Date(run.startedAt).toDateString();
    const cost = run.usageTotalUsd || 0;
    dailyCosts.set(date, (dailyCosts.get(date) || 0) + cost);
  });
  
  console.log(`\n📊 Daily Costs (Last 7 days):`);
  Array.from(dailyCosts.entries())
    .slice(0, 7)
    .forEach(([date, cost]) => {
      console.log(`${date}: $${cost.toFixed(4)}`);
    });
  
  // Projection
  const avgDailyCost = Array.from(dailyCosts.values())
    .slice(0, 7)
    .reduce((a, b) => a + b, 0) / 7;
  
  console.log(`\n📈 Projections:`);
  console.log(`Average daily: $${avgDailyCost.toFixed(4)}`);
  console.log(`Monthly estimate: $${(avgDailyCost * 30).toFixed(2)}`);
}

checkCosts().catch(console.error);
```

Run with: `npm run tsx check-apify-costs.ts`

## ⚡ Next Steps

Once these are implemented:

1. **Monitor for 2-3 days** to see actual cost reduction
2. **Fine-tune limits** based on your needs
3. **Consider Phase 2** optimizations from the full analysis
4. **Set up alerts** if daily costs exceed budget

Remember: With these optimizations, your $5 free credits should last the entire month for 1-2 users!