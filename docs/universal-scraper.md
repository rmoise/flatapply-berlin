# Universal Rental Platform Scraper

## Overview

The Universal Scraper is a platform-agnostic system designed to efficiently scrape multiple rental websites while minimizing CAPTCHAs and maximizing data extraction success.

## Key Features

- **Multi-Platform Support**: Easy to add new rental platforms
- **Unified Architecture**: Shared browser pool, queue, and matching engine
- **Smart Resource Management**: Reuses authenticated sessions, limits concurrent requests
- **Automatic User Matching**: Creates matches immediately when new listings are found
- **Single-Pass Extraction**: Gets all data (description, images, contact) in one visit
- **CAPTCHA Avoidance**: Uses stealth techniques and session persistence
- **Self-Healing**: Automatic retries, error recovery, and health monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
│  Coordinates all scraping activities across platforms       │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
    ┌─────────────▼─────────────┐ ┌──────────▼──────────────┐
    │    Platform Registry       │ │    Browser Pool         │
    │  Manages scraper plugins   │ │  Shared browser sessions│
    └─────────────┬─────────────┘ └──────────┬──────────────┘
                  │                           │
    ┌─────────────▼─────────────┐ ┌──────────▼──────────────┐
    │   Scraping Queue          │ │    Match Engine         │
    │  Smart prioritization     │ │  User preference matching│
    └───────────────────────────┘ └─────────────────────────┘
```

## Setup

### 1. Environment Variables

Add to `.env.local`:
```bash
# Scraper Configuration
SCRAPER_MODE=full              # full | discovery | update
SCRAPER_PLATFORMS=wg_gesucht   # Comma-separated list
SCRAPER_MAX_RUNTIME=3600       # Max seconds per run
HEADLESS=true                  # Run browsers headlessly

# WG-Gesucht Credentials (optional but recommended)
WG_GESUCHT_EMAIL=your-email@example.com
WG_GESUCHT_PASSWORD=your-password
```

### 2. Database Migration

Run the migration to create the scraping queue table:
```bash
supabase db push
```

### 3. Install Dependencies

```bash
npm install playwright puppeteer-extra puppeteer-extra-plugin-stealth
```

### 4. Set Up Cron Job

```bash
./setup-unified-cron.sh
```

Choose your preferred schedule:
- Every 15 minutes (aggressive)
- Every 30 minutes (recommended)
- Every hour (conservative)

## Usage

### Manual Run

```bash
# Full mode (discovery + update)
npx tsx run-unified-scraper.ts

# Discovery only (find new listings)
SCRAPER_MODE=discovery npx tsx run-unified-scraper.ts

# Update only (process existing queue)
SCRAPER_MODE=update npx tsx run-unified-scraper.ts
```

### Monitoring

```bash
# Watch logs
tail -f logs/unified-scraper.log

# Check queue status
npx tsx src/features/scraping/core/queue-status.ts

# Monitor health
npx tsx src/features/scraping/core/health-check.ts
```

## Adding New Platforms

### 1. Create Platform Scraper

Create `src/features/scraping/platforms/[platform-name]-unified.ts`:

```typescript
import { BasePlatformScraper } from '../core/base-scraper';

export class NewPlatformScraper extends BasePlatformScraper {
  readonly platform = 'new_platform';
  readonly baseUrl = 'https://example.com';
  
  // Implement required methods
  async parseListingUrl(url: string) { /* ... */ }
  async buildSearchUrl(filters: SearchFilters) { /* ... */ }
  async extractListingsFromSearchPage(page: Page) { /* ... */ }
  async extractDetailPageData(page: Page) { /* ... */ }
  async handlePlatformSpecificAuth(page: Page) { /* ... */ }
  async detectCaptcha(page: Page) { /* ... */ }
  
  // Convert to universal format
  toUniversalListing(data: any): UniversalListing { /* ... */ }
}
```

### 2. Register Platform

In `run-unified-scraper.ts`:

```typescript
import NewPlatformScraper from './src/features/scraping/platforms/new-platform-unified';

// In registerPlatforms()
if (config.platforms.includes('new_platform')) {
  const scraper = new NewPlatformScraper(config.supabaseUrl, config.supabaseKey);
  platformRegistry.register(scraper, platformConfig);
}
```

### 3. Add Configuration

Update `config/platforms.json`:

```json
{
  "new_platform": {
    "enabled": true,
    "maxRequestsPerHour": 100,
    "priority": "medium",
    // ... other config
  }
}
```

## Performance Optimization

### Browser Pool Settings

```typescript
browserPool.configure({
  maxBrowsersPerPlatform: 2,    // Max browsers per platform
  maxPagesPerBrowser: 5,         // Max concurrent pages
  sessionTimeout: 30 * 60 * 1000 // 30 minutes idle timeout
});
```

### Queue Prioritization

The queue automatically prioritizes:
1. New listings (score: 1000)
2. Incomplete data (score: 500)  
3. Platform-specific boost (configurable)
4. Age-based priority

### Rate Limiting

Each platform has configurable rate limits:
- `requestDelay`: Base delay between requests
- `errorBackoff`: Additional delay after errors
- `maxRetries`: Maximum retry attempts

## Troubleshooting

### High CAPTCHA Rate

1. Enable authentication for platforms that support it
2. Increase delays between requests
3. Reduce concurrent pages
4. Use residential proxies if needed

### Low Success Rate

1. Update selectors in platform scraper
2. Check for website changes
3. Increase timeout values
4. Review error logs for patterns

### Memory Issues

1. Reduce max browsers/pages
2. Enable cleanup intervals
3. Set lower session timeouts
4. Monitor with `htop` during runs

## Monitoring & Alerts

The system emits events for monitoring:

```typescript
orchestrator.on('healthWarning', (warning) => {
  // Send alert (email, Slack, etc.)
});

orchestrator.on('updateCompleted', (stats) => {
  // Log metrics
});
```

## Database Schema

Key tables:
- `listings`: Standardized listing data
- `scraping_queue`: Items to process
- `user_matches`: Listing-user matches
- `scraper_logs`: Run history and metrics

## Best Practices

1. **Start Conservative**: Begin with fewer pages and increase gradually
2. **Monitor Success Rates**: Adjust delays if rates drop
3. **Use Authentication**: Reduces CAPTCHAs significantly
4. **Regular Maintenance**: Update selectors as websites change
5. **Resource Limits**: Set appropriate max runtime values

## Future Enhancements

- [ ] Proxy rotation support
- [ ] Machine learning for CAPTCHA prediction
- [ ] API integration for supported platforms
- [ ] Webhook notifications
- [ ] GraphQL API for real-time updates
- [ ] Kubernetes deployment config