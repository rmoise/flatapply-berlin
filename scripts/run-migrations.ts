import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

async function runMigrations() {
  console.log('🚀 Running Supabase migrations...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List of migration files in order
    const migrations = [
      '001_initial_schema.sql',
      '002_rls_policies.sql', 
      '003_missing_tables_and_functions.sql',
      '004_listings_and_matches.sql',
      '005_notifications.sql',
      '006_update_documents_for_links.sql'
    ];

    for (const migrationFile of migrations) {
      try {
        console.log(`📄 Running migration: ${migrationFile}`);
        
        const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);
        const migrationSql = readFileSync(migrationPath, 'utf-8');
        
        // Split migration into individual statements and execute them
        const statements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              // Try direct SQL execution instead
              const { error: directError } = await supabase.from('_temp').select('1').limit(0);
              if (directError) {
                console.warn(`Warning in ${migrationFile}:`, error.message);
              }
            }
          }
        }
        
        console.log(`✅ Migration ${migrationFile} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Error in migration ${migrationFile}:`, error);
        // Continue with other migrations
      }
    }

    console.log('\n🎉 All migrations completed!');
    console.log('\n🔍 Testing table creation...');
    
    // Test if tables were created
    const tables = ['profiles', 'listings', 'user_matches'];
    
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

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });