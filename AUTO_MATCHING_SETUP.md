# Auto-Matching Setup for FlatApply Berlin

## Overview

The scraping system now automatically creates user matches whenever new listings are scraped. This means users will automatically see relevant apartments in their dashboard without manual intervention.

## How It Works

1. **Scraper finds new listings** → 
2. **Listings are saved to database** → 
3. **System checks all active user preferences** → 
4. **Calculates match scores** → 
5. **Creates matches for scores ≥ 60%** →
6. **Users see new matches in dashboard**

## Key Components

### 1. CLI-Compatible Save Function
- **File**: `src/features/scraping/save-listings-cli.ts`
- **Function**: `saveScrapedListingsWithMatches()`
- Handles both saving listings and creating matches
- Works from command line scripts

### 2. Scheduled Crawler with Matching
- **Script**: `run-scheduled-crawl-with-matches.ts`
- Runs on schedule (hourly, daily, etc.)
- Automatically creates matches for all users
- Extracts gallery images for new listings

### 3. Manual Run Script
- **Script**: `run-scraper-with-matches.ts`
- For one-time manual runs
- Same auto-matching functionality

## Setup Instructions

### 1. Environment Variables
Add to `.env.local`:
```bash
WG_GESUCHT_EMAIL=your_email@example.com
WG_GESUCHT_PASSWORD=your_password
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Run Manual Scraping
```bash
npx tsx run-scraper-with-matches.ts
```

### 3. Setup Scheduled Scraping
```bash
# Interactive setup
npx tsx run-scheduled-crawl-with-matches.ts

# Or use the cron setup script
./setup-auto-matching-cron.sh
```

### 4. Test Auto-Matching
```bash
npx tsx test-auto-matching.ts
```

## Match Score Calculation

Matches are created based on user preferences:

- **Price range**: Must be within user's budget
- **Room count**: Must match user's needs
- **Size**: Must meet minimum requirements
- **District**: Preferred neighborhoods get higher scores
- **Property type**: WG room, studio, or apartment

Only matches with **60% or higher** score are created.

## User Preferences

Users must set preferences at `/dashboard/preferences`:
- Min/Max rent
- Number of rooms
- Preferred districts
- Property types (WG, apartment, etc.)

## Monitoring

Check scraper logs:
```sql
SELECT * FROM scraper_logs 
WHERE scraper_type LIKE '%with_matches%'
ORDER BY created_at DESC;
```

Check recent matches:
```sql
SELECT COUNT(*) as match_count, 
       DATE(matched_at) as match_date
FROM user_matches
GROUP BY DATE(matched_at)
ORDER BY match_date DESC;
```

## Troubleshooting

### No matches created?
1. Check if users have active search preferences
2. Verify listings match user criteria
3. Ensure match score is ≥ 60%

### Missing images?
Run gallery extraction with stealth:
```bash
# Extract galleries for all listings missing proper images
npx tsx extract-missing-galleries.ts

# Or run the full gallery extraction with options
npx tsx automated-complete-gallery-extraction-v2.ts --missing-only

# Show browser while extracting
npx tsx automated-complete-gallery-extraction-v2.ts --missing-only --show-browser
```

### Check specific user matches
```bash
npx tsx check-user-matches.ts
```

## Benefits

1. **Automatic** - No manual matching needed
2. **Real-time** - Matches created immediately
3. **Personalized** - Based on user preferences
4. **Scalable** - Works for unlimited users
5. **Efficient** - Only relevant matches created

## Gallery Extraction Features

The automated gallery extraction now includes:
- **Puppeteer Stealth Plugin** - Avoids detection and CAPTCHAs
- **Cookie Support** - Uses saved cookies for faster access
- **Batch Processing** - Processes multiple listings in parallel
- **Smart Detection** - Only processes listings missing proper images
- **Multiple Formats** - Extracts `.sized.` and `.large.` images

## Next Steps

1. Set up scheduled crawling
2. Ensure users set their preferences
3. Monitor match creation
4. Adjust crawl frequency as needed
5. Run gallery extraction for missing images