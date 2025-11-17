/**
 * Seed Users Script
 *
 * Creates test users for the user management system
 * Run with: node scripts/seed-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Seed data definitions
const TEST_USERS = [
  // 1 Additional ADMIN (for testing admin restrictions)
  {
    email: 'admin.test@jobsync.gov',
    password: 'Admin123!@#',
    fullName: 'Admin Test User',
    role: 'ADMIN',
    phone: '+63 917 123 4567',
    status: 'active'
  },

  // 2 HR Users
  {
    email: 'hr.active@jobsync.gov',
    password: 'HRActive123!',
    fullName: 'Maria Santos',
    role: 'HR',
    phone: '+63 917 234 5678',
    status: 'active'
  },
  {
    email: 'hr.inactive@jobsync.gov',
    password: 'HRInactive123!',
    fullName: 'Juan Reyes',
    role: 'HR',
    phone: '+63 917 345 6789',
    status: 'inactive'
  },

  // 2 PESO Users
  {
    email: 'peso.active@jobsync.gov',
    password: 'PESOActive123!',
    fullName: 'Rosa Garcia',
    role: 'PESO',
    phone: '+63 917 456 7890',
    status: 'active'
  },
  {
    email: 'peso.inactive@jobsync.gov',
    password: 'PESOInactive123!',
    fullName: 'Pedro Cruz',
    role: 'PESO',
    phone: '+63 917 567 8901',
    status: 'inactive'
  },

  // 5 APPLICANT Users
  {
    email: 'applicant1@example.com',
    password: 'Applicant123!',
    fullName: 'Ana Dela Cruz',
    role: 'APPLICANT',
    phone: '+63 917 678 9012',
    status: 'active'
  },
  {
    email: 'applicant2@example.com',
    password: 'Applicant123!',
    fullName: 'Carlos Mendoza',
    role: 'APPLICANT',
    phone: '+63 917 789 0123',
    status: 'active'
  },
  {
    email: 'applicant3@example.com',
    password: 'Applicant123!',
    fullName: 'Elena Fernandez',
    role: 'APPLICANT',
    phone: '+63 917 890 1234',
    status: 'active'
  },
  {
    email: 'applicant4@example.com',
    password: 'Applicant123!',
    fullName: 'Roberto Tan',
    role: 'APPLICANT',
    phone: null,
    status: 'inactive'
  },
  {
    email: 'applicant5@example.com',
    password: 'Applicant123!',
    fullName: 'Sofia Lim',
    role: 'APPLICANT',
    phone: '+63 917 012 3456',
    status: 'active'
  },
];

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n');

  const createdUsers = [];
  const errors = [];
  const skipped = [];

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${userData.email} - already exists`);
        skipped.push(userData.email);
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName,
          role: userData.role,
        },
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user returned from auth.createUser');
      }

      console.log(`   Created auth user for ${userData.email}`);

      // Wait for trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Update profile with additional data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          phone: userData.phone,
          status: userData.status,
          role: userData.role,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.warn(`   Warning: Could not update profile for ${userData.email}: ${updateError.message}`);
      }

      // Log the creation activity
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'jenjiliv@gmail.com')
        .single();

      if (adminUser) {
        await supabase.rpc('log_admin_create_user', {
          p_admin_id: adminUser.id,
          p_created_user_id: authData.user.id,
          p_created_user_email: userData.email,
          p_created_user_role: userData.role
        });
      }

      createdUsers.push({
        email: userData.email,
        role: userData.role,
        status: userData.status,
        id: authData.user.id
      });

      console.log(`✅ Successfully created: ${userData.fullName} (${userData.email}) [${userData.role}]`);
    } catch (error) {
      console.error(`❌ Failed to create ${userData.email}:`, error.message);
      errors.push({
        email: userData.email,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${createdUsers.length} users`);
  console.log(`⏭️  Skipped: ${skipped.length} users (already exist)`);
  console.log(`❌ Errors:  ${errors.length} users`);
  console.log('='.repeat(60));

  if (createdUsers.length > 0) {
    console.log('\n📝 Created Users:');
    createdUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role}) [${u.status}]`);
    });
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => {
      console.log(`   - ${e.email}: ${e.error}`);
    });
  }

  console.log('\n✨ Seeding complete!\n');
}

// Run the seeding
seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Fatal error during seeding:', error);
    process.exit(1);
  });
