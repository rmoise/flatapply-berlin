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

async function debugMissingContent() {
  console.log('🔍 Debugging missing images and descriptions...\n');
  
  try {
    // Check listings with missing images
    const { data: noImageListings, error: imgError } = await supabase
      .from('listings')
      .select('id, url, title, images, description, platform, created_at')
      .eq('platform', 'wg_gesucht')
      .eq('images', '[]')
      .order('created_at', { ascending: false })
      .limit(5);

    if (imgError) {
      console.error('❌ Error fetching listings with no images:', imgError);
      return;
    }

    // Check listings with missing descriptions
    const { data: noDescListings, error: descError } = await supabase
      .from('listings')
      .select('id, url, title, images, description, platform, created_at')
      .eq('platform', 'wg_gesucht')
      .or('description.is.null,description.eq.')
      .order('created_at', { ascending: false })
      .limit(5);

    if (descError) {
      console.error('❌ Error fetching listings with no descriptions:', descError);
      return;
    }

    // Check recent listings to see overall data quality
    const { data: recentListings, error: recentError } = await supabase
      .from('listings')
      .select('id, url, title, images, description, platform, created_at, price, size_sqm, rooms')
      .eq('platform', 'wg_gesucht')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Error fetching recent listings:', recentError);
      return;
    }

    console.log('📊 CONTENT ANALYSIS SUMMARY');
    console.log('='.repeat(50));

    if (noImageListings) {
      console.log(`\n📭 LISTINGS WITH NO IMAGES (${noImageListings.length}):`);
      noImageListings.forEach((listing, idx) => {
        console.log(`${idx + 1}. ${listing.title?.substring(0, 60)}...`);
        console.log(`   🔗 ${listing.url}`);
        console.log(`   📝 Description: ${listing.description ? `${listing.description.substring(0, 50)}...` : '❌ MISSING'}`);
        console.log('');
      });
    }

    if (noDescListings) {
      console.log(`\n📝 LISTINGS WITH NO DESCRIPTIONS (${noDescListings.length}):`);
      noDescListings.forEach((listing, idx) => {
        const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
        console.log(`${idx + 1}. ${listing.title?.substring(0, 60)}...`);
        console.log(`   🔗 ${listing.url}`);
        console.log(`   📸 Images: ${imageCount}`);
        console.log('');
      });
    }

    if (recentListings) {
      console.log(`\n📊 RECENT LISTINGS DATA QUALITY (${recentListings.length}):`);
      console.log('-'.repeat(70));
      
      let withImages = 0;
      let withDescriptions = 0;
      let totalImages = 0;
      
      recentListings.forEach((listing, idx) => {
        const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
        const hasDesc = listing.description && listing.description.trim().length > 0;
        
        if (imageCount > 0) withImages++;
        if (hasDesc) withDescriptions++;
        totalImages += imageCount;
        
        console.log(`${idx + 1}. ${listing.title?.substring(0, 45)}...`);
        console.log(`   📸 Images: ${imageCount} | 📝 Desc: ${hasDesc ? '✅' : '❌'} | 💰 €${listing.price || '?'} | 📐 ${listing.size_sqm || '?'}m² | 🛏️ ${listing.rooms || '?'} rooms`);
      });

      console.log('\n📈 QUALITY METRICS:');
      console.log(`📸 Listings with images: ${withImages}/${recentListings.length} (${((withImages/recentListings.length)*100).toFixed(1)}%)`);
      console.log(`📝 Listings with descriptions: ${withDescriptions}/${recentListings.length} (${((withDescriptions/recentListings.length)*100).toFixed(1)}%)`);
      console.log(`🖼️  Average images per listing: ${(totalImages/recentListings.length).toFixed(1)}`);
    }

    // Get overall statistics
    const { data: allListings, error: allError } = await supabase
      .from('listings')
      .select('images, description')
      .eq('platform', 'wg_gesucht');

    if (!allError && allListings) {
      const totalCount = allListings.length;
      const withImages = allListings.filter(l => Array.isArray(l.images) && l.images.length > 0).length;
      const withDesc = allListings.filter(l => l.description && l.description.trim().length > 0).length;
      
      console.log('\n🌍 OVERALL STATISTICS:');
      console.log(`📋 Total listings: ${totalCount}`);
      console.log(`📸 With images: ${withImages} (${((withImages/totalCount)*100).toFixed(1)}%)`);
      console.log(`📝 With descriptions: ${withDesc} (${((withDesc/totalCount)*100).toFixed(1)}%)`);
      console.log(`❌ Missing images: ${totalCount - withImages}`);
      console.log(`❌ Missing descriptions: ${totalCount - withDesc}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugMissingContent();