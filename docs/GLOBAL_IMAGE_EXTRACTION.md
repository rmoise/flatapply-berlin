# Global Image Extraction Strategy

## Overview
This document outlines how to apply image extraction at scale for all apartment listings.

## Current Solution

### 1. Image Extraction During Scraping
The WG-Gesucht scraper already extracts images properly during the scraping process:
- Extracts from SmartPhoto gallery
- Extracts from img tags with data-large attributes
- Extracts from JavaScript arrays in script tags
- Properly formats URLs with https://

### 2. Image Display
Images are displayed using standard HTML img tags:
```jsx
<img
  src={listing.images[0]}
  alt={listing.title}
  className="absolute inset-0 w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-apartment.svg';
  }}
/>
```

## Scaling to All Listings

### 1. Batch Image Update Script
For existing listings without images:

```typescript
// scripts/update-all-listing-images.ts
import { GlobalImageExtractor } from '../src/features/scraping/scrapers/global-image-extractor';

// Process listings in batches of 5-10
// Use rate limiting between batches
// Update database with extracted images
```

### 2. Scheduled Jobs
Set up cron jobs to:
- Check for listings without images every hour
- Re-extract images for listings older than 30 days
- Clean up broken image URLs

### 3. Platform-Specific Extractors
Each platform needs its own extraction logic:
- **WG-Gesucht**: SmartPhoto gallery navigation
- **ImmoScout24**: Standard image gallery
- **Kleinanzeigen**: Carousel navigation
- **Immowelt/Immonet**: Similar gallery structures

### 4. Image Validation
Before saving to database:
- Ensure URLs start with https://
- Filter out thumbnails and small images
- Limit to 20 images per listing
- Validate image accessibility

### 5. Performance Optimization
- Use headless browser only when necessary
- Cache browser instances for batch processing
- Implement parallel processing with worker threads
- Use CDN for serving images if needed

## Implementation Steps

1. **Immediate**: Fix current listings
   ```bash
   node scripts/update-all-listing-images.ts
   ```

2. **Short-term**: Enhance scrapers
   - Ensure all scrapers extract images during initial scrape
   - Add retry logic for failed image extractions

3. **Long-term**: Infrastructure
   - Set up image proxy/CDN if needed
   - Implement image optimization pipeline
   - Add monitoring for broken images

## Monitoring

Track these metrics:
- Listings with 0 images
- Average images per listing
- Image load success rate
- Image extraction success rate

## Error Handling

Common issues and solutions:
1. **403 Forbidden**: Images require authentication
   - Solution: Extract during scraping with authenticated session

2. **CORS issues**: Cross-origin restrictions
   - Solution: Use standard img tags instead of Next.js Image

3. **Rate limiting**: Too many requests
   - Solution: Implement delays and batch processing

4. **Dynamic loading**: Images load via JavaScript
   - Solution: Use Puppeteer/Playwright to wait for gallery

## Testing

Before deploying:
1. Test on sample of 10 listings
2. Verify images display correctly
3. Check error fallbacks work
4. Monitor performance impact