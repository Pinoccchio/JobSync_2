/**
 * Seed Training Applications
 * Enrolls all test users into active and upcoming training programs
 * Creates ~2,400 pending training applications for comprehensive testing
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { generatePhilippineAddress } from './filipino-test-data';

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
  phone: string;
}

interface TrainingProgram {
  id: string;
  title: string;
  status: string;
}

/**
 * Get all test users
 */
async function getTestUsers(): Promise<TestUser[]> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, phone')
    .like('email', 'test.applicant.%@jobsync.test')
    .eq('role', 'APPLICANT')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Error fetching test users:', error);
    return [];
  }

  return data as TestUser[];
}

/**
 * Get all active and upcoming training programs
 */
async function getActiveTrainingPrograms(): Promise<TrainingProgram[]> {
  const { data, error } = await supabaseAdmin
    .from('training_programs')
    .select('id, title, status')
    .in('status', ['active', 'upcoming']);

  if (error) {
    console.error('❌ Error fetching training programs:', error);
    return [];
  }

  return data as TrainingProgram[];
}

/**
 * Get existing ID images from storage to use for test data
 */
async function getExistingIdImages(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('id-images')
      .list();

    if (error) {
      console.warn('⚠️  Could not fetch existing ID images:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  No existing ID images found in storage');
      return [];
    }

    // Return full paths (without bucket name, just the file path)
    const imagePaths = data
      .filter(file => file.name && !file.name.startsWith('.')) // Filter out hidden files
      .map(file => file.name);

    console.log(`  ✅ Found ${imagePaths.length} existing ID images to use`);
    return imagePaths;

  } catch (error) {
    console.error('❌ Error fetching ID images:', error);
    return [];
  }
}

/**
 * Create training application for a user-program pair
 */
async function createTrainingApplication(
  user: TestUser,
  program: TrainingProgram,
  index: number,
  total: number,
  existingIdImages: string[]
): Promise<boolean> {
  try {
    const address = generatePhilippineAddress();

    // Check if application already exists
    const { data: existing } = await supabaseAdmin
      .from('training_applications')
      .select('id')
      .eq('program_id', program.id)
      .eq('applicant_id', user.id)
      .single();

    if (existing) {
      console.log(`  ⏭️  [${index}/${total}] Already exists: ${user.full_name} → ${program.title}`);
      return true;
    }

    // Get highest education from user (simplified)
    const educationLevels = [
      'High School Graduate',
      'College Graduate',
      'College Level',
      'Vocational Graduate',
      'Masters Degree'
    ];

    const education = educationLevels[Math.floor(Math.random() * educationLevels.length)];

    // Create initial status history
    const statusHistory = [{
      from: null,
      to: 'pending',
      changed_at: new Date().toISOString(),
      changed_by: user.id,
      notes: 'Application submitted'
    }];

    // Select a random existing ID image, or set to null if none available
    let idImageUrl = null;
    let idImageName = null;

    if (existingIdImages.length > 0) {
      const randomImage = existingIdImages[Math.floor(Math.random() * existingIdImages.length)];
      idImageUrl = randomImage;
      idImageName = randomImage;
    }

    // Insert training application
    const { error } = await supabaseAdmin
      .from('training_applications')
      .insert({
        program_id: program.id,
        applicant_id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '+63 917 123 4567',
        address: address.fullAddress,
        highest_education: education,
        id_image_url: idImageUrl,
        id_image_name: idImageName,
        status: 'pending',
        status_history: statusHistory,
        notification_sent: false,
        submitted_at: new Date().toISOString()
      });

    if (error) {
      console.error(`  ❌ [${index}/${total}] Failed: ${error.message}`);
      return false;
    }

    console.log(`  ✅ [${index}/${total}] ${user.email} → ${program.title}`);
    return true;

  } catch (error) {
    console.error(`  ❌ Error creating application:`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n🚀 Starting seed: Training Applications\n');
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Step 1: Fetch test users
  console.log('\n📋 Fetching test users...');
  const users = await getTestUsers();
  console.log(`  ✅ Found ${users.length} test users`);

  if (users.length === 0) {
    console.log('\n⚠️  No test users found! Please run seed-50-complete-users.ts first.\n');
    return;
  }

  // Step 2: Fetch training programs
  console.log('\n📋 Fetching active/upcoming training programs...');
  const programs = await getActiveTrainingPrograms();
  console.log(`  ✅ Found ${programs.length} active/upcoming programs`);

  if (programs.length === 0) {
    console.log('\n⚠️  No active/upcoming training programs found!\n');
    return;
  }

  // Step 3: Fetch existing ID images from storage
  console.log('\n📋 Fetching existing ID images from storage...');
  const existingIdImages = await getExistingIdImages();

  if (existingIdImages.length > 0) {
    console.log(`  ✅ Will use ${existingIdImages.length} existing ID images for test data`);
  } else {
    console.log(`  ⚠️  No existing ID images found - applications will have null ID images`);
  }

  // Step 4: Calculate total applications
  const totalApplications = users.length * programs.length;
  console.log(`\n📊 Will create ${totalApplications} training applications`);
  console.log(`  (${users.length} users × ${programs.length} programs)\n`);

  // Step 5: Create applications
  console.log('🔄 Creating applications...\n');

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  let currentIndex = 0;

  for (const user of users) {
    for (const program of programs) {
      currentIndex++;
      const success = await createTrainingApplication(user, program, currentIndex, totalApplications, existingIdImages);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid overwhelming the server
      if (currentIndex % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`  ✅ Successfully created: ${successCount}/${totalApplications} applications`);
  console.log(`  ❌ Failed: ${failCount}/${totalApplications} applications`);
  console.log(`  ⏱️  Total time: ${duration}s`);
  console.log(`  📧 All applications in PENDING status`);
  console.log(`  👥 ${users.length} users enrolled`);
  console.log(`  🎓 ${programs.length} programs`);

  console.log('\n🎯 Next steps:');
  console.log('  1. Test PESO dashboard with bulk applications');
  console.log('  2. Test bulk approval/denial workflows');
  console.log('  3. Test attendance marking');
  console.log('  4. Test certificate generation\n');

  console.log('✨ Training applications seed complete!\n');
}

// Execute
main().catch(console.error);
