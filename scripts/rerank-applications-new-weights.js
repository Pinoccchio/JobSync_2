/**
 * Re-rank Applications Script
 *
 * This script re-ranks all existing applications using the updated algorithm weights:
 * - Algorithm 1: Education 30%, Eligibility 30%, Skills 20%, Experience 20%
 * - Algorithm 2: Composite 30%, Education 35%, Eligibility 35%
 * - Experience formula changed to 3-tier system based on job requirement
 *
 * Run this after updating algorithm weights to ensure all rankings are consistent.
 *
 * Usage:
 *   node scripts/rerank-applications-new-weights.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rerankApplications() {
  console.log('🔄 Starting re-ranking process...\n');

  try {
    // Step 1: Fetch all jobs with active applications
    console.log('📊 Fetching jobs with applications...');
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .in('status', ['active', 'hidden']);

    if (jobsError) throw jobsError;

    console.log(`✓ Found ${jobs.length} jobs\n`);

    let totalApplicationsReranked = 0;
    let totalJobsProcessed = 0;

    // Step 2: Process each job
    for (const job of jobs) {
      console.log(`📌 Processing job: "${job.title}" (${job.id})`);

      // Fetch applications for this job
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .not('status', 'eq', 'withdrawn');

      if (appsError) {
        console.error(`  ❌ Error fetching applications: ${appsError.message}`);
        continue;
      }

      if (applications.length === 0) {
        console.log(`  ℹ️  No applications found\n`);
        continue;
      }

      console.log(`  Found ${applications.length} application(s)`);

      // Step 3: Trigger re-ranking via API
      try {
        const response = await fetch(`${supabaseUrl.replace('.supabase.co', '')}/api/jobs/${job.id}/rank`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`  ❌ Re-ranking failed: ${errorData.error || response.statusText}`);
          continue;
        }

        const result = await response.json();
        console.log(`  ✓ Re-ranked ${result.applicationsRanked || applications.length} application(s)`);

        totalApplicationsReranked += result.applicationsRanked || applications.length;
        totalJobsProcessed++;
      } catch (apiError) {
        console.error(`  ❌ API call failed: ${apiError.message}`);
        console.log(`  ℹ️  Note: Make sure the development server is running (npm run dev)`);
      }

      console.log('');
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 RE-RANKING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Jobs processed:         ${totalJobsProcessed}/${jobs.length}`);
    console.log(`✓ Applications re-ranked: ${totalApplicationsReranked}`);
    console.log('\n✅ Re-ranking completed successfully!\n');

    console.log('📝 Changes applied:');
    console.log('  • Algorithm 1: Education 30%, Eligibility 30%, Skills 20%, Experience 20%');
    console.log('  • Algorithm 2: Composite 30%, Education 35%, Eligibility 35%');
    console.log('  • Experience: 3-tier system (100%, 66.7%, 33.3%) based on job requirement');
    console.log('\n💡 Next steps:');
    console.log('  1. Verify rankings in the HR dashboard');
    console.log('  2. Check activity logs for audit trail');
    console.log('  3. Notify HR team of updated rankings\n');

  } catch (error) {
    console.error('\n❌ Fatal error during re-ranking:');
    console.error(error);
    process.exit(1);
  }
}

// Alternative: Direct database re-ranking (if API is not available)
async function directDatabaseRerank() {
  console.log('🔄 Starting direct database re-ranking...');
  console.log('⚠️  Warning: This requires the ranking logic to be available server-side\n');

  try {
    // Fetch all applications grouped by job
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        jobs!inner(
          id,
          title,
          degree_requirement,
          eligibilities,
          skills,
          years_of_experience
        ),
        applicant_pds!inner(
          educational_background,
          eligibility,
          work_experience,
          other_information
        )
      `)
      .not('status', 'eq', 'withdrawn');

    if (error) throw error;

    console.log(`✓ Found ${applications.length} applications to re-rank\n`);
    console.log('ℹ️  This method requires implementing the ranking algorithms in this script.');
    console.log('ℹ️  Recommended approach: Use the API-based method above instead.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Main execution
console.log('\n' + '='.repeat(60));
console.log('🎯 JobSync - Application Re-ranking Script');
console.log('='.repeat(60));
console.log('Updated Algorithm Weights:');
console.log('  Algorithm 1: Education 30%, Eligibility 30%, Skills 20%, Experience 20%');
console.log('  Algorithm 2: Composite 30%, Education 35%, Eligibility 35%');
console.log('  Experience Formula: 3-tier system based on job requirement');
console.log('='.repeat(60) + '\n');

// Check if --direct flag is provided
const useDirect = process.argv.includes('--direct');

if (useDirect) {
  directDatabaseRerank();
} else {
  rerankApplications();
}
