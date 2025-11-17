/**
 * Test the Gemini AI ranking system
 * Run with: node scripts/test-ranking.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzE0MjAsImV4cCI6MjA3NjcwNzQyMH0.ET0F9mwoDInHJBFD78_YEVTrQd1_LRWYKD_gPkc6AGQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRanking() {
  console.log('🚀 Testing Gemini AI Ranking System...\n');

  // Get all jobs
  const { data: jobs, error: jobsError} = await supabase
    .from('jobs')
    .select('id, title');

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return;
  }

  console.log(`Found ${jobs.length} jobs:\n`);
  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
  });

  // Select a job with applications (Software Developer has 3 applicants)
  const softwareDevJob = jobs.find(j => j.title === 'Software Developer');

  if (!softwareDevJob) {
    console.log('\n❌ Software Developer job not found');
    return;
  }

  console.log(`\n🎯 Testing ranking for: ${softwareDevJob.title}`);
  console.log(`Job ID: ${softwareDevJob.id}\n`);

  // Call the ranking API
  console.log('Calling ranking API...');

  const response = await fetch(`http://localhost:3004/api/jobs/${softwareDevJob.id}/rank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers.get('content-type'));

  const result = await response.json();
  console.log('Full API response:', JSON.stringify(result, null, 2));

  if (!response.ok) {
    console.error('❌ Ranking failed:', result);
    return;
  }

  console.log('\n✅ Ranking completed!\n');
  console.log('Results:');
  console.log('='.repeat(80));
  console.log(`Job: ${result.jobTitle}`);
  console.log(`Total Applicants: ${result.totalApplicants}\n`);

  result.rankings.forEach((ranking, index) => {
    console.log(`${index + 1}. ${ranking.applicantName}`);
    console.log(`   Match Score: ${ranking.matchScore.toFixed(2)}%`);
    console.log(`   Algorithm: ${ranking.algorithm}`);
    console.log('');
  });

  // Fetch detailed rankings
  console.log('\nFetching detailed rankings...');

  const detailResponse = await fetch(`http://localhost:3004/api/jobs/${softwareDevJob.id}/rank`);
  const detailResult = await detailResponse.json();

  if (detailResponse.ok && detailResult.applications.length > 0) {
    console.log('\nDetailed Breakdown:');
    console.log('='.repeat(80));

    detailResult.applications.slice(0, 3).forEach(app => {
      const profile = app.applicant_profiles;
      console.log(`\nRank #${app.rank}: ${profile.first_name} ${profile.surname}`);
      console.log(`Overall Match: ${app.match_score?.toFixed(2)}%`);
      console.log(`├─ Education: ${app.education_score?.toFixed(2)}% (${profile.highest_educational_attainment})`);
      console.log(`├─ Experience: ${app.experience_score?.toFixed(2)}% (${profile.total_years_experience} years)`);
      console.log(`├─ Skills: ${app.skills_score?.toFixed(2)}%`);
      console.log(`└─ Eligibility: ${app.eligibility_score?.toFixed(2)}%`);
      console.log(`Algorithm: ${app.algorithm_used}`);
      console.log(`Reasoning: ${app.ranking_reasoning?.substring(0, 200)}...`);
    });
  }

  console.log('\n🎉 Test completed!');
}

testRanking().catch(console.error);
