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

async function refetchZeroImageListings() {
  console.log('🔄 Refetching images for listings with 0 images...\n');
  
  try {
    // Get all listings that currently have 0 images
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, url, title, images, platform')
      .eq('platform', 'wg_gesucht')
      .eq('images', '[]')
      .order('created_at', { ascending: false })
      .limit(20); // Process in reasonable batches

    if (error || !listings || listings.length === 0) {
      console.log('📭 No listings with 0 images found');
      return;
    }

    console.log(`🎯 Found ${listings.length} listings with 0 images to refetch:`);
    
    const scraper = new WGGesuchtPuppeteerScraper();
    let successCount = 0;
    let totalImages = 0;
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`\n📸 Processing ${i + 1}/${listings.length}: ${listing.title?.substring(0, 50)}...`);

      try {
        const images = await scraper.extractImagesFromUrl(listing.url);
        
        if (images.length > 0) {
          successCount++;
          totalImages += images.length;
          console.log(`✅ Found ${images.length} images`);
          
          // Update the listing
          const { error: updateError } = await supabase
            .from('listings')
            .update({ 
              images: images,
              updated_at: new Date().toISOString()
            })
            .eq('id', listing.id);

          if (updateError) {
            console.error(`❌ Failed to update: ${updateError.message}`);
          } else {
            console.log(`💾 Updated successfully`);
          }
        } else {
          console.log(`⚠️  No images found`);
        }

        // Wait between requests to be respectful
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Error: ${error}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 REFETCH SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total processed: ${listings.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${listings.length - successCount}`);
    console.log(`📸 Total images found: ${totalImages}`);
    console.log(`📈 Average per success: ${successCount > 0 ? (totalImages / successCount).toFixed(1) : 0} images`);
    console.log(`🎯 Success rate: ${((successCount / listings.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

refetchZeroImageListings();