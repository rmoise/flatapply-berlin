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
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAndRefetchMainGallery() {
  console.log('🎯 Starting MAIN GALLERY photo clearing and refetching process...');
  console.log('🔍 This will extract only the specific listing\'s gallery photos (not all photos from gallery page)\n');
  
  try {
    // Step 1: Get all listings with images
    console.log('📋 Fetching listings with existing photos...');
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, url, title, images, platform')
      .neq('images', '[]')
      .eq('platform', 'wg_gesucht')
      .order('created_at', { ascending: false })
      .limit(20); // Start with smaller batch to test

    if (fetchError) {
      console.error('❌ Error fetching listings:', fetchError);
      return;
    }

    if (!listings || listings.length === 0) {
      console.log('📭 No listings with images found');
      return;
    }

    console.log(`📸 Found ${listings.length} listings with images`);
    
    // Show current photo counts
    listings.forEach((listing, index) => {
      const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
      console.log(`${index + 1}. ${listing.title?.substring(0, 50)}... - ${imageCount} images`);
    });

    // Step 2: Clear existing images
    console.log('\n🗑️  Clearing existing images...');
    const { error: clearError } = await supabase
      .from('listings')
      .update({ images: [] })
      .in('id', listings.map(l => l.id));

    if (clearError) {
      console.error('❌ Error clearing images:', clearError);
      return;
    }

    console.log('✅ Successfully cleared all images');

    // Step 3: Refetch images with improved listing-specific scraper
    console.log('\n🚀 Starting image refetch with LISTING-SPECIFIC scraper...');
    const scraper = new WGGesuchtPuppeteerScraper();
    
    let processedCount = 0;
    let successCount = 0;
    const batchSize = 2; // Process in small batches

    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listings.length / batchSize)}`);

      for (const listing of batch) {
        try {
          processedCount++;
          console.log(`\n${processedCount}/${listings.length}. Processing: ${listing.title?.substring(0, 60)}...`);
          console.log(`🔗 URL: ${listing.url}`);

          // Extract images using the improved listing-specific scraper
          const newImages = await scraper.extractImagesFromUrl(listing.url);
          
          if (newImages.length > 0) {
            // Update listing with new images
            const { error: updateError } = await supabase
              .from('listings')
              .update({ 
                images: newImages,
                updated_at: new Date().toISOString()
              })
              .eq('id', listing.id);

            if (updateError) {
              console.error(`❌ Error updating listing ${listing.id}:`, updateError);
            } else {
              successCount++;
              console.log(`✅ Updated with ${newImages.length} MAIN GALLERY images`);
              
              // Show a few image previews
              if (newImages.length > 0) {
                console.log(`📸 Gallery preview:`);
                newImages.slice(0, 3).forEach((img, idx) => {
                  const filename = img.split('/').pop()?.split('_').slice(-2).join('_').split('.')[0] || 'unknown';
                  console.log(`   ${idx + 1}. ${filename}`);
                });
                if (newImages.length > 3) {
                  console.log(`   ... and ${newImages.length - 3} more main gallery photos`);
                }
              }
            }
          } else {
            console.log(`⚠️  No gallery images found for this listing`);
          }

          // Add delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`❌ Error processing listing ${listing.id}:`, error);
        }
      }

      // Longer delay between batches
      if (i + batchSize < listings.length) {
        console.log('⏳ Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    // Step 4: Show summary
    console.log('\n' + '='.repeat(60));
    console.log('🏁 MAIN GALLERY REFETCH SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total listings processed: ${processedCount}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${processedCount - successCount}`);
    
    // Verify results
    console.log('\n🔍 Verifying results...');
    const { data: updatedListings, error: verifyError } = await supabase
      .from('listings')
      .select('id, title, images')
      .in('id', listings.map(l => l.id));

    if (!verifyError && updatedListings) {
      const totalImages = updatedListings.reduce((sum, listing) => {
        return sum + (Array.isArray(listing.images) ? listing.images.length : 0);
      }, 0);
      
      const avgImagesPerListing = totalImages / updatedListings.length;
      
      console.log(`📸 Total MAIN GALLERY images: ${totalImages}`);
      console.log(`📈 Average per listing: ${avgImagesPerListing.toFixed(1)} images`);
      
      // Show all listings with their image counts
      console.log('\n📋 MAIN GALLERY results per listing:');
      updatedListings
        .map(l => ({ ...l, imageCount: Array.isArray(l.images) ? l.images.length : 0 }))
        .sort((a, b) => b.imageCount - a.imageCount)
        .forEach((listing, idx) => {
          console.log(`${idx + 1}. ${listing.title?.substring(0, 45)}... - ${listing.imageCount} main gallery images`);
        });
    }

    console.log('\n🎉 MAIN GALLERY photo clearing and refetching completed!');
    console.log('🎯 Now showing only each listing\'s specific gallery photos (no mixed photos from other listings)');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
clearAndRefetchMainGallery();