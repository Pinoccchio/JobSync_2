const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function revertCertificate() {
  const email = 'janmikoguevarra@gmail.com';

  console.log(`\n🔍 Finding application for ${email}...\n`);

  // 1. Find the application
  const { data: application, error: findError } = await supabase
    .from('training_applications')
    .select('id, email, full_name, status, certificate_url, certificate_issued_at, status_history, applicant_id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !application) {
    console.error('❌ Error finding application:', findError);
    return;
  }

  console.log('✅ Found application:');
  console.log(`   ID: ${application.id}`);
  console.log(`   Name: ${application.full_name}`);
  console.log(`   Current Status: ${application.status}`);
  console.log(`   Certificate URL: ${application.certificate_url || 'None'}`);
  console.log(`   Certificate Issued: ${application.certificate_issued_at || 'None'}`);

  if (application.status !== 'certified') {
    console.log(`\n⚠️  Application is not certified (status: ${application.status}). Nothing to revert.`);
    return;
  }

  // 2. Delete certificate from storage if exists
  if (application.certificate_url) {
    console.log(`\n🗑️  Deleting certificate from storage: ${application.certificate_url}...`);

    const { error: deleteError } = await supabase
      .storage
      .from('certificates')
      .remove([application.certificate_url]);

    if (deleteError) {
      console.error('   ⚠️  Warning - Could not delete certificate:', deleteError.message);
    } else {
      console.log('   ✅ Certificate deleted from storage');
    }
  }

  // 3. Remove 'certified' entry from status_history
  const statusHistory = application.status_history || [];
  const updatedHistory = statusHistory.filter(entry => entry.to !== 'certified');

  console.log(`\n📝 Reverting application status...`);
  console.log(`   Removing ${statusHistory.length - updatedHistory.length} status history entry(ies)`);

  // 4. Update application
  const { data: updated, error: updateError } = await supabase
    .from('training_applications')
    .update({
      status: 'completed',
      certificate_url: null,
      certificate_issued_at: null,
      status_history: updatedHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', application.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating application:', updateError);
    return;
  }

  console.log('\n✅ Application reverted successfully!');
  console.log(`   New Status: ${updated.status}`);
  console.log(`   Certificate URL: ${updated.certificate_url || 'None'}`);
  console.log(`   Certificate Issued: ${updated.certificate_issued_at || 'None'}`);
  console.log(`\n✨ You can now test certificate generation again!\n`);
}

revertCertificate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
