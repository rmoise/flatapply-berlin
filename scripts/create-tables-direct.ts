import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function createTables() {
  console.log('🚀 Creating database tables directly...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📄 Creating listings table...');
    
    // Create listings table
    const { error: listingsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (listingsError) {
      console.error('Error creating listings table:', listingsError);
    } else {
      console.log('✅ Listings table created successfully');
    }

    console.log('📄 Creating user_matches table...');
    
    // Create user_matches table (assuming profiles table exists from auth)
    const { error: matchesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (matchesError) {
      console.error('Error creating user_matches table:', matchesError);
    } else {
      console.log('✅ User_matches table created successfully');
    }

    console.log('\n🔍 Testing table creation...');
    
    // Test if tables were created
    const tables = ['listings', 'user_matches'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}':`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err);
      }
    }

    console.log('\n🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });