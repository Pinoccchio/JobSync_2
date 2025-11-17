import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteTestApplicants() {
  console.log('🗑️  Deleting all test applicants...\n');

  try {
    // Get all test applicant profiles
    const { data: testProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .or('email.like.%.dev%@%,email.like.%.tech%@%,email.like.%.eng%@%,email.like.%.cpa%@%,email.like.%.admin%@%,email.like.%.hr%@%,email.like.%.it%@%,email.like.%.pro%@%,email.like.%.cs%@%,email.like.%.biz%@%');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Found ${testProfiles.length} test applicants to delete\n`);

    let deletedCount = 0;
    for (const profile of testProfiles) {
      try {
        console.log(`Deleting: ${profile.email}`);

        // Delete auth user (will cascade to profile via trigger/foreign key)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id);

        if (!deleteError) {
          console.log(`  ✓ Deleted`);
          deletedCount++;
        } else {
          console.error(`  ✗ Failed: ${deleteError.message}`);
        }
      } catch (error) {
        console.error(`  ✗ Error:`, error.message);
      }
    }

    console.log(`\n✅ Deletion completed! Deleted ${deletedCount} test applicants.`);

  } catch (error) {
    console.error('❌ Fatal error during deletion:', error);
  }
}

deleteTestApplicants();
