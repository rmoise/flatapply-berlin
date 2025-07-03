import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function createTestUser() {
  console.log('🚀 Creating test user...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Create a test user
    const email = 'test@flatapply.com';
    const password = 'testpass123';

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the email
    });

    if (error) {
      console.error('❌ Error creating user:', error);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\nYou can now login at http://localhost:3000/login');

    // Create default preferences for the user
    if (data.user) {
      const { error: prefError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: data.user.id,
          min_rent: 800,
          max_rent: 1500,
          min_rooms: 1,
          max_rooms: 3,
          preferred_districts: ['mitte', 'friedrichshain', 'kreuzberg'],
          is_active: true
        });

      if (!prefError) {
        console.log('✅ Default preferences created');
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });