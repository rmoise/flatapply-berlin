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

async function testAnzeigeAnsehenListing() {
  console.log('🔍 Testing "Anzeige ansehen" listing that should have images...\n');
  
  try {
    // Find the specific listing
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, url, title, images, description')
      .ilike('title', '%Anzeige ansehen%Wannsee%')
      .single();

    if (error || !listing) {
      console.log('❌ Could not find the Wannsee listing, trying broader search...');
      
      const { data: listings, error: error2 } = await supabase
        .from('listings')
        .select('id, url, title, images, description')
        .ilike('title', 'Anzeige ansehen%')
        .limit(3);

      if (error2 || !listings || listings.length === 0) {
        console.log('❌ No "Anzeige ansehen" listings found');
        return;
      }

      console.log(`📋 Found ${listings.length} "Anzeige ansehen" listings:`);
      listings.forEach((l, idx) => {
        console.log(`${idx + 1}. ${l.title}`);
        console.log(`   🔗 ${l.url}`);
        console.log(`   📸 Images: ${Array.isArray(l.images) ? l.images.length : 0}`);
        console.log('');
      });

      // Test the first one
      await testSpecificListing(listings[0]);
      return;
    }

    console.log(`🎯 Found the Wannsee listing:`);
    console.log(`📝 Title: ${listing.title}`);
    console.log(`🔗 URL: ${listing.url}`);
    console.log(`📸 Current images: ${Array.isArray(listing.images) ? listing.images.length : 0}`);
    console.log(`📄 Has description: ${listing.description ? 'Yes' : 'No'}`);
    console.log('');

    await testSpecificListing(listing);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testSpecificListing(listing: any) {
  console.log(`🚀 Testing scraper on: ${listing.url}\n`);
  
  try {
    const scraper = new WGGesuchtPuppeteerScraper();
    
    console.log('🔍 Running enhanced scraper...');
    const images = await scraper.extractImagesFromUrl(listing.url);
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 SCRAPER RESULTS');
    console.log('='.repeat(60));
    console.log(`📸 Images found: ${images.length}`);
    
    if (images.length > 0) {
      console.log('\n✅ SUCCESS! Found images:');
      images.forEach((img, idx) => {
        const filename = img.split('/').pop()?.split('_').slice(-2).join('_').split('.')[0] || 'unknown';
        console.log(`${idx + 1}. ${filename}`);
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
        console.error(`❌ Failed to update listing: ${updateError.message}`);
      } else {
        console.log(`\n💾 Updated listing in database with ${images.length} images!`);
      }
    } else {
      console.log('\n❌ Still no images found. This suggests:');
      console.log('   • The listing might be a redirect/preview type');
      console.log('   • Different URL structure than regular listings');
      console.log('   • Gallery behind additional authentication');
      console.log('   • Special "Anzeige ansehen" handling needed');
      
      console.log('\n🔧 Need to investigate the page structure for this type of listing');
    }

  } catch (error) {
    console.error('❌ Error testing listing:', error);
  }
}

testAnzeigeAnsehenListing();