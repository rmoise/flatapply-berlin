import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function cleanupOldListings() {
  console.log('🧹 Cleaning up old listings...\n');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    
    // Get all active listings
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, available_from, district')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching listings:', fetchError);
      return;
    }

    console.log(`Found ${listings?.length || 0} active listings`);
    
    let deactivatedCount = 0;
    
    for (const listing of listings || []) {
      // Check if the listing has an available_from date in the past
      if (listing.available_from) {
        const availableDate = new Date(listing.available_from);
        
        // If the available date is more than 1 month in the past, it's likely expired
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (availableDate < oneMonthAgo) {
          console.log(`\n❌ Deactivating old listing:`);
          console.log(`   Title: ${listing.title}`);
          console.log(`   Available from: ${availableDate.toLocaleDateString()}`);
          console.log(`   District: ${listing.district || 'Unknown'}`);
          
          const { error: updateError } = await supabase
            .from('listings')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', listing.id);
            
          if (!updateError) {
            deactivatedCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Deactivated ${deactivatedCount} old listings`);
    
    // Now clear all existing active listings to get fresh data
    console.log('\n🗑️  Clearing all remaining active listings for fresh scrape...');
    
    const { error: clearError } = await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('is_active', true);
      
    if (clearError) {
      console.error('Error clearing listings:', clearError);
    } else {
      console.log('✅ All listings marked as inactive, ready for fresh scrape');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupOldListings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });