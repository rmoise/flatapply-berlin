#!/usr/bin/env npx tsx
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function optimizeApifyCosts() {
  console.log('💰 Apify Cost Optimization Guide\n');
  console.log('='.repeat(60) + '\n');
  
  // Show current vs optimized costs
  console.log('📊 Cost Comparison:\n');
  console.log('Current Setup (Expensive):');
  console.log('  - Runs: 6x daily (every 4 hours)');
  console.log('  - Pages: 100-150 per run');
  console.log('  - Actor: Puppeteer Scraper');
  console.log('  - Cost: ~$45-68/month\n');
  
  console.log('Optimized Setup (Recommended):');
  console.log('  - Runs: 2x daily (morning & evening)');
  console.log('  - Pages: 30 per run (new listings only)');
  console.log('  - Actor: Web Scraper');
  console.log('  - Cost: ~$2-3/month\n');
  
  console.log('🔧 Quick Optimizations:\n');
  
  console.log('1. Update scheduled crawls (in crawler-manager.ts):');
  console.log(`
  // Change from every 4 hours to twice daily
  scheduleJobs() {
    // Morning crawl at 8 AM
    cron.schedule('0 8 * * *', () => this.crawl('incremental'));
    
    // Evening crawl at 6 PM  
    cron.schedule('0 18 * * *', () => this.crawl('incremental'));
  }
  `);
  
  console.log('\n2. Limit pages per run:');
  console.log(`
  // In wg-gesucht-apify.ts
  maxRequestsPerCrawl: 30,  // Down from 100
  maxConcurrency: 2,        // Down from 5
  `);
  
  console.log('\n3. Add cost tracking:');
  console.log(`
  // Track costs in database
  await supabase.from('scraper_logs').insert({
    estimated_cost: runCost,
    pages_scraped: pagesCount,
    actor_used: 'web-scraper'
  });
  `);
  
  console.log('\n4. Set daily budget:');
  console.log(`
  // Check daily spend before running
  const dailySpend = await getDailyApifySpend();
  if (dailySpend > 0.50) {
    console.log('Daily budget exceeded, skipping run');
    return;
  }
  `);
  
  console.log('\n5. Use cheaper Web Scraper for search pages:');
  console.log(`
  // Only use Puppeteer for detail pages if needed
  const actor = isDetailPage ? 'puppeteer-scraper' : 'web-scraper';
  `);
  
  console.log('\n💡 Additional Savings:\n');
  console.log('• User-triggered scraping instead of scheduled');
  console.log('• Cache results for 24 hours');
  console.log('• Only scrape when users are active');
  console.log('• Bulk operations for multiple users\n');
  
  console.log('📈 Monthly Cost Projections:\n');
  console.log('Users | Current  | Optimized');
  console.log('------|----------|----------');
  console.log('1     | $9-14    | $2-3');
  console.log('5     | $45-68   | $10-15');
  console.log('10    | $90-135  | $20-30');
  console.log('50+   | Consider self-hosted\n');
  
  console.log('🚀 Next Steps:');
  console.log('1. Add $10 credits to test optimizations');
  console.log('2. Switch to Web Scraper actor');
  console.log('3. Implement daily budget limits');
  console.log('4. Monitor costs daily\n');
  
  console.log('Your $5/month free credits can cover 1-2 users with optimizations!');
}

optimizeApifyCosts().catch(console.error);