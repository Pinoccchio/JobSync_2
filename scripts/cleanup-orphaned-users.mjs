import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOrphanedUsers() {
  console.log('🧹 Cleaning up orphaned auth users...\n');

  try {
    // Get all auth users without profiles
    const { data: orphanedUsers, error: queryError } = await supabase.rpc('get_orphaned_auth_users');

    // If the function doesn't exist, use direct query
    if (queryError) {
      console.log('Using direct query method...');

      // Get all auth user IDs
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        throw usersError;
      }

      // Get all profile IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) {
        throw profilesError;
      }

      const profileIds = new Set(profiles.map(p => p.id));
      const orphaned = users.filter(u => !profileIds.has(u.id));

      console.log(`Found ${orphaned.length} orphaned auth users\n`);

      let deletedCount = 0;
      for (const user of orphaned) {
        try {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

          if (!deleteError) {
            console.log(`✓ Deleted: ${user.email}`);
            deletedCount++;
          } else {
            console.error(`✗ Failed to delete ${user.email}: ${deleteError.message}`);
          }
        } catch (error) {
          console.error(`✗ Error deleting ${user.email}:`, error.message);
        }
      }

      console.log(`\n✅ Cleanup completed! Deleted ${deletedCount} orphaned users.`);
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
  }
}

cleanupOrphanedUsers();
