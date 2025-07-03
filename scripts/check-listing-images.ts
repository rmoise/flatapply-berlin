import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function checkListingImages() {
  console.log('🔍 Checking listing images...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, images, platform')
      .limit(10);

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    console.log(`Found ${listings?.length || 0} listings\n`);

    for (const listing of listings || []) {
      console.log(`📋 Listing: ${listing.title}`);
      console.log(`   Platform: ${listing.platform}`);
      console.log(`   Images: ${listing.images ? `${listing.images.length} images` : 'No images'}`);
      if (listing.images && listing.images.length > 0) {
        console.log(`   First image: ${listing.images[0]}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkListingImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });