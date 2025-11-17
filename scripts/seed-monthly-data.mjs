import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Statuses with realistic distribution
const statuses = [
  { value: 'pending', weight: 30 },
  { value: 'under_review', weight: 20 },
  { value: 'shortlisted', weight: 15 },
  { value: 'interviewed', weight: 10 },
  { value: 'approved', weight: 8 },
  { value: 'hired', weight: 5 },
  { value: 'denied', weight: 10 },
  { value: 'withdrawn', weight: 2 },
];

const getRandomStatus = () => {
  const total = statuses.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * total;

  for (const status of statuses) {
    random -= status.weight;
    if (random <= 0) return status.value;
  }
  return 'pending';
};

const getRandomDate = (month, year) => {
  const day = Math.floor(Math.random() * 28) + 1; // Safe for all months
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return new Date(year, month, day, hour, minute);
};

async function seedMonthlyData() {
  console.log('🌱 Seeding historical monthly data for charts...\n');

  try {
    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title');

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      console.error('❌ No jobs found. Please create jobs first.');
      process.exit(1);
    }

    console.log(`✅ Found ${jobs.length} jobs\n`);

    // Get unique applicant IDs from existing applications
    const { data: existingApps, error: appsError } = await supabase
      .from('applications')
      .select('applicant_id, job_id');

    if (appsError) throw appsError;
    if (!existingApps || existingApps.length === 0) {
      console.error('❌ No existing applications found. Please create some applications first.');
      process.exit(1);
    }

    // Extract unique applicant IDs
    const uniqueApplicantIds = [...new Set(existingApps.map(app => app.applicant_id))];
    console.log(`✅ Found ${uniqueApplicantIds.length} unique applicants from ${existingApps.length} existing applications\n`);

    // Track existing job-applicant combinations to avoid duplicates
    const existingCombinations = new Set(
      existingApps.map(app => `${app.applicant_id}:${app.job_id}`)
    );

    console.log(`📋 Tracking ${existingCombinations.size} existing job-applicant combinations to avoid duplicates\n`);

    // Generate data for last 6 months (May - October 2025)
    const monthsData = [
      { month: 4, year: 2025, count: 15, label: 'May 2025' },      // May (month 4)
      { month: 5, year: 2025, count: 22, label: 'June 2025' },     // June
      { month: 6, year: 2025, count: 28, label: 'July 2025' },     // July
      { month: 7, year: 2025, count: 35, label: 'August 2025' },   // August
      { month: 8, year: 2025, count: 45, label: 'September 2025' }, // September
      { month: 9, year: 2025, count: 68, label: 'October 2025' },  // October
    ];

    let totalInserted = 0;

    for (const monthData of monthsData) {
      console.log(`📅 Processing ${monthData.label}...`);

      const applications = [];

      // Try to create unique combinations with retry logic
      let attempts = 0;
      const maxAttempts = monthData.count * 10; // Allow more attempts to find unique combinations

      while (applications.length < monthData.count && attempts < maxAttempts) {
        attempts++;

        const randomApplicantId = uniqueApplicantIds[Math.floor(Math.random() * uniqueApplicantIds.length)];
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        const combinationKey = `${randomApplicantId}:${randomJob.id}`;

        // Check if this combination already exists
        if (!existingCombinations.has(combinationKey)) {
          const createdAt = getRandomDate(monthData.month, monthData.year);

          applications.push({
            applicant_id: randomApplicantId,
            job_id: randomJob.id,
            status: getRandomStatus(),
            created_at: createdAt.toISOString(),
            updated_at: createdAt.toISOString(),
          });

          // Mark this combination as used
          existingCombinations.add(combinationKey);
        }
      }

      if (applications.length < monthData.count) {
        console.log(`   ⚠️  Could only generate ${applications.length}/${monthData.count} unique combinations`);
      }

      // Skip if no applications to insert
      if (applications.length === 0) {
        console.log(`   ⏭️  Skipping ${monthData.label} - no unique combinations available\n`);
        continue;
      }

      // Insert in batches
      const { data, error } = await supabase
        .from('applications')
        .insert(applications);

      if (error) {
        console.error(`❌ Error inserting ${monthData.label}:`, error);
        continue;
      }

      totalInserted += monthData.count;
      console.log(`   ✅ Inserted ${monthData.count} applications\n`);
    }

    console.log('━'.repeat(50));
    console.log(`\n🎉 Success! Seeded ${totalInserted} historical applications`);
    console.log(`📊 Charts will now show data from May - November 2025\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

seedMonthlyData();
