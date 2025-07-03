# Description Handling in FlatApply Berlin

## Overview
Descriptions are exclusively handled by the dedicated description scraper (`04-extract-description.ts`) to ensure consistency and avoid conflicts.

## Current Implementation

### 1. Initial Crawlers
- **WGGesuchtLoginScraper** (`wg-gesucht-with-login.ts`): Sets `description: ''` (empty string)
- **run-scheduled-crawl.ts**: Skips description field when saving listings
- **CrawlerManager** (`crawler-manager.ts`): Skips description field when inserting listings

### 2. Detail Extractor
- **DetailExtractorService** (`detail-extractor.ts`): 
  - Does NOT extract descriptions from pages
  - Does NOT update description field in database
  - Focuses only on: rooms, costs, size, dates, contact info

### 3. Dedicated Description Scraper
- **04-extract-description.ts**: The ONLY component that extracts and saves descriptions
- Runs as part of the extraction pipeline after new listings are saved
- Uses specialized logic to extract full, clean descriptions

## Extraction Pipeline Order
1. **Crawl** - Find new listings (no description)
2. **Save** - Store basic listing info in database
3. **Extract Images** - Get gallery images
4. **Extract Descriptions** - Get full descriptions (ONLY HERE)
5. **Extract Details** - Get rooms, costs, dates, etc. (no description)

## Key Points
- Descriptions are NEVER extracted during initial crawling
- Descriptions are NEVER updated by the detail extractor
- Descriptions are ONLY handled by the dedicated description scraper
- This prevents conflicts and ensures high-quality description extraction