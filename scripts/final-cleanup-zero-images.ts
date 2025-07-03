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

async function finalCleanupZeroImages() {
  console.log('🧹 Final cleanup: Finding listings with 0 images and updating them...\n');
  
  try {
    // Get all recent listings that have 0 images
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, url, title, images, platform, created_at')
      .eq('platform', 'wg_gesucht')
      .eq('images', '[]')
      .order('created_at', { ascending: false })
      .limit(10); // Process 10 at a time to avoid overwhelming

    if (error || !listings || listings.length === 0) {
      console.log('✅ No listings with 0 images found - cleanup complete!');
      return;
    }

    console.log(`🎯 Found ${listings.length} listings with 0 images to update:`);
    listings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title?.substring(0, 60)}...`);
    });

    const scraper = new WGGesuchtPuppeteerScraper();
    let successCount = 0;
    let totalNewImages = 0;
    
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`\n📸 Processing ${i + 1}/${listings.length}: ${listing.title?.substring(0, 50)}...`);

      try {
        const images = await scraper.extractImagesFromUrl(listing.url);
        
        if (images.length > 0) {
          successCount++;
          totalNewImages += images.length;
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
          console.log(`⚠️  No images found (listing may be expired or have no gallery)`);
        }

        // Add delay between requests
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Error: ${error}`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('🏁 FINAL CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Processed: ${listings.length}`);
    console.log(`✅ Updated: ${successCount}`);
    console.log(`📸 New images: ${totalNewImages}`);
    console.log(`🎯 Success rate: ${((successCount / listings.length) * 100).toFixed(1)}%`);

    // Check final status
    const { data: finalStats, error: statsError } = await supabase
      .from('listings')
      .select('images')
      .eq('platform', 'wg_gesucht');

    if (!statsError && finalStats) {
      const totalListings = finalStats.length;
      const listingsWithImages = finalStats.filter(l => Array.isArray(l.images) && l.images.length > 0).length;
      const totalImages = finalStats.reduce((sum, l) => sum + (Array.isArray(l.images) ? l.images.length : 0), 0);
      
      console.log('\n📊 FINAL OVERALL STATISTICS:');
      console.log(`📋 Total WG-Gesucht listings: ${totalListings}`);
      console.log(`📸 Listings with images: ${listingsWithImages}`);
      console.log(`📭 Listings without images: ${totalListings - listingsWithImages}`);
      console.log(`🖼️  Total images across all listings: ${totalImages}`);
      console.log(`📈 Overall coverage: ${((listingsWithImages / totalListings) * 100).toFixed(1)}%`);
      console.log(`📊 Average images per listing with images: ${listingsWithImages > 0 ? (totalImages / listingsWithImages).toFixed(1) : 0}`);
    }

    console.log('\n🎉 Final cleanup completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

finalCleanupZeroImages();