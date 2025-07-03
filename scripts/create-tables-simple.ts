import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function createTablesSimple() {
  console.log('🚀 Creating essential tables...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create a fresh client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('Creating listings table...');
    
    // Create listings table
    const listingsSQL = `
      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL CHECK (platform IN ('wg_gesucht', 'immoscout24', 'kleinanzeigen', 'immowelt', 'immonet')),
        external_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        warm_rent INTEGER,
        size_sqm INTEGER,
        rooms DECIMAL,
        floor INTEGER,
        total_floors INTEGER,
        available_from DATE,
        district TEXT,
        address TEXT,
        latitude DECIMAL,
        longitude DECIMAL,
        property_type TEXT,
        images JSONB DEFAULT '[]',
        amenities JSONB DEFAULT '{}',
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        allows_auto_apply BOOLEAN DEFAULT false,
        scraped_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(platform, external_id)
      );
    `;

    const { error: listingsError } = await supabase.rpc('exec_raw_sql', { sql: listingsSQL });
    
    if (listingsError) {
      console.log('Trying alternative approach for listings table...');
      // If RPC doesn't work, try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_raw_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: listingsSQL })
      });
      
      if (!response.ok) {
        console.log('REST API failed too, table might already exist');
      }
    }

    console.log('Creating user_matches table...');

    const matchesSQL = `
      CREATE TABLE IF NOT EXISTS user_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        match_score DECIMAL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
        matched_at TIMESTAMPTZ DEFAULT NOW(),
        notified_at TIMESTAMPTZ,
        viewed_at TIMESTAMPTZ,
        dismissed_at TIMESTAMPTZ,
        saved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
      );
    `;

    const { error: matchesError } = await supabase.rpc('exec_raw_sql', { sql: matchesSQL });
    if (matchesError) {
      console.log('Matches table creation failed, might already exist');
    }

    console.log('Creating user_preferences table...');

    const preferencesSQL = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        min_rent INTEGER,
        max_rent INTEGER,
        min_rooms DECIMAL,
        max_rooms DECIMAL,
        min_size INTEGER,
        max_size INTEGER,
        preferred_districts TEXT[],
        property_types TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    const { error: preferencesError } = await supabase.rpc('exec_raw_sql', { sql: preferencesSQL });
    if (preferencesError) {
      console.log('Preferences table creation failed, might already exist');
    }

    // Test the tables
    console.log('\nTesting table access...');
    
    const tables = ['listings', 'user_matches', 'user_preferences'];
    let successCount = 0;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}':`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err);
      }
    }

    if (successCount === tables.length) {
      console.log('\n🎉 All tables created successfully!');
      console.log('You can now run: npm run test:system');
    } else {
      console.log(`\n⚠️ Only ${successCount}/${tables.length} tables working. You may need to create them manually.`);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Try running the SQL manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/wbluxzfpmsqoqambughl/sql');
  }
}

createTablesSimple()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });