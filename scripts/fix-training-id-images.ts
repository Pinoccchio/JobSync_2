/**
 * Fix Training Application ID Images
 * Updates existing training applications that have placeholder ID images
 * with real ID images from existing users in storage
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

/**
 * Get existing ID images from storage
 */
async function getExistingIdImages(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('id-images')
      .list();

    if (error) {
      console.error('❌ Error fetching ID images:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  No existing ID images found');
      return [];
    }

    const imagePaths = data
      .filter(file => file.name && !file.name.startsWith('.'))
      .map(file => file.name);

    return imagePaths;
  } catch (error) {
    console.error('❌ Error:', error);
    return [];
  }
}

/**
 * Update training applications with valid ID images
 */
async function updateApplicationIdImages(imagePaths: string[]) {
  try {
    // Get all training applications with test user applicants
    const { data: applications, error } = await supabaseAdmin
      .from('training_applications')
      .select('id, applicant_id, id_image_url, profiles!training_applications_applicant_id_fkey!inner(email)')
      .like('profiles.email', 'test.applicant.%@jobsync.test');

    if (error) {
      console.error('❌ Error fetching applications:', error);
      return;
    }

    if (!applications || applications.length === 0) {
      console.log('⚠️  No test applications found');
      return;
    }

    console.log(`\n📊 Found ${applications.length} test applications`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const app of applications) {
      // Check if application has placeholder or missing ID image
      const needsUpdate = !app.id_image_url ||
                          app.id_image_url.includes('test-id-') ||
                          app.id_image_url === 'null';

      if (!needsUpdate) {
        skippedCount++;
        continue;
      }

      // Randomly select an existing ID image
      const randomImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];

      // Update the application
      const { error: updateError } = await supabaseAdmin
        .from('training_applications')
        .update({
          id_image_url: randomImage,
          id_image_name: randomImage
        })
        .eq('id', app.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${app.id}:`, updateError.message);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`  ✅ Updated ${updatedCount}/${applications.length} applications...`);
        }
      }

      // Small delay every 50 updates
      if (updatedCount % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} applications`);
    console.log(`⏭️  Skipped ${skippedCount} applications (already have valid images)`);

  } catch (error) {
    console.error('❌ Error updating applications:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🔧 Fixing Training Application ID Images\n');
  console.log('='.repeat(60));

  const startTime = Date.now();

  // Step 1: Fetch existing ID images
  console.log('\n📋 Step 1: Fetching existing ID images from storage...');
  const imagePaths = await getExistingIdImages();

  if (imagePaths.length === 0) {
    console.log('\n❌ No existing ID images found in storage!');
    console.log('   Cannot fix applications without source images.\n');
    return;
  }

  console.log(`  ✅ Found ${imagePaths.length} existing ID images`);

  // Step 2: Update training applications
  console.log('\n📋 Step 2: Updating training applications...');
  await updateApplicationIdImages(imagePaths);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log(`\n⏱️  Total time: ${duration}s`);
  console.log('\n✨ Fix complete!\n');
  console.log('🎯 Next step: Visit PESO dashboard to verify no more "Object not found" errors\n');
}

// Execute
main().catch(console.error);
