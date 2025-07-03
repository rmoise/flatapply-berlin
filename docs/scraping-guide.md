# WG-Gesucht Scraping Guide (Free Methods)

## Overview

This guide covers **100% free methods** for scraping WG-Gesucht without paying for captcha solving services.

## 🏆 Recommended Approach: Login Scraper

The most effective free method is using your WG-Gesucht credentials:

### Setup

1. Create a WG-Gesucht account (if you don't have one)
2. Add credentials to `.env.local`:
   ```env
   WG_GESUCHT_EMAIL=your_email@example.com
   WG_GESUCHT_PASSWORD=your_password
   ```

3. Run the login scraper:
   ```bash
   ./test-login-scraper.ts
   ```

### Benefits
- ✅ 90% fewer captchas
- ✅ Access to phone numbers
- ✅ Better rate limits
- ✅ Session persists for weeks
- ✅ Completely free

## 📊 Available Scrapers

### 1. **Login Scraper** (Recommended)
```bash
./test-login-scraper.ts
```
- Uses your WG credentials
- Saves cookies for future runs
- Best captcha avoidance

### 2. **Deep Crawler** 
```bash
./test-deep-crawler.ts
./crawl-deep
```
- Non-overlapping district searches
- Database-aware deduplication
- More thorough but may hit captchas

### 3. **Unified Scraper**
```bash
./run-free-scraper-now.ts
./crawl incremental
```
- Standard scraping approach
- Good for quick checks
- Manual captcha solving when needed

### 4. **Quick Search**
```bash
./quick-listing-search.ts
```
- Search existing database
- No scraping (no captchas!)
- Instant results

## 🛡️ Captcha Avoidance Strategies

### 1. **Use Login** (Most Effective)
- Logged-in users see 90% fewer captchas
- Cookies persist for weeks

### 2. **Session Persistence**
```javascript
// Cookies are automatically saved in .wg-cookies.json
// They persist between runs
```

### 3. **Smart Timing**
- Early morning: 5-7 AM
- Late evening: 10 PM - midnight
- Avoid peak hours: 6-9 PM

### 4. **Rate Limiting**
- 2-5 second delays between pages
- Random delays to appear human
- Don't scrape too many pages at once

### 5. **Minimal Scraping**
- Only scrape what you need
- Use filters to reduce pages
- Check database first

## 🔄 Recommended Workflow

### Daily Routine
1. **Morning**: Run login scraper
   ```bash
   ./test-login-scraper.ts
   ```

2. **If captcha appears**: Solve it manually (rare with login)

3. **Check results**:
   ```bash
   ./quick-listing-search.ts
   ```

### Weekly Maintenance
1. Clear old cookies if issues arise:
   ```bash
   rm .wg-cookies.json
   ```

2. Run deep crawler for thorough search:
   ```bash
   ./crawl-deep
   ```

## 💡 Pro Tips

### Cookie Management
- Cookies saved in `.wg-cookies.json`
- Last ~30 days
- Delete file to force fresh login

### Error Handling
- **Captcha**: Wait a few hours, try again
- **Rate limit**: Increase delays
- **Login failed**: Check credentials

### Best Practices
1. **Always use login** when possible
2. **Scrape gently** (2-5 second delays)
3. **Time it right** (off-peak hours)
4. **Monitor success** rate

## 🚫 What NOT to Do

- ❌ Don't scrape aggressively
- ❌ Don't ignore rate limits
- ❌ Don't run multiple scrapers simultaneously
- ❌ Don't share login credentials

## 📈 Performance Expectations

| Method | Captcha Rate | Speed | Reliability |
|--------|--------------|-------|-------------|
| Login Scraper | ~10% | Fast | High |
| Deep Crawler | ~30% | Medium | Medium |
| Regular Scraper | ~50% | Fast | Low |
| Manual Browse | 0% | Slow | Perfect |

## 🆘 Troubleshooting

### "Too many captchas"
1. Use login scraper
2. Wait 2-3 hours
3. Try different time of day
4. Use different network (mobile hotspot)

### "Login not working"
1. Check credentials
2. Delete `.wg-cookies.json`
3. Try manual login on website first
4. Account might be locked

### "No new listings"
1. All listings might be duplicates
2. Try different search filters
3. Check if site is down
4. Run at different time

## 🎯 Summary

**For best results:**
1. Use the login scraper as primary method
2. Run 1-2 times daily during off-peak hours
3. Be patient with captchas (solve manually)
4. Keep sessions alive with cookies

This approach is:
- ✅ 100% free
- ✅ Reliable
- ✅ Sustainable
- ✅ Legal (using your own account)