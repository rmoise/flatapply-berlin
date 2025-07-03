import { createClient } from './src/lib/supabase/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function directUpdateGartenhaus() {
  console.log('🏠 Directly updating Gartenhaus listing with known data...\n');
  
  const supabase = createClient();
  
  // Data we extracted from our tests
  const gartenhausData = {
    platform: 'wg_gesucht',
    external_id: 'wg_9597345',
    url: 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Hermsdorf.9597345.html',
    title: 'Gartenhaus - Möblierte zwei-Zimmer Wohnung',
    price: 890,
    size_sqm: 62,
    rooms: 2,
    district: 'Hermsdorf',
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
    scraped_at: new Date().toISOString(),
    allows_auto_apply: false
  };
  
  try {
    console.log('💾 Updating database...');
    
    const { data, error } = await supabase
      .from('listings')
      .upsert(gartenhausData, {
        onConflict: 'platform,external_id'
      })
      .select();
      
    if (error) {
      console.error('❌ Database error:', error);
    } else {
      console.log('✅ Gartenhaus listing updated successfully!');
      console.log(`   - ${gartenhausData.images.length} images`);
      console.log(`   - Price: €${gartenhausData.price}`);
      console.log(`   - Size: ${gartenhausData.size_sqm}m²`);
      console.log(`   - Rooms: ${gartenhausData.rooms}`);
      
      if (data && data[0]) {
        console.log(`   - Database ID: ${data[0].id}`);
      }
    }
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('external_id', 'wg_9597345')
      .single();
      
    if (listing) {
      console.log('✅ Verification successful:');
      console.log(`   - Images in DB: ${listing.images?.length || 0}`);
      console.log(`   - Title: ${listing.title}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

directUpdateGartenhaus();