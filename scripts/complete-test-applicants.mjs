import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Education levels
const educationLevels = [
  "Bachelor's Degree in Computer Science",
  "Bachelor's Degree in Information Technology",
  "Bachelor's Degree in Accountancy",
  "Bachelor's Degree in Business Administration",
  "Bachelor's Degree in Engineering",
  "Master's Degree in Computer Science"
];

async function completeTestApplicants() {
  console.log('🔧 Completing PDS and Applications for test applicants...\n');

  try {
    // 1. Get all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('status', 'active');

    if (jobsError) throw jobsError;
    console.log(`✅ Found ${jobs.length} active jobs\n`);

    // 2. Get all test profile IDs
    const { data: testProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .or('email.like.%.dev%@%,email.like.%.tech%@%,email.like.%.eng%@%,email.like.%.cpa%@%,email.like.%.admin%@%,email.like.%.hr%@%,email.like.%.it%@%,email.like.%.pro%@%,email.like.%.cs%@%,email.like.%.biz%@%');

    if (profilesError) throw profilesError;

    const testUserIds = testProfiles.map(p => p.id);
    console.log(`Found ${testUserIds.length} test profiles\n`);

    // 3. Get applicant_profiles for test users
    const { data: testApplicants, error: applicantsError } = await supabase
      .from('applicant_profiles')
      .select('id, user_id, surname, first_name, education, work_experience, eligibilities, skills, total_years_experience, highest_educational_attainment')
      .in('user_id', testUserIds);

    if (applicantsError) throw applicantsError;
    console.log(`Found ${testApplicants.length} test applicants\n`);

    let completedCount = 0;
    let errorCount = 0;

    for (const applicant of testApplicants) {
      try {
        console.log(`Processing: ${applicant.first_name} ${applicant.surname}`);

        // Create PDS
        const pdsData = {
          user_id: applicant.user_id,
          personal_info: {
            surname: applicant.surname,
            firstName: applicant.first_name,
            middleName: 'M.',
            nameExtension: '',
            dateOfBirth: `1990-05-15`,
            placeOfBirth: 'Davao del Norte, Philippines',
            sex: 'Male',
            civilStatus: 'Single',
            height: '1.70',
            weight: '65',
            bloodType: 'O',
            citizenship: 'Filipino',
            residentialAddress: {
              houseBlockLotNo: '123',
              street: 'Main Street',
              barangay: 'Asuncion',
              cityMunicipality: 'Davao del Norte',
              province: 'Davao del Norte',
              zipCode: '8105'
            },
            permanentAddress: {
              houseBlockLotNo: '123',
              street: 'Main Street',
              barangay: 'Asuncion',
              cityMunicipality: 'Davao del Norte',
              province: 'Davao del Norte',
              zipCode: '8105'
            },
            telephoneNo: '(02) 8123-4567',
            mobileNo: '+639123456789'
          },
          family_background: {
            fatherInfo: { surname: applicant.surname, firstName: 'Father', middleName: 'F.' },
            motherInfo: { surname: 'Mother', firstName: 'Mother', middleName: 'M.' },
            children: []
          },
          educational_background: applicant.education,
          eligibility: applicant.eligibilities,
          work_experience: applicant.work_experience,
          voluntary_work: [],
          trainings: [],
          other_information: {
            skills: applicant.skills.map(skill => ({ skillName: skill })),
            recognition: [],
            membership: [],
            declaration: {
              governmentId: 'Valid ID',
              issuedAt: 'Davao del Norte',
              issuedOn: new Date().toISOString().split('T')[0],
              personAdministering: 'N/A',
              signatureUrl: null,
              signatureUploadedAt: null,
              rightThumbMark: null
            },
            questions: {
              question34a: false, question34b: false, question35a: false, question35b: false,
              question36: false, question37: false, question38a: false, question38b: false,
              question39: false, question40a: false, question40b: false, question40c: false
            },
            references: []
          },
          completion_percentage: 100,
          is_completed: true
        };

        const { data: pdsRecord, error: pdsError } = await supabase
          .from('applicant_pds')
          .insert(pdsData)
          .select('id')
          .single();

        if (pdsError) {
          console.error(`  ❌ PDS error: ${pdsError.message}`);
          errorCount++;
          continue;
        }
        console.log(`  ✓ PDS created`);

        // Apply to 2-3 random jobs
        const numApplications = Math.floor(Math.random() * 2) + 2;
        const selectedJobs = jobs.sort(() => 0.5 - Math.random()).slice(0, numApplications);

        for (const job of selectedJobs) {
          const { error: appError } = await supabase
            .from('applications')
            .insert({
              job_id: job.id,
              applicant_id: applicant.user_id,
              applicant_profile_id: applicant.id,
              pds_id: pdsRecord.id,
              status: 'pending',
              notification_sent: false
            });

          if (!appError) {
            console.log(`  ✓ Applied to: ${job.title}`);
          }
        }

        completedCount++;

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Completion successful!`);
    console.log(`   Completed: ${completedCount} applicants`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

completeTestApplicants();
