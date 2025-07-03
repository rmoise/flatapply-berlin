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

async function analyzeListingPatterns() {
  console.log('🔍 Analyzing listing patterns to understand missing images...\n');
  
  try {
    // Get all listings with creation dates
    const { data: allListings, error } = await supabase
      .from('listings')
      .select('id, url, title, images, created_at, scraped_at, last_seen_at, is_active, external_id')
      .eq('platform', 'wg_gesucht')
      .order('created_at', { ascending: false });

    if (error || !allListings) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    console.log(`📊 Analyzing ${allListings.length} total listings...\n`);

    // Group by date patterns
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      last24h: allListings.filter(l => new Date(l.created_at) > oneDayAgo),
      lastWeek: allListings.filter(l => new Date(l.created_at) > oneWeekAgo),
      lastMonth: allListings.filter(l => new Date(l.created_at) > oneMonthAgo),
      older: allListings.filter(l => new Date(l.created_at) <= oneMonthAgo)
    };

    console.log('📅 LISTINGS BY AGE:');
    console.log('='.repeat(50));

    Object.entries(groups).forEach(([period, listings]) => {
      const withImages = listings.filter(l => Array.isArray(l.images) && l.images.length > 0);
      const successRate = listings.length > 0 ? (withImages.length / listings.length * 100).toFixed(1) : '0';
      
      console.log(`\n${period.toUpperCase()}:`);
      console.log(`📋 Total: ${listings.length}`);
      console.log(`📸 With images: ${withImages.length} (${successRate}%)`);
      console.log(`❌ Without images: ${listings.length - withImages.length}`);

      // Show a few examples of listings without images in this group
      const withoutImages = listings.filter(l => !Array.isArray(l.images) || l.images.length === 0);
      if (withoutImages.length > 0) {
        console.log(`\n📭 Examples without images:`);
        withoutImages.slice(0, 3).forEach((listing, idx) => {
          console.log(`   ${idx + 1}. ${listing.title?.substring(0, 60)}... (ID: ${listing.external_id})`);
        });
      }
    });

    // Check active vs inactive patterns
    const activeListings = allListings.filter(l => l.is_active);
    const inactiveListings = allListings.filter(l => !l.is_active);

    console.log('\n📊 ACTIVE VS INACTIVE:');
    console.log('='.repeat(50));

    const activeWithImages = activeListings.filter(l => Array.isArray(l.images) && l.images.length > 0);
    const inactiveWithImages = inactiveListings.filter(l => Array.isArray(l.images) && l.images.length > 0);

    console.log(`\n✅ ACTIVE LISTINGS (${activeListings.length}):`);
    console.log(`📸 With images: ${activeWithImages.length} (${activeListings.length > 0 ? (activeWithImages.length / activeListings.length * 100).toFixed(1) : '0'}%)`);

    console.log(`\n❌ INACTIVE LISTINGS (${inactiveListings.length}):`);
    console.log(`📸 With images: ${inactiveWithImages.length} (${inactiveListings.length > 0 ? (inactiveWithImages.length / inactiveListings.length * 100).toFixed(1) : '0'}%)`);

    // Check URL patterns for failed extractions
    const noImageListings = allListings.filter(l => !Array.isArray(l.images) || l.images.length === 0);
    
    console.log('\n🔗 URL PATTERNS FOR LISTINGS WITHOUT IMAGES:');
    console.log('='.repeat(50));
    
    // Group by URL patterns
    const urlPatterns = {};
    noImageListings.forEach(listing => {
      const url = listing.url;
      if (url.includes('wohnungen-in-Berlin-')) {
        const district = url.split('wohnungen-in-Berlin-')[1]?.split('.')[0];
        urlPatterns[district] = (urlPatterns[district] || 0) + 1;
      }
    });

    console.log('\n📍 Districts with most missing images:');
    Object.entries(urlPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([district, count]) => {
        console.log(`   ${district}: ${count} listings`);
      });

    // Summary and recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(50));
    console.log('1. Focus on recent listings (better success rate)');
    console.log('2. Inactive listings likely have fewer/no images');
    console.log('3. Some districts might have different gallery structures');
    console.log('4. Consider implementing retry logic for failed extractions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

analyzeListingPatterns();