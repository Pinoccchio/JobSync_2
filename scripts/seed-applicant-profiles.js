/**
 * Create applicant_profiles from PDS data
 * Run with: node scripts/seed-applicant-profiles.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createApplicantProfiles() {
  console.log('🚀 Creating applicant profiles...\n');

  // Get all PDS records
  const { data: pdsRecords, error: pdsError } = await supabase
    .from('applicant_pds')
    .select('*');

  if (pdsError) {
    console.error('Error fetching PDS records:', pdsError);
    return;
  }

  let successCount = 0;

  for (const pds of pdsRecords) {
    const pi = pds.personal_info;
    const edu = pds.educational_background || [];
    const workExp = pds.work_experience || [];
    const eligibilities = pds.eligibility || [];
    const otherInfo = pds.other_information || {};

    // Extract highest education
    const collegeEdu = edu.find(e => e.level === 'COLLEGE');
    const highestEdu = collegeEdu?.basicEdDegreeCourse || 'Not specified';

    // Calculate total years of experience
    const totalYears = workExp.length || 0;

    // Extract skills array from string or array
    const skillsArray = Array.isArray(otherInfo.skills) ? otherInfo.skills :
                        (typeof otherInfo.skills === 'string' ? otherInfo.skills.split(',').map(s => s.trim()) : []);

    console.log(`Creating profile for: ${pi.firstName} ${pi.surname}`);

    const profileData = {
      id: pds.user_id,
      user_id: pds.user_id,
      surname: pi.surname,
      first_name: pi.firstName,
      middle_name: pi.middleName || '',
      date_of_birth: pi.dateOfBirth,
      place_of_birth: pi.placeOfBirth,
      sex: pi.sex,
      civil_status: pi.civilStatus,
      citizenship: pi.citizenship,
      height: parseFloat(pi.height) || 0,
      weight: parseFloat(pi.weight) || 0,
      blood_type: pi.bloodType,
      residential_address: `${pi.residentialAddress?.houseNo || ''} ${pi.residentialAddress?.street || ''}, ${pi.residentialAddress?.barangay || ''}, ${pi.residentialAddress?.city || ''}`,
      permanent_address: `${pi.residentialAddress?.houseNo || ''} ${pi.residentialAddress?.street || ''}, ${pi.residentialAddress?.barangay || ''}, ${pi.residentialAddress?.city || ''}`,
      phone_number: pi.telephoneNo || '',
      mobile_number: pi.mobileNo,
      education: edu,
      work_experience: workExp,
      eligibilities: eligibilities,
      skills: skillsArray,
      trainings_attended: pds.trainings || [],
      total_years_experience: totalYears,
      highest_educational_attainment: highestEdu,
      ocr_processed: false,
      ai_processed: false,
      extraction_confidence: 100,
      extraction_date: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('applicant_profiles')
      .insert(profileData);

    if (insertError) {
      console.error(`  ❌ Error: ${insertError.message}`);
    } else {
      console.log(`  ✅ Profile created`);
      successCount++;
    }
  }

  console.log(`\n✅ Created ${successCount}/${pdsRecords.length} applicant profiles!`);
}

createApplicantProfiles().then(() => {
  console.log('\n🎉 Applicant profiles seed completed!');
}).catch(console.error);
