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

interface ImageStats {
  platform: string;
  totalListings: number;
  withImages: number;
  withoutImages: number;
  avgImageCount: number;
  imageCountDistribution: Record<number, number>;
}

async function analyzeImageCounts() {
  console.log('Analyzing image counts for listings...\n');

  try {
    // Get all listings
    const { data: allListings, error: allError } = await supabase
      .from('listings')
      .select('id, platform, title, images, scraped_at, url')
      .order('scraped_at', { ascending: false });

    if (allError) throw allError;

    if (!allListings || allListings.length === 0) {
      console.log('No listings found in database');
      return;
    }

    // Analyze by platform
    const statsByPlatform: Record<string, ImageStats> = {};
    const recentWgListings: any[] = [];

    for (const listing of allListings) {
      const platform = listing.platform;
      const imageCount = listing.images?.length || 0;

      // Initialize platform stats if needed
      if (!statsByPlatform[platform]) {
        statsByPlatform[platform] = {
          platform,
          totalListings: 0,
          withImages: 0,
          withoutImages: 0,
          avgImageCount: 0,
          imageCountDistribution: {}
        };
      }

      const stats = statsByPlatform[platform];
      stats.totalListings++;
      
      if (imageCount > 0) {
        stats.withImages++;
      } else {
        stats.withoutImages++;
      }

      // Track distribution
      stats.imageCountDistribution[imageCount] = (stats.imageCountDistribution[imageCount] || 0) + 1;

      // Collect recent WG-Gesucht listings
      if (platform === 'wg_gesucht' && recentWgListings.length < 20) {
        recentWgListings.push({
          id: listing.id,
          title: listing.title.substring(0, 50) + (listing.title.length > 50 ? '...' : ''),
          imageCount,
          url: listing.url,
          scrapedAt: listing.scraped_at
        });
      }
    }

    // Calculate averages
    for (const platform in statsByPlatform) {
      const stats = statsByPlatform[platform];
      const totalImages = Object.entries(stats.imageCountDistribution)
        .reduce((sum, [count, num]) => sum + (parseInt(count) * num), 0);
      stats.avgImageCount = stats.totalListings > 0 ? totalImages / stats.totalListings : 0;
    }

    // Print overall statistics
    console.log('=== OVERALL STATISTICS ===\n');
    console.log(`Total listings: ${allListings.length}`);
    console.log(`Platforms: ${Object.keys(statsByPlatform).join(', ')}\n`);

    // Print statistics by platform
    for (const platform in statsByPlatform) {
      const stats = statsByPlatform[platform];
      console.log(`\n=== ${platform.toUpperCase()} ===`);
      console.log(`Total listings: ${stats.totalListings}`);
      console.log(`With images: ${stats.withImages} (${((stats.withImages / stats.totalListings) * 100).toFixed(1)}%)`);
      console.log(`Without images: ${stats.withoutImages} (${((stats.withoutImages / stats.totalListings) * 100).toFixed(1)}%)`);
      console.log(`Average image count: ${stats.avgImageCount.toFixed(2)}`);
      
      console.log('\nImage count distribution:');
      const sortedDistribution = Object.entries(stats.imageCountDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
      
      for (const [count, num] of sortedDistribution) {
        const percentage = ((num / stats.totalListings) * 100).toFixed(1);
        console.log(`  ${count} images: ${num} listings (${percentage}%)`);
      }
    }

    // Print recent WG-Gesucht listings
    console.log('\n\n=== RECENT WG-GESUCHT LISTINGS ===\n');
    console.log('Showing 20 most recent WG-Gesucht listings:\n');
    
    for (const listing of recentWgListings) {
      console.log(`ID: ${listing.id}`);
      console.log(`Title: ${listing.title}`);
      console.log(`Images: ${listing.imageCount}`);
      console.log(`URL: ${listing.url}`);
      console.log(`Scraped: ${new Date(listing.scrapedAt).toLocaleString()}`);
      console.log('---');
    }

    // Find problematic listings (0 images)
    const { data: noImageListings, error: noImageError } = await supabase
      .from('listings')
      .select('id, platform, title, url, scraped_at')
      .eq('images', '[]')
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (!noImageError && noImageListings && noImageListings.length > 0) {
      console.log('\n\n=== LISTINGS WITHOUT IMAGES (MOST RECENT) ===\n');
      for (const listing of noImageListings) {
        console.log(`Platform: ${listing.platform}`);
        console.log(`ID: ${listing.id}`);
        console.log(`Title: ${listing.title.substring(0, 50)}...`);
        console.log(`URL: ${listing.url}`);
        console.log(`Scraped: ${new Date(listing.scraped_at).toLocaleString()}`);
        console.log('---');
      }
    }

  } catch (error) {
    console.error('Error analyzing image counts:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeImageCounts();