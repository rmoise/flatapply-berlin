import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function checkExternalIds() {
  console.log('🔍 Checking external IDs and duplicates...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Get all listings with their external_ids
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, external_id, platform, title, images, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📊 Total listings: ${listings?.length || 0}\n`);
    
    if (listings && listings.length > 0) {
      // Group by external_id to find duplicates
      const grouped = listings.reduce((acc, listing) => {
        const key = `${listing.platform}-${listing.external_id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(listing);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Find duplicates
      const duplicates = Object.entries(grouped).filter(([key, items]) => items.length > 1);
      
      if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate external_ids:\n`);
        
        duplicates.forEach(([key, items]) => {
          console.log(`🔗 ${key}:`);
          items.forEach((item, idx) => {
            const imageCount = item.images?.length || 0;
            console.log(`  ${idx + 1}. ID: ${item.id}`);
            console.log(`     📸 ${imageCount} images`);
            console.log(`     📅 ${new Date(item.created_at).toLocaleString()}`);
            console.log(`     📋 ${item.title?.substring(0, 50)}...`);
          });
          console.log('');
        });
      } else {
        console.log('✅ No duplicates found based on platform+external_id\n');
      }
      
      // Show recent listings
      console.log('📋 Recent listings:');
      listings.slice(0, 5).forEach((listing, idx) => {
        const imageCount = listing.images?.length || 0;
        console.log(`${idx + 1}. External ID: ${listing.external_id}`);
        console.log(`   📸 ${imageCount} images`);
        console.log(`   📅 ${new Date(listing.created_at).toLocaleString()}`);
        console.log(`   📋 ${listing.title?.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkExternalIds().catch(console.error);