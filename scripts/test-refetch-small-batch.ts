import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { WGGesuchtPuppeteerScraper } from '../src/features/scraping/scrapers/wg-gesucht-puppeteer';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRefetchSmallBatch() {
  console.log('🧪 Testing improved scraper on listings with 0 images...\n');
  
  try {
    // Get listings that currently have 0 images
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, url, title, images, platform')
      .eq('platform', 'wg_gesucht')
      .eq('images', '[]')
      .order('created_at', { ascending: false })
      .limit(3); // Just test 3 listings

    if (error || !listings || listings.length === 0) {
      console.log('📭 No listings with 0 images found');
      return;
    }

    console.log(`🎯 Found ${listings.length} listings with 0 images to test:`);
    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title?.substring(0, 60)}...`);
    });

    const scraper = new WGGesuchtPuppeteerScraper();
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`\n📸 Testing ${i + 1}/${listings.length}: ${listing.title?.substring(0, 50)}...`);
      console.log(`🔗 URL: ${listing.url}`);

      try {
        const images = await scraper.extractImagesFromUrl(listing.url);
        
        if (images.length > 0) {
          console.log(`✅ SUCCESS: Found ${images.length} images!`);
          console.log(`📸 Sample images:`);
          images.slice(0, 3).forEach((img, idx) => {
            const filename = img.split('/').pop()?.split('_').slice(-2).join('_').split('.')[0] || 'unknown';
            console.log(`   ${idx + 1}. ${filename}`);
          });
          
          // Update the listing
          const { error: updateError } = await supabase
            .from('listings')
            .update({ 
              images: images,
              updated_at: new Date().toISOString()
            })
            .eq('id', listing.id);

          if (updateError) {
            console.error(`❌ Failed to update listing: ${updateError.message}`);
          } else {
            console.log(`💾 Updated listing in database`);
          }
        } else {
          console.log(`⚠️  No images found`);
        }

        // Wait between requests
        if (i < listings.length - 1) {
          console.log('⏳ Waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`❌ Error processing listing: ${error}`);
      }
    }

    console.log('\n🏁 Test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRefetchSmallBatch();