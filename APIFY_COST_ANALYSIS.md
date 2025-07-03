# Apify Cost Analysis for FlatApply Berlin

## Executive Summary

Based on the analysis of your Apify usage and scraping patterns, here's a comprehensive breakdown of expected monthly costs and recommendations for cost optimization.

## Current Setup Analysis

### 1. Scraping Configuration
- **Actor Used**: Puppeteer Scraper (`apify/puppeteer-scraper`)
- **Max Requests Per Crawl**: `maxListings * 2` (listing pages + detail pages)
- **Concurrent Requests**: 3
- **Scheduled Runs**: Every 4 hours (6 times daily via Vercel cron)
- **Target Users**: All users with notification preferences enabled
- **Listings Per User**: Up to 50 listings per run
- **Search URLs**: 3 different search categories per run

### 2. Cost Breakdown

#### Puppeteer Scraper Pricing (current setup)
- **Compute Units**: $0.25 per 1,000 CUs
- **Proxy**: $1.00 per GB (if residential proxy used)
- **Storage**: $0.01 per GB/day

#### Estimated Usage Per Run
- **Pages crawled**: ~100-150 (3 search pages + up to 50 detail pages)
- **Average run time**: 60-90 seconds
- **Compute Units**: ~200-300 CUs per run
- **Data transfer**: ~50-100 MB per run

### 3. Monthly Cost Scenarios

#### Scenario 1: Light Usage (1 user, manual runs)
- **Runs per month**: 30 (once daily)
- **Pages per run**: 50
- **Monthly CUs**: 6,000-9,000
- **Estimated cost**: $1.50 - $2.25/month

#### Scenario 2: Current Setup (automated, 1 user)
- **Runs per month**: 180 (6x daily)
- **Pages per run**: 100
- **Monthly CUs**: 36,000-54,000
- **Estimated cost**: $9.00 - $13.50/month

#### Scenario 3: Production (10 users, automated)
- **Runs per month**: 180
- **Pages per run**: 500 (50 listings x 10 users)
- **Monthly CUs**: 180,000-270,000
- **Estimated cost**: $45.00 - $67.50/month

#### Scenario 4: Scale (50 users, automated)
- **Runs per month**: 180
- **Pages per run**: 2,500
- **Monthly CUs**: 900,000-1,350,000
- **Estimated cost**: $225.00 - $337.50/month

## Cost Comparison: Puppeteer vs Web Scraper

### Web Scraper Actor (`apify/web-scraper`)
- More lightweight, JavaScript-only execution
- ~50% less compute units for similar tasks
- Limited functionality for dynamic content

### Cost Comparison Table
| Users | Puppeteer Scraper | Web Scraper | Savings |
|-------|-------------------|-------------|---------|
| 1     | $9-14/month      | $5-7/month  | 44%     |
| 10    | $45-68/month     | $25-35/month| 48%     |
| 50    | $225-338/month   | $125-175/month| 48%   |

## Cost-Saving Recommendations

### 1. Immediate Optimizations (50-70% savings)

#### A. Reduce Scraping Frequency
```javascript
// Change from every 4 hours to every 8 hours
// vercel.json
{
  "crons": [{
    "path": "/api/cron/scraper",
    "schedule": "0 */8 * * *"  // Was: "0 */4 * * *"
  }]
}
```
**Savings**: 50% reduction in costs

#### B. Implement Smart Scheduling
```javascript
// Peak hours only (morning and evening)
{
  "crons": [
    {
      "path": "/api/cron/scraper",
      "schedule": "0 8,18 * * *"  // 8 AM and 6 PM only
    }
  ]
}
```
**Savings**: 67% reduction (2 runs vs 6 runs daily)

#### C. Limit Pages Per Run
```javascript
// In wg-gesucht-apify.ts
maxRequestsPerCrawl: 50,  // Was: maxListings * 2
```
**Savings**: 30-50% reduction in compute units

### 2. Architectural Changes (70-90% savings)

#### A. Hybrid Approach
Combine Apify with local scraping:
- Use Apify only for new listing discovery (search pages)
- Use local Puppeteer/Playwright for detail extraction
- Store and reuse session cookies

```javascript
// Hybrid scraper example
class HybridScraper {
  async discoverListings() {
    // Use Apify for search pages only
    const searchResults = await apifyClient.actor('apify/web-scraper').call({
      startUrls: [/* search URLs */],
      maxRequestsPerCrawl: 10,  // Only search pages
      // Extract only URLs
    });
    
    // Use local scraper for details
    const details = await this.scrapeDetailsLocally(searchResults.urls);
    return details;
  }
}
```
**Savings**: 80-90% reduction

#### B. Incremental Updates
Only scrape new listings:
```javascript
// Track last seen listing IDs
const lastSeenIds = await getLastSeenListingIds();
const newListingsOnly = listings.filter(l => !lastSeenIds.includes(l.id));
```
**Savings**: 60-80% after initial scrape

#### C. User-Triggered Scraping
Move from scheduled to on-demand:
```javascript
// Add manual refresh button in UI
// Limit to X refreshes per user per day
const dailyLimit = 3;
const userRefreshCount = await getUserRefreshCount(userId, today);
if (userRefreshCount >= dailyLimit) {
  throw new Error('Daily refresh limit reached');
}
```
**Savings**: 90%+ reduction

### 3. Alternative Solutions

#### A. Switch to Web Scraper Actor
For basic needs, the lighter Web Scraper actor is sufficient:
```javascript
const run = await apifyClient.actor('apify/web-scraper').call({
  startUrls: [/* ... */],
  pseudoUrls: [/* ... */],
  pageFunction: /* simpler extraction logic */
});
```
**Savings**: 40-50% reduction

#### B. Self-Hosted Solution
Run your own scraping infrastructure:
- **Pros**: No per-request costs, full control
- **Cons**: Maintenance, proxy costs, scaling challenges
- **Monthly cost**: $5-50 for VPS + $30-100 for proxies

#### C. Free Tier Optimization
Maximize the $5 free monthly credits:
- Limit to 20 scrapes/month
- Focus on high-value listings only
- Use for individual user requests only

## Recommended Implementation Plan

### Phase 1: Quick Wins (This Week)
1. Reduce cron frequency to 2x daily: **Save 67%**
2. Limit requests to 50 per run: **Save 30%**
3. Switch to Web Scraper for simple pages: **Save 40%**
**Total savings: ~80%**

### Phase 2: Optimization (Next 2 Weeks)
1. Implement incremental updates
2. Add user-triggered refresh with limits
3. Cache and reuse data where possible
**Additional savings: 50-70%**

### Phase 3: Long-term (Next Month)
1. Evaluate self-hosted solution
2. Consider hybrid Apify + local approach
3. Implement smart scheduling based on listing patterns
**Potential to reduce costs to <$10/month for 10 users**

## Monthly Cost Projections

### With Optimizations Applied

| Users | Current Cost | Phase 1 | Phase 2 | Phase 3 |
|-------|-------------|---------|---------|---------|
| 1     | $14/mo      | $3/mo   | $1/mo   | <$1/mo  |
| 10    | $68/mo      | $14/mo  | $7/mo   | $5/mo   |
| 50    | $338/mo     | $68/mo  | $34/mo  | $25/mo  |

## Monitoring and Alerts

### Set Up Cost Monitoring
```javascript
// Add to your scraper
const run = await apifyClient.actor('...').call({...});
const cost = run.usageTotalUsd;

// Alert if cost exceeds threshold
if (cost > 0.10) {  // $0.10 per run
  await sendAlert(`High cost run: $${cost}`);
}

// Track daily spending
await trackDailySpending(cost);
```

### Usage Dashboard
Create a simple dashboard to track:
- Daily/weekly/monthly costs
- Cost per user
- Cost per listing
- Efficiency metrics (listings found per dollar)

## Conclusion

Your current setup would cost approximately **$9-14/month for 1 user** or **$45-68/month for 10 users** with automated scraping every 4 hours.

**Immediate action**: Implement Phase 1 optimizations to reduce costs by 80%, bringing it down to **$3/month for 1 user** or **$14/month for 10 users**.

For sustainable scaling, consider the hybrid approach (Apify for discovery + local scraping for details) which can handle 50+ users for under $25/month.

Remember: The Free Plan's $5/month can cover basic needs for 1-2 users with optimized settings!