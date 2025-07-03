import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function testDBConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    console.log('✅ Environment variables loaded');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    console.log('\n🔗 Testing basic connection...');
    const { data, error } = await supabase.from('listings').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }

    console.log('✅ Database connection successful');

    // Check if tables exist
    console.log('\n📋 Checking database tables...');
    
    const tables = ['listings', 'listing_matches', 'user_preferences'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err);
      }
    }

    console.log('\n✅ Database connection test completed!');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

testDBConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });