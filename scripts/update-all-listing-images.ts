import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GlobalImageExtractor } from '../src/features/scraping/scrapers/global-image-extractor';

dotenv.config({ path: '.env.local' });

async function updateAllListingImages() {
  console.log('🚀 Starting global image update...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get all listings that need image updates
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, url, images, platform')
    .or('images.is.null,images.eq.{}')  // No images
    .eq('platform', 'wg_gesucht')  // Start with WG-Gesucht
    .limit(50);  // Process in batches
    
  if (error || !listings) {
    console.log('❌ Error fetching listings:', error);
    return;
  }
  
  console.log(`📊 Found ${listings.length} listings without images\n`);
  
  const extractor = new GlobalImageExtractor();
  const batchSize = 5;
  
  try {
    await extractor.initialize();
    
    // Process in batches
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(listings.length/batchSize)}`);
      
      // Extract images for batch
      const results = await extractor.extractImagesForMultipleListings(
        batch.map(l => ({ id: l.id, url: l.url }))
      );
      
      // Update database
      for (const [listingId, images] of results) {
        if (images.length > 0) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ 
              images,
              updated_at: new Date().toISOString()
            })
            .eq('id', listingId);
            
          if (updateError) {
            console.log(`❌ Failed to update listing ${listingId}:`, updateError);
          } else {
            console.log(`✅ Updated listing ${listingId} with ${images.length} images`);
          }
        }
      }
      
      // Rate limiting between batches
      if (i + batchSize < listings.length) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
  } finally {
    await extractor.close();
  }
  
  console.log('\n🎉 Image update complete!');
  
  // Show summary
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .not('images', 'is', null)
    .neq('images', '{}');
    
  console.log(`\n📊 Summary: ${count} listings now have images`);
}

// Run if called directly
if (require.main === module) {
  updateAllListingImages().catch(console.error);
}

export { updateAllListingImages };