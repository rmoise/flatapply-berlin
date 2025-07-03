import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function updateListings() {
  console.log('🚀 Starting listing update...\n');

  try {
    console.log('⚠️  This script needs to be updated to use new scraping system');
    console.log('The job-runner was part of an old cron job implementation that has been removed');
    console.log('\nPlease implement a new update process using the updated scraping infrastructure.');
    
    // TODO: Implement new listing update logic here
    // Example structure:
    // - Initialize scrapers
    // - Run scraping for all platforms
    // - Update database
    // - Process matches
    
    // For now, just check existing listings
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get recent listings to verify current state
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, images, platform')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }
    
    console.log(`\n📋 Recent listings in database:`);
    for (const listing of listings || []) {
      console.log(`\n${listing.title}`);
      console.log(`   Platform: ${listing.platform}`);
      console.log(`   Images: ${listing.images ? `${listing.images.length} images` : 'No images'}`);
    }
    
    // Check active users
    const { data: users } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('is_active', true);
    
    console.log(`\n👥 Found ${users?.length || 0} active users for matching`);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateListings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });