/**
 * Script to re-rank all jobs with enhanced scoring algorithms
 * Verifies that no two applicants have identical match scores
 */

const jobIds = [
  { id: '89e56509-7720-4a66-acc6-2bc676ddd0f2', title: 'Administrative Aide IV (Clerk II)' },
  { id: '828a934e-0cae-4b9f-8ed1-d5a4f1a9677e', title: 'Human Resources Assistant' },
  { id: '5c5595b6-4288-4cee-b75f-72deb26c6b8b', title: 'Human Resource Assistant' },
  { id: 'feeeb800-31f2-429d-8039-4c472bc2fc12', title: 'Accountant' },
  { id: '64e048d4-bfdc-4b16-91e9-1868ded53752', title: 'Administrative Assistant' },
  { id: '61480ab2-be43-4a6f-a8fb-0ea434b20ff2', title: 'Registered Nurse' },
  { id: 'fb2d5b07-fb37-4d30-803d-de4b5c34f356', title: 'IT Assistant Technician' },
  { id: '6ded684f-281f-408b-99a6-ae76b8d9a555', title: 'Civil Engineer' },
  { id: 'bd8f4585-e65d-4d55-9cca-6e231cc523a5', title: 'Graphic Designer' },
];

async function rerankAllJobs() {
  console.log('🚀 Starting re-ranking of all jobs with enhanced algorithms...\n');

  const results = [];

  for (const job of jobIds) {
    console.log(`\n📋 Re-ranking: ${job.title}`);
    console.log(`   Job ID: ${job.id}`);

    try {
      const response = await fetch(`http://localhost:3001/api/jobs/${job.id}/rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log(`   ✅ Success! Ranked ${data.totalApplicants} applicants`);

        // Check for identical scores
        const scores = data.rankings.map(r => r.matchScore);
        const uniqueScores = new Set(scores);
        const hasDuplicates = scores.length !== uniqueScores.size;

        if (hasDuplicates) {
          console.log(`   ⚠️  WARNING: Found identical scores!`);

          // Find and display duplicates
          const scoreCounts = {};
          scores.forEach(score => {
            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
          });

          Object.entries(scoreCounts).forEach(([score, count]) => {
            if (count > 1) {
              console.log(`      - ${count} applicants with ${score}% score`);
            }
          });
        } else {
          console.log(`   ✨ Perfect! All ${scores.length} applicants have unique scores`);
        }

        results.push({
          job: job.title,
          totalApplicants: data.totalApplicants,
          hasDuplicates,
          scores: scores.sort((a, b) => b - a),
        });
      } else {
        console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
        results.push({
          job: job.title,
          error: data.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        job: job.title,
        error: error.message,
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RE-RANKING SUMMARY REPORT');
  console.log('='.repeat(80));

  const successfulJobs = results.filter(r => !r.error);
  const jobsWithDuplicates = successfulJobs.filter(r => r.hasDuplicates);
  const jobsWithUniqueScores = successfulJobs.filter(r => !r.hasDuplicates);

  console.log(`\n✅ Successfully re-ranked: ${successfulJobs.length}/${jobIds.length} jobs`);
  console.log(`✨ Jobs with unique scores: ${jobsWithUniqueScores.length}/${successfulJobs.length}`);
  console.log(`⚠️  Jobs with duplicate scores: ${jobsWithDuplicates.length}/${successfulJobs.length}`);

  if (jobsWithDuplicates.length > 0) {
    console.log('\n⚠️  JOBS WITH DUPLICATE SCORES:');
    jobsWithDuplicates.forEach(result => {
      console.log(`\n   ${result.job} (${result.totalApplicants} applicants)`);
      const scoreCounts = {};
      result.scores.forEach(score => {
        scoreCounts[score] = (scoreCounts[score] || 0) + 1;
      });
      Object.entries(scoreCounts)
        .filter(([_, count]) => count > 1)
        .forEach(([score, count]) => {
          console.log(`      - ${count} applicants: ${score}%`);
        });
    });
  }

  if (jobsWithUniqueScores.length > 0) {
    console.log('\n✨ JOBS WITH ALL UNIQUE SCORES:');
    jobsWithUniqueScores.forEach(result => {
      console.log(`   ✓ ${result.job} (${result.totalApplicants} applicants)`);
    });
  }

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(result => {
      console.log(`   ✗ ${result.job}: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Re-ranking complete!\n');

  return results;
}

// Run the script
rerankAllJobs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
