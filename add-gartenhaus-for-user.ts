import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function addGartenhausForUser() {
  console.log('🏠 Adding Gartenhaus listing for current user...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Data we extracted from our tests
  const gartenhausData = {
    platform: 'wg_gesucht',
    external_id: 'wg_9597345',
    url: 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Hermsdorf.9597345.html',
    title: 'Gartenhaus - Möblierte zwei-Zimmer Wohnung',
    description: 'Gemütliche möblierte zwei-Zimmer Wohnung im Gartenhaus mit schönem Garten in Berlin-Hermsdorf.',
    price: 890,
    warm_rent: 1050,
    size_sqm: 62,
    rooms: 2,
    floor: 0,
    total_floors: 1,
    available_from: new Date('2024-02-01').toISOString(),
    district: 'Hermsdorf',
    address: 'Berlin-Hermsdorf',
    property_type: 'apartment',
    images: [
      'https://img.wg-gesucht.de/media/up/2023/05/b5729b8690b1012a2263bbb0080be5d005082def720389e77d87ff3a15a628d5_GH1_1.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/49e7ea5e9ba4173fbae7717574030baa1e3280e6849ddae006c5efdd18162f8b_GH_1__7.large.jpg',
      'https://img.wg-gesucht.de/media/up/2025/18/ece57e06e000b2571bb2e4f4cd5a579856b76ca830f139ce9af8c46fda621b7c_Waldsee_005.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/4f08f4221976bd4fea96692a4d66005e74820a16a2f323aa5a3e3076f514deeb_GH1_3.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/45/be02dddea6a10756425e3cd888395cfc477a3c66317e009c7cabc57b9f0e1bca_GH1_6.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/54e557ad149e1eb8455fd8874479aa45e13ffae810120a922df2a2b44362148c_GH1__5.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/dad95dbc9985a80f341125f47268fa645e1ef62b986998384f89222ee62542f8_GH1.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/1fde974ce05e22b6c1f6f94f851dc9f162a43a0830cca9d1fac1217f040e150d_IMG_20160129_00678__1_.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/79987ab0b90a65c52c934142997b2e7e2e7507c24a217a6a7e88bb426540b439_GH1___Dusche3.large.jpg',
      'https://img.wg-gesucht.de/media/up/2023/05/4d3f024e6c1d8ddc53d14af68b6f67ad660c5a9132873a68e976fe340abc125a_GH_1__2.large.jpg'
    ],
    amenities: {
      balcony: false,
      elevator: false,
      furnished: true,
      kitchen: true,
      parking: true,
      nearTransport: true,
      garden: true
    },
    contact_name: 'Vermieter',
    contact_email: null,
    contact_phone: null,
    allows_auto_apply: false,
    scraped_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true
  };
  
  try {
    // Step 1: Insert the listing
    console.log('💾 Inserting Gartenhaus listing...');
    
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .upsert(gartenhausData, {
        onConflict: 'platform,external_id'
      })
      .select()
      .single();
      
    if (listingError) {
      console.error('❌ Error inserting listing:', listingError);
      return;
    }
    
    console.log('✅ Listing inserted successfully!');
    console.log(`   - ID: ${listing.id}`);
    console.log(`   - Title: ${listing.title}`);
    console.log(`   - Images: ${listing.images.length}`);
    
    // Step 2: Get all users to create matches
    console.log('\n👥 Finding users to create matches...');
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(10);
      
    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found or error:', usersError);
      
      // Try to get user from auth
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log(`Found ${authUsers.users.length} auth users`);
        
        // Create matches for auth users
        for (const authUser of authUsers.users) {
          const { error: matchError } = await supabase
            .from('user_matches')
            .upsert({
              user_id: authUser.id,
              listing_id: listing.id,
              match_score: 85,
              matched_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,listing_id'
            });
            
          if (!matchError) {
            console.log(`✅ Created match for user ${authUser.email}`);
          }
        }
      }
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Step 3: Create matches for all users
    console.log('\n🔗 Creating matches...');
    
    for (const user of users) {
      const { error: matchError } = await supabase
        .from('user_matches')
        .upsert({
          user_id: user.id,
          listing_id: listing.id,
          match_score: 85, // Good match score
          matched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,listing_id'
        });
        
      if (matchError) {
        console.error(`❌ Error creating match for user ${user.id}:`, matchError);
      } else {
        console.log(`✅ Created match for user ${user.id}`);
      }
    }
    
    // Step 4: Verify the data
    console.log('\n🔍 Verifying data...');
    
    const { data: verifyListing } = await supabase
      .from('listings')
      .select('*')
      .eq('external_id', 'wg_9597345')
      .single();
      
    if (verifyListing) {
      console.log('✅ Listing verified in database');
    }
    
    const { data: matches, count } = await supabase
      .from('user_matches')
      .select('*', { count: 'exact' })
      .eq('listing_id', listing.id);
      
    console.log(`✅ Created ${count} user matches`);
    
    console.log('\n🎯 SUCCESS! The Gartenhaus listing should now appear in the dashboard.');
    console.log('Go to: http://localhost:3001/dashboard/listings');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addGartenhausForUser();