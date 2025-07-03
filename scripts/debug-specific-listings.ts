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

async function debugSpecificListings() {
  console.log('🔍 Debugging specific listings with 0 images...\n');
  
  try {
    // Get listings that should have images but don't
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, url, title, images, platform')
      .eq('platform', 'wg_gesucht')
      .eq('images', '[]')
      .ilike('title', '%Tannhaus%')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    // If no Tannhaus listings, get any recent ones
    if (!listings || listings.length === 0) {
      console.log('🔍 No Tannhaus listings found, checking other recent listings...');
      const { data: otherListings, error: otherError } = await supabase
        .from('listings')
        .select('id, url, title, images, platform')
        .eq('platform', 'wg_gesucht')
        .eq('images', '[]')
        .order('created_at', { ascending: false })
        .limit(3);

      if (otherError || !otherListings || otherListings.length === 0) {
        console.log('📭 No listings with 0 images found');
        return;
      }

      console.log(`🎯 Found ${otherListings.length} listings with 0 images to debug:`);
      await debugListings(otherListings);
    } else {
      console.log(`🎯 Found ${listings.length} Tannhaus listings with 0 images:`);
      await debugListings(listings);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function debugListings(listings: any[]) {
  const scraper = new WGGesuchtPuppeteerScraper();
  
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    console.log(`\n🔍 Debugging ${i + 1}/${listings.length}: ${listing.title}`);
    console.log(`🔗 URL: ${listing.url}`);

    try {
      // Run scraper with more detailed logging
      const images = await scraper.extractImagesFromUrl(listing.url);
      
      if (images.length > 0) {
        console.log(`✅ SUCCESS: Found ${images.length} images!`);
        console.log(`📸 Images found:`);
        images.forEach((img, idx) => {
          console.log(`   ${idx + 1}. ${img}`);
        });
        
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
          console.log(`💾 Updated listing in database`);
        }
      } else {
        console.log(`❌ STILL NO IMAGES - This listing may have no gallery or be expired`);
      }

      // Add delay between requests
      if (i < listings.length - 1) {
        console.log('⏳ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      console.error(`❌ Error processing listing: ${error}`);
    }
  }
}

debugSpecificListings();