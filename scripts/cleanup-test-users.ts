/**
 * Cleanup Test Users
 * Removes all test users and their associated data
 * Deletes users matching pattern: test.applicant.*@jobsync.test
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface TestUser {
  id: string;
  email: string;
  full_name: string;
}

/**
 * Get all test users
 */
async function getTestUsers(): Promise<TestUser[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .like('email', 'test.applicant.%@jobsync.test');

  if (error) {
    console.error('❌ Error fetching test users:', error);
    return [];
  }

  return data as TestUser[];
}

/**
 * Delete a single user and all associated data
 */
async function deleteUser(user: TestUser, index: number, total: number): Promise<boolean> {
  try {
    console.log(`  [${index}/${total}] Deleting ${user.email}...`);

    // Delete auth user (cascades to profile and related data via FK constraints)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      // Handle "user not found" gracefully (already deleted)
      if (authError.message.includes('User not found') ||
          authError.message.includes('Database error loading user')) {
        console.log(`    ⚠️  Auth user not found, cleaning up orphaned data...`);

        // Clean up orphaned profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileError && !profileError.message.includes('No rows found')) {
          console.error(`    ❌ Profile cleanup failed: ${profileError.message}`);
          return false;
        }

        console.log(`    ✅ Orphaned data cleaned`);
        return true;
      }

      console.error(`    ❌ Failed: ${authError.message}`);
      return false;
    }

    console.log(`    ✅ Deleted`);
    return true;

  } catch (error) {
    console.error(`    ❌ Error:`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n🧹 Starting cleanup: Test Users\n');
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Step 1: Fetch test users
  console.log('\n📋 Fetching test users...');
  const users = await getTestUsers();
  console.log(`  ✅ Found ${users.length} test users to delete`);

  if (users.length === 0) {
    console.log('\n✨ No test users found. Database is clean!\n');
    return;
  }

  // Step 2: Confirm deletion
  console.log('\n⚠️  WARNING: This will permanently delete:');
  console.log(`  • ${users.length} test user accounts`);
  console.log(`  • All associated profiles`);
  console.log(`  • All PDS records`);
  console.log(`  • All job applications`);
  console.log(`  • All training applications`);
  console.log(`  • All notifications`);
  console.log('\n  Note: Audit trail and activity logs are preserved.\n');

  console.log('📧 Sample users to be deleted:');
  users.slice(0, 5).forEach(user => {
    console.log(`  - ${user.email} (${user.full_name})`);
  });
  if (users.length > 5) {
    console.log(`  ... and ${users.length - 5} more`);
  }

  console.log('\n🔄 Starting deletion...\n');

  // Step 3: Delete users
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < users.length; i++) {
    const success = await deleteUser(users[i], i + 1, users.length);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between deletions
    if (i < users.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`  ✅ Successfully deleted: ${successCount}/${users.length} users`);
  console.log(`  ❌ Failed: ${failCount}/${users.length} users`);
  console.log(`  ⏱️  Total time: ${duration}s`);

  console.log('\n✨ Cleanup complete!\n');

  if (failCount > 0) {
    console.log('⚠️  Some deletions failed. You may need to run this script again.\n');
  }
}

// Execute
main().catch(console.error);
