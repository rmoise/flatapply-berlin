import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

async function checkRefetchProgress() {
  console.log('🔍 Checking photo refetch progress...\n');
  
  try {
    // Get all listings with their image counts
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, images, platform, updated_at')
      .eq('platform', 'wg_gesucht')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    if (!listings || listings.length === 0) {
      console.log('📭 No listings found');
      return;
    }

    // Calculate statistics
    const listingsWithImages = listings.filter(l => Array.isArray(l.images) && l.images.length > 0);
    const listingsWithoutImages = listings.filter(l => !Array.isArray(l.images) || l.images.length === 0);
    const totalImages = listings.reduce((sum, l) => sum + (Array.isArray(l.images) ? l.images.length : 0), 0);

    console.log('📊 PHOTO REFETCH STATISTICS');
    console.log('='.repeat(50));
    console.log(`📋 Total listings: ${listings.length}`);
    console.log(`📸 Listings with images: ${listingsWithImages.length}`);
    console.log(`📭 Listings without images: ${listingsWithoutImages.length}`);
    console.log(`🖼️  Total images: ${totalImages}`);
    console.log(`📈 Average images per listing: ${(totalImages / listings.length).toFixed(1)}`);

    // Show top listings with most images
    const sortedByImages = listings
      .map(l => ({ 
        ...l, 
        imageCount: Array.isArray(l.images) ? l.images.length : 0,
        updatedRecently: new Date(l.updated_at) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }))
      .sort((a, b) => b.imageCount - a.imageCount)
      .slice(0, 10);

    console.log('\n🏆 TOP 10 LISTINGS WITH MOST IMAGES:');
    console.log('-'.repeat(70));
    sortedByImages.forEach((listing, idx) => {
      const title = listing.title?.substring(0, 45) || 'Untitled';
      const status = listing.updatedRecently ? '🔄 Recently updated' : '⏰ Older';
      console.log(`${idx + 1}. ${title}... - ${listing.imageCount} images ${status}`);
    });

    // Show recently updated listings
    const recentlyUpdated = listings
      .filter(l => new Date(l.updated_at) > new Date(Date.now() - 2 * 60 * 60 * 1000)) // Last 2 hours
      .map(l => ({ 
        ...l, 
        imageCount: Array.isArray(l.images) ? l.images.length : 0 
      }))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    console.log('\n🔄 RECENTLY UPDATED LISTINGS (Last 2 hours):');
    console.log('-'.repeat(70));
    if (recentlyUpdated.length === 0) {
      console.log('📭 No recently updated listings found');
    } else {
      recentlyUpdated.slice(0, 10).forEach((listing, idx) => {
        const title = listing.title?.substring(0, 45) || 'Untitled';
        const time = new Date(listing.updated_at).toLocaleTimeString();
        console.log(`${idx + 1}. ${title}... - ${listing.imageCount} images (${time})`);
      });
    }

    // Show listings that need attention (0 images)
    if (listingsWithoutImages.length > 0) {
      console.log('\n⚠️  LISTINGS STILL NEEDING IMAGES:');
      console.log('-'.repeat(70));
      listingsWithoutImages.slice(0, 5).forEach((listing, idx) => {
        const title = listing.title?.substring(0, 50) || 'Untitled';
        console.log(`${idx + 1}. ${title}...`);
      });
      if (listingsWithoutImages.length > 5) {
        console.log(`... and ${listingsWithoutImages.length - 5} more`);
      }
    }

    console.log('\n✅ Progress check completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkRefetchProgress();