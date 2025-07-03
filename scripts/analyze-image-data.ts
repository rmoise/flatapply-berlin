import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeImageData() {
  console.log('Analyzing image data in detail...\n');

  try {
    // Get sample of WG-Gesucht listings to analyze
    const { data: wgListings, error: wgError } = await supabase
      .from('listings')
      .select('*')
      .eq('platform', 'wg_gesucht')
      .order('scraped_at', { ascending: false })
      .limit(5);

    if (wgError) throw wgError;

    console.log('=== SAMPLE WG-GESUCHT LISTINGS (5 MOST RECENT) ===\n');
    
    for (const listing of wgListings || []) {
      console.log(`ID: ${listing.id}`);
      console.log(`Title: ${listing.title}`);
      console.log(`URL: ${listing.url}`);
      console.log(`External ID: ${listing.external_id}`);
      console.log(`Images field type: ${typeof listing.images}`);
      console.log(`Images field value: ${JSON.stringify(listing.images)}`);
      console.log(`Images array length: ${Array.isArray(listing.images) ? listing.images.length : 'N/A'}`);
      console.log(`Scraped at: ${new Date(listing.scraped_at).toLocaleString()}`);
      console.log(`Description preview: ${listing.description?.substring(0, 100)}...`);
      console.log('---\n');
    }

    // Check different image field states
    console.log('\n=== IMAGE FIELD ANALYSIS ===\n');

    // Count null images
    const { count: nullCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .is('images', null);

    console.log(`Listings with NULL images: ${nullCount || 0}`);

    // Count empty array images
    const { data: emptyArrayData } = await supabase
      .from('listings')
      .select('id, images')
      .eq('images', '[]');

    console.log(`Listings with empty array []: ${emptyArrayData?.length || 0}`);

    // Get all listings to check images programmatically
    const { data: allListings } = await supabase
      .from('listings')
      .select('id, images, platform');

    if (allListings) {
      let imageStats = {
        null: 0,
        emptyArray: 0,
        hasImages: 0,
        totalImages: 0,
        byPlatform: {} as Record<string, { total: number, withImages: number, totalImageCount: number }>
      };

      for (const listing of allListings) {
        const platform = listing.platform;
        
        // Initialize platform stats
        if (!imageStats.byPlatform[platform]) {
          imageStats.byPlatform[platform] = { total: 0, withImages: 0, totalImageCount: 0 };
        }
        imageStats.byPlatform[platform].total++;

        if (listing.images === null) {
          imageStats.null++;
        } else if (Array.isArray(listing.images)) {
          if (listing.images.length === 0) {
            imageStats.emptyArray++;
          } else {
            imageStats.hasImages++;
            imageStats.totalImages += listing.images.length;
            imageStats.byPlatform[platform].withImages++;
            imageStats.byPlatform[platform].totalImageCount += listing.images.length;
          }
        }
      }

      console.log('\nDetailed image statistics:');
      console.log(`- NULL images: ${imageStats.null}`);
      console.log(`- Empty array []: ${imageStats.emptyArray}`);
      console.log(`- Has images: ${imageStats.hasImages}`);
      console.log(`- Total images across all listings: ${imageStats.totalImages}`);

      console.log('\nBy platform:');
      for (const [platform, stats] of Object.entries(imageStats.byPlatform)) {
        console.log(`\n${platform}:`);
        console.log(`  - Total listings: ${stats.total}`);
        console.log(`  - With images: ${stats.withImages} (${((stats.withImages / stats.total) * 100).toFixed(1)}%)`);
        console.log(`  - Total image count: ${stats.totalImageCount}`);
        console.log(`  - Avg images per listing: ${(stats.totalImageCount / stats.total).toFixed(2)}`);
      }
    }

    // Check if there's a pattern in URLs
    console.log('\n\n=== URL PATTERN ANALYSIS ===\n');
    const { data: urlSample } = await supabase
      .from('listings')
      .select('url, external_id')
      .eq('platform', 'wg_gesucht')
      .limit(10);

    if (urlSample) {
      console.log('Sample WG-Gesucht URLs and IDs:');
      for (const item of urlSample) {
        const urlMatch = item.url.match(/\.(\d+)\.html/);
        console.log(`External ID: ${item.external_id}, URL ID: ${urlMatch?.[1] || 'N/A'}, Match: ${item.external_id === urlMatch?.[1]}`);
      }
    }

  } catch (error) {
    console.error('Error analyzing image data:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeImageData();