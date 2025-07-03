# WG-Gesucht Crawler Guide

## Overview

The improved WG-Gesucht crawler system implements all recommended strategies for reliable listing extraction:

1. **Apify Integration** - Primary method for bypassing captchas
2. **Incremental Updates** - Focus on recent listings
3. **Semi-Automated Mode** - Manual captcha solving
4. **Scheduled Light Crawls** - Regular automated checks
5. **Unified Management** - Single interface for all modes

## Quick Start

### 1. Basic Commands

```bash
# Test configuration
./crawl test

# Run incremental crawl (recommended)
./crawl incremental

# Run light crawl (quick check)
./crawl light

# Run full crawl (comprehensive)
./crawl full

# Show statistics
./crawl stats
```

### 2. Specialized Scripts

```bash
# Incremental crawl with detailed output
./run-incremental-crawl.ts

# Semi-automated with captcha handling
./run-semi-automated-crawl.ts

# Scheduled crawls (interactive setup)
./run-scheduled-light-crawl.ts
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Recommended
APIFY_TOKEN=your_apify_token  # Get from https://apify.com

# Optional (for scheduled crawls)
CRAWL_SCHEDULE="0 */2 * * *"  # Cron expression
```

### Apify Setup

1. Sign up at [https://apify.com](https://apify.com) (free tier available)
2. Get your API token from Account → Integrations
3. Add `APIFY_TOKEN` to `.env.local`

Benefits:
- ✅ No captcha issues
- ✅ Residential proxies
- ✅ 99%+ success rate
- ✅ Scalable
- 💰 ~$0.01 per page crawled

## Crawl Strategies

### 1. Incremental Crawl (Recommended)

Best for regular updates. Focuses on popular price ranges and recent listings.

```bash
./crawl incremental --limit 50
```

- Runs every 1-2 hours
- Targets active price ranges (€300-€1500)
- Stops early when enough new listings found
- Low resource usage

### 2. Light Crawl

Quick check for new listings in the most popular range.

```bash
./crawl light
```

- Takes ~1-2 minutes
- Checks €400-€800, 1-2 rooms
- Good for testing
- Minimal server load

### 3. Full Crawl

Comprehensive search across all price/room combinations.

```bash
./crawl full --apify  # Force Apify
./crawl full --regular # Force regular scraper
```

- Run once per day maximum
- Covers all price ranges (€200-€2000)
- All room types (WG, Studio, 2+)
- Higher chance of captchas

### 4. Semi-Automated Crawl

For when captchas are blocking automated access.

```bash
./run-semi-automated-crawl.ts
```

Features:
- Opens browser window when captcha detected
- You solve captcha manually
- Saves cookies for subsequent requests
- Continues crawling automatically

### 5. Scheduled Crawls

Set up automatic recurring crawls.

```bash
./run-scheduled-light-crawl.ts
```

Options:
1. Every 30 minutes (testing)
2. Every hour
3. Every 2 hours (recommended)
4. Every 4 hours
5. Run once now

For production, use environment variable:
```bash
CRAWL_SCHEDULE="0 */2 * * *" ./run-scheduled-light-crawl.ts
```

## Architecture

### Crawler Manager

Central class that coordinates all crawling strategies:

```typescript
new CrawlerManager(supabaseUrl, supabaseKey, {
  useApify: true,              // Use Apify if available
  incrementalMode: true,       // Focus on recent listings
  maxListingsPerRun: 100,      // Limit per run
  priceRanges: [...],          // Price segments
  roomRanges: [...],           // Room categories
  rateLimitMs: 3000,           // Delay between requests
  captchaCallback: async () => {} // Captcha handler
});
```

### Event System

The crawler emits events for real-time monitoring:

```typescript
crawler.on('listing:saved', (listing) => {
  console.log(`New: ${listing.title} (€${listing.price})`);
});
```

### Statistics Tracking

All runs are logged to database with:
- Start/end times
- Listings found/saved
- Duplicates skipped
- Errors encountered
- Captchas solved
- Method used (apify/regular)

## Best Practices

### 1. Optimal Schedule

- **Incremental**: Every 1-2 hours during day
- **Light**: Every 30 mins during peak hours (18:00-22:00)
- **Full**: Once at night (3:00 AM)

### 2. Handling Captchas

If regular scraper hits captchas:
1. Try Apify first (recommended)
2. Use semi-automated mode
3. Increase rate limits
4. Reduce listings per run

### 3. Monitoring

Check performance regularly:
```bash
./crawl stats
./check-crawler-stats.ts
```

### 4. Error Recovery

The crawler automatically:
- Retries failed requests
- Continues after errors
- Logs all issues
- Falls back from Apify to regular

## Troubleshooting

### No New Listings Found

1. Check if captchas are blocking:
   - Look for "Captcha detected" in logs
   - Try semi-automated mode

2. Verify search parameters:
   - Price ranges might be too narrow
   - Try broader search

3. Check WG-Gesucht status:
   ```bash
   curl -I https://www.wg-gesucht.de
   ```

### Apify Not Working

1. Verify token:
   ```bash
   ./crawl test
   ```

2. Check Apify dashboard for:
   - Credit balance
   - API token validity
   - Run logs

### High Duplicate Rate

This is normal. WG-Gesucht shows same listings in multiple searches.
The crawler automatically deduplicates using database checks.

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start scheduled crawler
pm2 start ecosystem.config.js

# Monitor
pm2 logs crawler
pm2 monit
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'crawler',
    script: './run-scheduled-light-crawl.ts',
    env: {
      CRAWL_SCHEDULE: '0 */2 * * *',
      NODE_ENV: 'production'
    },
    error_file: 'logs/crawler-error.log',
    out_file: 'logs/crawler-out.log',
    time: true
  }]
};
```

### Using systemd

Create `/etc/systemd/system/wg-crawler.service`:

```ini
[Unit]
Description=WG-Gesucht Crawler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/flatapply-berlin
ExecStart=/usr/bin/node ./run-scheduled-light-crawl.ts
Restart=on-failure
Environment="CRAWL_SCHEDULE=0 */2 * * *"

[Install]
WantedBy=multi-user.target
```

## Costs

### Regular Scraper
- ✅ Free
- ❌ Captchas block access
- ⚠️ Limited success rate

### Apify Scraper
- 💰 ~$0.01 per page
- ✅ 99%+ success rate
- ✅ No captchas
- 📊 Estimate: ~$5-10/month for regular use

### Cost Optimization
1. Use incremental mode
2. Limit max listings per run
3. Schedule during off-peak hours
4. Monitor duplicate rates

## Future Improvements

1. **Multi-Platform Support**
   - Add Immobilienscout24
   - Add Kleinanzeigen
   - Unified listing format

2. **Smart Scheduling**
   - Adjust frequency based on activity
   - Peak hour optimization
   - Predictive crawling

3. **Enhanced Deduplication**
   - Fuzzy matching for similar listings
   - Image comparison
   - Price change tracking

4. **User Notifications**
   - Real-time alerts
   - Daily summaries
   - Match quality improvements