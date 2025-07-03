import { config } from 'dotenv';
import { WGGesuchtScraper } from '../src/features/scraping/scrapers/wg-gesucht';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

async function updateSingleListing() {
  console.log('🔍 Updating single listing with full details...\n');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the existing listing
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', 'a7097db9-073e-4812-9d54-52c2ca73ef06')
      .single();

    if (!listing) {
      console.log('Listing not found');
      return;
    }

    console.log('Current title:', listing.title);
    console.log('Current description:', listing.description || 'No description');
    console.log('Current price:', listing.price);
    console.log('Current size:', listing.size_sqm);
    console.log('Current rooms:', listing.rooms);

    // Create scraper instance
    const scraper = new WGGesuchtScraper();
    
    // Initialize browser
    await (scraper as any).initBrowser();
    
    try {
      // Fetch the detail page
      console.log('\n📡 Fetching detail page...');
      const html = await (scraper as any).fetchPage(listing.url);
      const $ = cheerio.load(html);
      
      // Extract details
      const details = scraper.extractListingDetails($, listing.url);
      
      console.log('\n✅ Extracted details:');
      console.log('Title:', details.title);
      console.log('Description preview:', details.description?.substring(0, 200) + '...');
      console.log('Size:', details.size);
      console.log('Rooms:', details.rooms);
      console.log('Images:', details.images?.length || 0);

      // Update the listing in database
      const updates: any = {};
      
      if (details.description && details.description.length > 10) {
        updates.description = details.description;
      }
      
      if (details.size) {
        updates.size_sqm = details.size;
      }
      
      if (details.rooms) {
        updates.rooms = details.rooms;
      }
      
      if (details.images && details.images.length > 0) {
        updates.images = details.images;
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('listings')
          .update(updates)
          .eq('id', listing.id);
          
        if (error) {
          console.error('Error updating listing:', error);
        } else {
          console.log('\n✅ Listing updated successfully!');
        }
      }
      
    } finally {
      await (scraper as any).closeBrowser();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateSingleListing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });