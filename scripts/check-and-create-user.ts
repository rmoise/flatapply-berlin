import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function checkAndCreateUser() {
  console.log('🔍 Checking for test user...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const email = 'test@flatapply.com';
    const password = 'testpass123';

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);

    if (existingUser) {
      console.log('✅ User already exists');
      console.log('User ID:', existingUser.id);
      
      // Update the password to ensure it's correct
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );
      
      if (!updateError) {
        console.log('✅ Password reset to: testpass123');
      }
    } else {
      // Create new user
      console.log('Creating new user...');
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) {
        console.error('❌ Error creating user:', error);
        return;
      }

      console.log('✅ New user created');
      console.log('User ID:', data.user?.id);
    }

    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\nYou can now login at http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });