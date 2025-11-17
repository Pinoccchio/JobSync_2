/**
 * Script to run digital signature support migration
 * Usage: node scripts/run-signature-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting digital signature support migration...\n');

  try {
    // Step 1: Add signature_url column to profiles
    console.log('📝 Step 1: Adding signature_url column to profiles table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS signature_url TEXT;

        COMMENT ON COLUMN profiles.signature_url IS 'Storage path to officer digital signature image (used for training certificates)';
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      throw alterError;
    }
    console.log('✅ Column added successfully\n');

    // Step 2: Create officer-signatures bucket
    console.log('📦 Step 2: Creating officer-signatures storage bucket...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets.some(bucket => bucket.id === 'officer-signatures');

    if (bucketExists) {
      console.log('✅ Bucket already exists\n');
    } else {
      const { error: createBucketError } = await supabase.storage.createBucket('officer-signatures', {
        public: false,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
      });

      if (createBucketError) {
        console.error('❌ Error creating bucket:', createBucketError);
        throw createBucketError;
      }
      console.log('✅ Bucket created successfully\n');
    }

    // Step 3: Information about RLS policies (manual step)
    console.log('⚠️  Step 3: RLS Policies Setup Required');
    console.log('Please run the following SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('---');

    const sqlFilePath = path.join(__dirname, 'migrations', 'add-signature-support.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Extract only the RLS policy section
    const rlsPolicies = sqlContent.split('-- =====================================================')[3];
    console.log(rlsPolicies);
    console.log('---\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✓ Added signature_url column to profiles table');
    console.log('  ✓ Created officer-signatures storage bucket');
    console.log('  ⚠  RLS policies need to be set up manually (see above)');

    console.log('\n🎉 Done! PESO officers can now upload their digital signatures.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
