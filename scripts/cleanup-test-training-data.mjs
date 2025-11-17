#!/usr/bin/env node

/**
 * Cleanup Test Training Data Script
 *
 * This script removes all training applications from the test account
 * janmikoguevarra@gmail.com to prepare the system for testing.
 *
 * Usage:
 *   node scripts/cleanup-test-training-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'janmikoguevarra@gmail.com';

async function cleanupTestTrainingData() {
  console.log('🧹 Starting cleanup of test training data...\n');

  try {
    // 1. Find the user profile for the test account
    console.log(`📧 Looking for user with email: ${TEST_EMAIL}`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', TEST_EMAIL)
      .single();

    if (profileError || !profile) {
      console.log('⚠️  Test user profile not found. Nothing to clean up.');
      return;
    }

    console.log(`✅ Found test user: ${profile.full_name} (${profile.id})\n`);

    // 2. Find all training applications for this user
    console.log('🔍 Finding training applications...');
    const { data: applications, error: appsError } = await supabase
      .from('training_applications')
      .select(`
        id,
        program_id,
        status,
        training_programs (
          title
        )
      `)
      .eq('applicant_id', profile.id);

    if (appsError) {
      console.error('❌ Error fetching training applications:', appsError);
      process.exit(1);
    }

    if (!applications || applications.length === 0) {
      console.log('✅ No training applications found for test user. Nothing to clean up.\n');
      return;
    }

    console.log(`📊 Found ${applications.length} training application(s):\n`);
    applications.forEach((app, index) => {
      console.log(`   ${index + 1}. ${app.training_programs?.title || 'Unknown Program'} - Status: ${app.status}`);
    });
    console.log('');

    // 3. Delete all training applications
    console.log('🗑️  Deleting training applications...');
    const { error: deleteError } = await supabase
      .from('training_applications')
      .delete()
      .eq('applicant_id', profile.id);

    if (deleteError) {
      console.error('❌ Error deleting training applications:', deleteError);
      process.exit(1);
    }

    console.log(`✅ Successfully deleted ${applications.length} training application(s)\n`);

    // 4. Optional: Delete related notifications
    console.log('🔔 Cleaning up related notifications...');
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', profile.id)
      .eq('type', 'training_status');

    if (notifError) {
      console.warn('⚠️  Warning: Could not delete notifications:', notifError.message);
    } else {
      console.log('✅ Notifications cleaned up\n');
    }

    // 5. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Cleanup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   User: ${profile.full_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Applications Removed: ${applications.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestTrainingData()
  .then(() => {
    console.log('👍 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
