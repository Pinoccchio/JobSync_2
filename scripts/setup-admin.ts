/**
 * Setup Script: Create Admin User
 *
 * This script creates the system administrator account in Supabase.
 * Run once during initial setup: npx tsx scripts/setup-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupAdmin() {
  console.log('🚀 JobSync Admin Setup');
  console.log('====================\n');

  const adminEmail = 'jenjiliv@gmail.com';
  const adminPassword = 'adminadmin';

  try {
    // Check if admin already exists
    console.log('📋 Checking for existing admin user...');
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('email', adminEmail)
      .single();

    if (existingProfile) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', existingProfile.email);
      console.log('Role:', existingProfile.role);
      console.log('\nYou can now login with:');
      console.log('Email: jenjiliv@gmail.com');
      console.log('Password: adminadmin');
      return;
    }

    // Create admin user
    console.log('👤 Creating admin user in Supabase Auth...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'ADMIN',
      },
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Wait a moment for the trigger to create the profile
    console.log('⏳ Waiting for profile creation trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('⚠️  Profile check failed:', profileError.message);
      console.log('The auth user was created, but profile verification failed.');
      console.log('The profile should have been created automatically by the trigger.');
    } else {
      console.log('✅ Profile created:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   Name:', profile.full_name);
    }

    // Log the activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: authData.user.id,
      event_type: 'Admin Account Created',
      event_category: 'user_management',
      user_email: adminEmail,
      user_role: 'ADMIN',
      details: 'System administrator account created during initial setup',
      status: 'success',
    });

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📝 Login Credentials:');
    console.log('====================');
    console.log('Email:    jenjiliv@gmail.com');
    console.log('Password: adminadmin');
    console.log('\n🔗 Login at: http://localhost:3000/login');
    console.log('   Select "ADMIN" from the role dropdown');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

setupAdmin();
