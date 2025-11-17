/**
 * Script to revert accidental certification
 * Usage: node scripts/revert-certification.js
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

async function revertCertification() {
  const userEmail = 'janmikoguevarra@gmail.com';
  const applicationId = '10848442-828b-4642-a0d4-6ba2c89c0c64';

  console.log(`🔍 Reverting certification for: ${userEmail}`);

  // 1. Get current application data
  const { data: application, error: fetchError } = await supabase
    .from('training_applications')
    .select('id, full_name, status, certificate_url, certificate_issued_at')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    console.error('❌ Application not found:', fetchError);
    return;
  }

  console.log('📋 Current Status:', {
    status: application.status,
    certificate_url: application.certificate_url,
    certificate_issued_at: application.certificate_issued_at,
  });

  // 2. Delete certificate from storage if exists
  if (application.certificate_url) {
    console.log(`🗑️  Deleting certificate from storage: ${application.certificate_url}`);

    const { error: deleteError } = await supabase.storage
      .from('certificates')
      .remove([application.certificate_url]);

    if (deleteError) {
      console.warn('⚠️  Warning: Could not delete certificate file:', deleteError.message);
      console.log('   (File may not exist or already deleted)');
    } else {
      console.log('✅ Certificate file deleted from storage');
    }
  }

  // 3. Update application back to "completed" status
  console.log('🔄 Reverting status from "certified" → "completed"...');

  const { data: updated, error: updateError } = await supabase
    .from('training_applications')
    .update({
      status: 'completed',
      certificate_url: null,
      certificate_issued_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('id, full_name, status, certificate_url')
    .single();

  if (updateError) {
    console.error('❌ Error updating application:', updateError);
    return;
  }

  console.log('✅ Application reverted successfully!');
  console.log('📋 New Status:', {
    status: updated.status,
    certificate_url: updated.certificate_url,
  });

  console.log(`\n🎉 ${application.full_name} is now back to "completed" status and ready for proper certificate generation!`);
}

// Run the script
revertCertification()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
