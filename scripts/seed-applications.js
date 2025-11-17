/**
 * Create job applications for test users
 * Run with: node scripts/seed-applications.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define which applicants should apply to which jobs (based on qualifications)
const applicationMappings = {
  // IT/Software developers
  'maria.santos.dev@gmail.com': ['Software Developer', 'IT Assistant Technician'],
  'miguel.torres.it@gmail.com': ['Software Developer', 'IT Assistant Technician', 'Administrative Assistant'],
  'antonio.diaz.web@gmail.com': ['Software Developer', 'IT Assistant Technician'],

  // Civil Engineers
  'juan.delacruz.eng@gmail.com': ['Civil Engineer'],
  'jose.rivera.civil@gmail.com': ['Civil Engineer'],

  // Accountants
  'ana.rodriguez.cpa@gmail.com': ['Accountant'],
  'elena.morales.acct@gmail.com': ['Accountant', 'Administrative Assistant'],

  // HR Officers
  'pedro.martinez.hr@gmail.com': ['Human Resources Officer', 'Administrative Assistant'],
  'patricia.castro.hr@gmail.com': ['Human Resources Officer'],

  // Nurses
  'sofia.garcia.rn@gmail.com': ['Registered Nurse'],
  'carmen.lopez.nurse@gmail.com': ['Registered Nurse'],

  // Teachers
  'carlos.reyes.teach@gmail.com': ['Elementary School Teacher'],
  'lucia.gomez.teacher@gmail.com': ['Elementary School Teacher'],

  // Admin/Support
  'isabel.fernandez.admin@gmail.com': ['Administrative Assistant', 'Human Resources Officer'],

  // Designers
  'ricardo.sanchez.design@gmail.com': ['Graphic Designer', 'Administrative Assistant']
};

async function createApplications() {
  console.log('🚀 Creating job applications...\n');

  // Get all jobs
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('id, title');

  if (jobError) {
    console.error('Error fetching jobs:', jobError);
    return;
  }

  // Get all profiles with PDS
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  // Get all PDS records
  const { data: pdsRecords, error: pdsError } = await supabase
    .from('applicant_pds')
    .select('id, user_id');

  if (pdsError) {
    console.error('Error fetching PDS records:', pdsError);
    return;
  }

  const applications = [];
  let applicationCount = 0;

  for (const profile of profiles) {
    const jobTitles = applicationMappings[profile.email];
    if (!jobTitles) continue;

    const pds = pdsRecords.find(p => p.user_id === profile.id);
    if (!pds) {
      console.log(`⚠️  No PDS found for ${profile.email}`);
      continue;
    }

    console.log(`Processing ${profile.email}:`);

    for (const jobTitle of jobTitles) {
      const job = jobs.find(j => j.title === jobTitle);
      if (!job) {
        console.log(`  ⚠️  Job not found: ${jobTitle}`);
        continue;
      }

      applications.push({
        job_id: job.id,
        applicant_id: profile.id,
        applicant_profile_id: profile.id,
        pds_id: pds.id,
        pds_file_url: null,
        pds_file_name: null,
        status: 'pending',
        rank: null,
        match_score: null,
        education_score: null,
        experience_score: null,
        skills_score: null,
        eligibility_score: null,
        algorithm_used: null,
        ranking_reasoning: null,
        notification_sent: false
      });

      console.log(`  ✅ Applying to: ${jobTitle}`);
      applicationCount++;
    }
    console.log('');
  }

  // Insert all applications
  const { error: insertError } = await supabase
    .from('applications')
    .insert(applications);

  if (insertError) {
    console.error('❌ Error inserting applications:', insertError);
    return;
  }

  console.log(`\n✅ Created ${applicationCount} applications successfully!`);
  console.log(`\nSummary by job:`);

  // Count applications per job
  const jobCounts = {};
  for (const app of applications) {
    const job = jobs.find(j => j.id === app.job_id);
    if (job) {
      jobCounts[job.title] = (jobCounts[job.title] || 0) + 1;
    }
  }

  Object.entries(jobCounts).sort((a, b) => b[1] - a[1]).forEach(([jobTitle, count]) => {
    console.log(`  ${jobTitle}: ${count} applicants`);
  });
}

createApplications().then(() => {
  console.log('\n🎉 Applications seed completed!');
}).catch(console.error);
