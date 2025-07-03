"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wg_gesucht_playwright_1 = require("./src/features/scraping/scrapers/wg-gesucht-playwright");
const dotenv_1 = require("dotenv");
dotenv_1.default.config({ path: '.env.local' });
async function runPlaywrightScraper() {
    console.log('🎭 Starting Playwright-based WG-Gesucht scraper...\n');
    // Configure proxy if environment variables are set
    const proxyConfig = {
        // Example proxy configurations:
        // For Bright Data: server: 'http://brd.superproxy.io:22225'
        // For ScraperAPI: server: 'http://scraperapi.country-de.proxymesh.com:31280'
        // For SmartProxy: server: 'http://gate.smartproxy.com:10000'
        server: process.env.PROXY_SERVER, // e.g., 'http://proxy.example.com:8080'
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
    };
    // Only use proxy if server is configured
    const scraper = new wg_gesucht_playwright_1.WGGesuchtPlaywrightScraper(proxyConfig.server ? proxyConfig : undefined);
    try {
        // Set a test limit if needed
        if (process.argv.includes('--test')) {
            process.env.TEST_LIMIT = '3';
            console.log('🧪 Running in test mode (3 listings)...\n');
        }
        const result = await scraper.scrape();
        if (result.success) {
            console.log('\n🎉 Scraping completed successfully!');
            console.log(`Total listings scraped: ${result.listings.length}`);
            // Show sample data
            if (result.listings.length > 0) {
                console.log('\n📋 Sample listing:');
                const sample = result.listings[0];
                console.log(`Title: ${sample.title}`);
                console.log(`Price: €${sample.price}`);
                console.log(`Size: ${sample.size}m²`);
                console.log(`District: ${sample.district}`);
                console.log(`Images: ${sample.images.length}`);
                console.log(`Description: ${sample.description.substring(0, 100)}...`);
            }
        }
        else {
            console.error('\n❌ Scraping failed');
        }
    }
    catch (error) {
        console.error('Fatal error:', error);
    }
}
// Add proxy setup instructions
if (process.argv.includes('--help')) {
    console.log(`
🎭 WG-Gesucht Playwright Scraper

Usage:
  npx tsx run-playwright-scraper.ts [options]

Options:
  --test    Run in test mode (scrapes only 3 listings)
  --help    Show this help message

Proxy Configuration:
  Set these environment variables in .env.local:
  
  PROXY_SERVER=http://your-proxy-server:port
  PROXY_USERNAME=your-username
  PROXY_PASSWORD=your-password

Recommended Proxy Services:
  1. Bright Data (formerly Luminati)
     - Residential proxies with German IPs
     - PROXY_SERVER=http://brd.superproxy.io:22225
     
  2. ScraperAPI
     - Managed proxy rotation
     - PROXY_SERVER=http://scraperapi.country-de.proxymesh.com:31280
     
  3. SmartProxy
     - Residential & datacenter options
     - PROXY_SERVER=http://gate.smartproxy.com:10000

  4. Oxylabs
     - Premium residential proxies
     - PROXY_SERVER=http://pr.oxylabs.io:7777

Example with Bright Data:
  PROXY_SERVER=http://brd.superproxy.io:22225
  PROXY_USERNAME=your-bright-data-username
  PROXY_PASSWORD=your-bright-data-password
  `);
}
else {
    runPlaywrightScraper().catch(console.error);
}
