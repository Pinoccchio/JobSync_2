/**
 * Script to delete training applications for a specific user
 * Usage: node scripts/delete-training-application.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTrainingApplications() {
  const userEmail = 'janmikoguevarra@gmail.com';

  console.log(`🔍 Looking for user: ${userEmail}`);

  // 1. Find the user
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('email', userEmail)
    .single();

  if (userError || !user) {
    console.error('❌ User not found:', userError);
    return;
  }

  console.log('✅ Found user:', {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role
  });

  // 2. Find their training applications
  const { data: applications, error: appsError } = await supabase
    .from('training_applications')
    .select('id, program_id, status, submitted_at, training_programs(title)')
    .eq('applicant_id', user.id);

  if (appsError) {
    console.error('❌ Error fetching applications:', appsError);
    return;
  }

  if (!applications || applications.length === 0) {
    console.log('ℹ️  No training applications found for this user');
    return;
  }

  console.log(`\n📋 Found ${applications.length} training application(s):`);
  applications.forEach((app, index) => {
    console.log(`  ${index + 1}. ${app.training_programs?.title || 'Unknown'} - Status: ${app.status}`);
  });

  // 3. Delete the applications
  console.log('\n🗑️  Deleting training applications...');

  const { error: deleteError } = await supabase
    .from('training_applications')
    .delete()
    .eq('applicant_id', user.id);

  if (deleteError) {
    console.error('❌ Error deleting applications:', deleteError);
    return;
  }

  console.log('✅ Successfully deleted all training applications!');
  console.log(`\n🎉 User ${user.full_name} can now reapply to test the notification system!`);
}

// Run the script
deleteTrainingApplications()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
