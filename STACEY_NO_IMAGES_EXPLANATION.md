# Why Some STACEY Listings Have No Images

## The Issue

Some STACEY listings (like "STACEY Apartments Mitte | www.stacey.de") have no images because when the scraper tried to access them, WG-Gesucht showed a CAPTCHA/verification page instead of the actual listing.

## What Happens

1. **Initial Scrape**: The scraper finds the listing and saves basic info (title, price, URL)
2. **Gallery Extraction**: When trying to extract images, WG-Gesucht shows:
   - Page title: "Überprüfung" (Verification)
   - CAPTCHA challenge to verify you're not a bot
   - No access to actual listing content or images

## Why This Happens

WG-Gesucht has anti-bot protection that triggers when:
- Too many requests from same IP
- Automated behavior detected
- No valid session/cookies
- Accessing certain listings directly without browsing naturally

## Affected STACEY Listings

Out of 12 STACEY listings:
- **6 have images** ✅ (successfully extracted)
- **6 have no images** ❌ (blocked by CAPTCHA)

The ones without images:
1. `11521592` - STACEY Coliving Mitte
2. `11521597` - STACEY Coliving Mitte  
3. `11534847` - STACEY Coliving Mitte
4. `11534811` - STACEY Coliving Mitte
5. `11534820` - STACEY Coliving Mitte
6. `11534798` - STACEY Apartments Mitte

## Solutions

### 1. Manual CAPTCHA Resolution
Run the fix script that opens browser and allows manual CAPTCHA solving:
```bash
npx tsx fix-stacey-captcha-listings.ts
```

### 2. Use Login + Cookies
The scraper with login credentials is less likely to hit CAPTCHAs:
```bash
npx tsx run-scraper-with-matches.ts
```

### 3. Preventive Measures
- Use puppeteer-extra-plugin-stealth ✅ (already implemented)
- Save and reuse cookies ✅ (already implemented)
- Add delays between requests
- Use residential proxies (if available)
- Scrape during off-peak hours

## Current Status

The stealth plugin and cookie support have been added to reduce CAPTCHA occurrences, but some listings may still require manual intervention if they were already flagged by WG-Gesucht's system.

## Recommendation

1. Run `fix-stacey-captcha-listings.ts` to manually solve CAPTCHAs for these specific listings
2. Use the scheduled crawler with login for future scraping
3. These listings might also be inactive/deactivated - the fix script will check and mark them accordingly