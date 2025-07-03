import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';

async function testUrlGeneration() {
  const scraper = new WGGesuchtPuppeteerScraper();
  
  // Test different filter combinations
  const testCases = [
    {
      name: "Default 2+ room apartment",
      filters: {
        maxRent: 1500,
        minRooms: 1,
        maxRooms: 3,
        districts: ['mitte']
      }
    },
    {
      name: "1 room apartment",
      filters: {
        maxRent: 1000,
        maxRooms: 1,
        districts: ['kreuzberg']
      }
    },
    {
      name: "WG room (low rent)",
      filters: {
        maxRent: 700,
        districts: ['neukölln']
      }
    }
  ];
  
  console.log('Testing URL generation:\n');
  
  for (const testCase of testCases) {
    const url = scraper.buildSearchUrl(testCase.filters);
    console.log(`${testCase.name}:`);
    console.log(`  URL: ${url}`);
    console.log('');
  }
}

testUrlGeneration().catch(console.error);