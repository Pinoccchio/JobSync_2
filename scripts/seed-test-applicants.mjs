import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Realistic Filipino names
const firstNames = [
  'Maria', 'Juan', 'Ana', 'Jose', 'Sofia', 'Miguel', 'Isabella', 'Carlos', 'Gabriela', 'Luis',
  'Valentina', 'Diego', 'Camila', 'Santiago', 'Elena', 'Rafael', 'Victoria', 'Manuel', 'Carmen', 'Pedro',
  'Rosa', 'Fernando', 'Gloria', 'Ricardo', 'Teresa', 'Antonio', 'Patricia', 'Francisco', 'Laura', 'Andres',
  'Diana', 'Roberto', 'Beatriz', 'Jorge', 'Cecilia', 'Enrique', 'Mariana', 'Alberto', 'Claudia', 'Raul',
  'Natalia', 'Javier', 'Sandra', 'Oscar', 'Monica', 'Felipe', 'Angela', 'Alejandro', 'Christina', 'Marcos'
];

const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Gonzales', 'Rodriguez', 'Fernandez', 'Lopez',
  'Martinez', 'Ramos', 'Flores', 'Torres', 'Rivera', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Dela Cruz',
  'Aquino', 'Villanueva', 'Castro', 'Del Rosario', 'Pascual', 'Santiago', 'Tolentino', 'Francisco', 'Mercado', 'Diaz',
  'Aguilar', 'Alvarez', 'Guerrero', 'Herrera', 'Morales', 'Jimenez', 'Castillo', 'Romero', 'Gutierrez', 'Navarro',
  'Domingo', 'Marquez', 'Velasco', 'Medina', 'Ortega', 'Ruiz', 'Silva', 'Vargas', 'Moreno', 'Suarez'
];

const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
const specialties = ['dev', 'tech', 'eng', 'cpa', 'admin', 'hr', 'it', 'pro', 'cs', 'biz'];

// Education levels
const educationLevels = [
  { level: "Bachelor's Degree in Computer Science", schools: ["University of the Philippines", "Ateneo de Manila", "De La Salle University", "UST"] },
  { level: "Bachelor's Degree in Information Technology", schools: ["Polytechnic University of the Philippines", "FEU Institute of Technology", "TIP Manila", "STI College"] },
  { level: "Bachelor's Degree in Accountancy", schools: ["University of Santo Tomas", "San Beda University", "Mapua University", "Adamson University"] },
  { level: "Bachelor's Degree in Business Administration", schools: ["Asian Institute of Management", "University of Asia and the Pacific", "Miriam College", "Saint Louis University"] },
  { level: "Bachelor's Degree in Engineering", schools: ["Mapua University", "DLSU Manila", "UP Diliman", "TIP Quezon City"] },
  { level: "Master's Degree in Computer Science", schools: ["UP Diliman", "Ateneo de Manila", "DLSU Manila", "ADMU"] },
];

// Skills pool
const techSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'PHP', 'C#', 'TypeScript', 'Vue.js'];
const businessSkills = ['Microsoft Excel', 'SAP', 'QuickBooks', 'Financial Analysis', 'Project Management', 'Data Analysis'];
const generalSkills = ['Communication', 'Leadership', 'Problem Solving', 'Time Management', 'Teamwork'];

// Eligibilities pool
const eligibilities = [
  'Career Service Professional',
  'Career Service Sub-Professional',
  'Licensed Professional Teacher',
  'Certified Public Accountant',
  'Licensed Civil Engineer',
  'Registered Electrical Engineer',
  'Bar Passer',
  'RA 1080',
  'PBET Passer'
];

// Generate unique email
function generateEmail(firstName, lastName, index) {
  const specialty = specialties[index % specialties.length];
  const domain = emailDomains[index % emailDomains.length];
  const normalizedFirst = firstName.toLowerCase().replace(/\s+/g, '');
  const normalizedLast = lastName.toLowerCase().replace(/\s+/g, '');

  return `${normalizedFirst}.${normalizedLast}.${specialty}${index}@${domain}`;
}

// Generate random skills
function generateSkills(count, includeBusinessSkills = false) {
  const skillPool = [...techSkills, ...generalSkills];
  if (includeBusinessSkills) skillPool.push(...businessSkills);

  const shuffled = skillPool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate work experience
function generateWorkExperience(years) {
  const positions = [
    'Software Developer', 'IT Support Specialist', 'Web Developer', 'Systems Analyst',
    'Database Administrator', 'Network Administrator', 'Accountant', 'HR Specialist',
    'Administrative Assistant', 'Project Coordinator', 'Business Analyst', 'Data Analyst'
  ];

  const companies = [
    'Accenture Philippines', 'IBM Philippines', 'Concentrix', 'PLDT Inc.',
    'Globe Telecom', 'SM Investments', 'Ayala Corporation', 'Jollibee Foods Corp',
    'BDO Unibank', 'MetroBank', 'San Miguel Corporation', 'Manila Water Company'
  ];

  const experiences = [];
  let currentYear = new Date().getFullYear();
  let remainingYears = years;

  while (remainingYears > 0) {
    const jobYears = Math.min(Math.floor(Math.random() * 3) + 1, remainingYears);
    const endYear = currentYear;
    const startYear = endYear - jobYears;

    experiences.push({
      positionTitle: positions[Math.floor(Math.random() * positions.length)],
      companyName: companies[Math.floor(Math.random() * companies.length)],
      monthlySalary: Math.floor(Math.random() * 30000) + 20000,
      salaryGrade: `SG-${Math.floor(Math.random() * 10) + 10}`,
      appointmentStatus: 'Permanent',
      isGovernmentService: Math.random() > 0.5 ? 'Yes' : 'No',
      inclusiveDatesFrom: `${startYear}-01-15`,
      inclusiveDatesTo: `${endYear}-12-31`,
    });

    remainingYears -= jobYears;
    currentYear = startYear - 1;
  }

  return experiences;
}

// Generate educational background
function generateEducation(level) {
  const educationData = educationLevels.find(e => e.level === level);
  const school = educationData.schools[Math.floor(Math.random() * educationData.schools.length)];
  const graduationYear = 2015 + Math.floor(Math.random() * 9);

  return [
    {
      level: 'Elementary',
      schoolName: 'Asuncion Elementary School',
      basicEducationDegreeCourse: 'Elementary Education',
      periodOfAttendanceFrom: '2000',
      periodOfAttendanceTo: '2006',
      highestLevelUnitsEarned: 'Completed',
      yearGraduated: '2006',
      scholarshipHonors: 'N/A'
    },
    {
      level: 'Secondary',
      schoolName: 'Asuncion National High School',
      basicEducationDegreeCourse: 'Secondary Education',
      periodOfAttendanceFrom: '2006',
      periodOfAttendanceTo: '2010',
      highestLevelUnitsEarned: 'Completed',
      yearGraduated: '2010',
      scholarshipHonors: 'N/A'
    },
    {
      level: 'College',
      schoolName: school,
      basicEducationDegreeCourse: level,
      periodOfAttendanceFrom: String(graduationYear - 4),
      periodOfAttendanceTo: String(graduationYear),
      highestLevelUnitsEarned: 'Completed',
      yearGraduated: String(graduationYear),
      scholarshipHonors: Math.random() > 0.7 ? 'Dean\'s Lister' : 'N/A'
    }
  ];
}

// Generate eligibilities
function generateEligibilities(count) {
  const shuffled = eligibilities.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(title => ({
    eligibilityTitle: title,
    rating: String(Math.floor(Math.random() * 20) + 80),
    dateOfExamConferment: `${2015 + Math.floor(Math.random() * 8)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
    placeOfExamConferment: 'Manila, Philippines',
    licenseNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
    licenseValidityDate: `${2025 + Math.floor(Math.random() * 5)}-12-31`
  }));
}

// Main seeding function
async function seedTestApplicants() {
  console.log('🌱 Starting test applicant seeding...\n');

  try {
    // 1. Fetch all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, degree_requirement, eligibilities, skills, years_of_experience')
      .eq('status', 'active');

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      console.error('❌ No active jobs found. Please create jobs first.');
      return;
    }

    console.log(`✅ Found ${jobs.length} active jobs\n`);

    // 2. Generate 50 applicants
    const applicantCount = 50;
    let createdCount = 0;
    let errorCount = 0;

    for (let i = 0; i < applicantCount; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const email = generateEmail(firstName, lastName, i);
      const password = 'Test@1234';

      try {
        console.log(`\n[${i + 1}/${applicantCount}] Creating: ${firstName} ${lastName} (${email})`);

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`
          }
        });

        if (authError) {
          console.error(`  ❌ Auth error: ${authError.message}`);
          errorCount++;
          continue;
        }

        const userId = authData.user.id;
        console.log(`  ✓ Auth user created: ${userId}`);

        // Update profile (already created by trigger) to set role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'APPLICANT',
            status: 'active'
          })
          .eq('id', userId);

        if (profileError) {
          console.error(`  ❌ Profile error: ${profileError.message}`);
          errorCount++;
          continue;
        }
        console.log(`  ✓ Profile updated`);

        // Generate applicant data
        const educationLevel = educationLevels[i % educationLevels.length].level;
        const yearsOfExperience = Math.floor(Math.random() * 8) + 2; // 2-10 years
        const educationData = generateEducation(educationLevel);
        const workExperienceData = generateWorkExperience(yearsOfExperience);
        const skillsData = generateSkills(Math.floor(Math.random() * 5) + 3, i % 3 === 0); // 3-8 skills
        const eligibilitiesData = generateEligibilities(Math.floor(Math.random() * 2) + 1); // 1-3 eligibilities

        // Create applicant_profiles
        const { data: applicantProfile, error: applicantProfileError } = await supabase
          .from('applicant_profiles')
          .insert({
            user_id: userId,
            surname: lastName,
            first_name: firstName,
            middle_name: 'M.',
            phone_number: `(02) 8${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            mobile_number: `+639${Math.floor(Math.random() * 900000000) + 100000000}`,
            education: educationData,
            work_experience: workExperienceData,
            eligibilities: eligibilitiesData,
            skills: skillsData,
            total_years_experience: yearsOfExperience,
            highest_educational_attainment: educationLevel,
            ocr_processed: false,
            ai_processed: false
          })
          .select('id')
          .single();

        if (applicantProfileError) {
          console.error(`  ❌ Applicant profile error: ${applicantProfileError.message}`);
          errorCount++;
          continue;
        }
        console.log(`  ✓ Applicant profile created`);

        // Create complete PDS
        const pdsData = {
          user_id: userId,
          personal_info: {
            surname: lastName,
            firstName: firstName,
            middleName: 'M.',
            nameExtension: '',
            dateOfBirth: `${1985 + Math.floor(Math.random() * 15)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            placeOfBirth: 'Davao del Norte, Philippines',
            sex: i % 2 === 0 ? 'Male' : 'Female',
            civilStatus: ['Single', 'Married', 'Widowed'][Math.floor(Math.random() * 3)],
            height: String((1.5 + Math.random() * 0.3).toFixed(2)),
            weight: String(Math.floor(Math.random() * 30) + 50),
            bloodType: ['A', 'B', 'AB', 'O'][Math.floor(Math.random() * 4)],
            gsisIdNo: '',
            pagibigIdNo: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            philhealthNo: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            sssNo: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            tinNo: `${Math.floor(Math.random() * 900000000) + 100000000}`,
            agencyEmployeeNo: '',
            citizenship: 'Filipino',
            residentialAddress: {
              houseBlockLotNo: `${Math.floor(Math.random() * 500) + 1}`,
              street: 'Main Street',
              subdivision: 'Barangay Asuncion',
              barangay: 'Asuncion',
              cityMunicipality: 'Davao del Norte',
              province: 'Davao del Norte',
              zipCode: '8105'
            },
            permanentAddress: {
              houseBlockLotNo: `${Math.floor(Math.random() * 500) + 1}`,
              street: 'Main Street',
              subdivision: 'Barangay Asuncion',
              barangay: 'Asuncion',
              cityMunicipality: 'Davao del Norte',
              province: 'Davao del Norte',
              zipCode: '8105'
            },
            telephoneNo: `(02) 8${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            mobileNo: `+639${Math.floor(Math.random() * 900000000) + 100000000}`
          },
          family_background: {
            spouseInfo: i % 3 === 0 ? {
              surname: lastNames[Math.floor(Math.random() * lastNames.length)],
              firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
              middleName: 'S.',
              nameExtension: '',
              occupation: 'Private Employee',
              employerBusinessName: 'XYZ Corporation',
              businessAddress: 'Davao City',
              telephoneNo: '(082) 123-4567'
            } : null,
            fatherInfo: {
              surname: lastName,
              firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
              middleName: 'F.',
              nameExtension: 'Sr.'
            },
            motherInfo: {
              surname: lastNames[Math.floor(Math.random() * lastNames.length)],
              firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
              middleName: 'M.'
            },
            children: []
          },
          educational_background: educationData,
          eligibility: eligibilitiesData,
          work_experience: workExperienceData,
          voluntary_work: [],
          learning_and_development: [],
          other_information: {
            skills: skillsData.map(skill => ({ skillName: skill })),
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
              question34a: false,
              question34b: false,
              question35a: false,
              question35b: false,
              question36: false,
              question37: false,
              question38a: false,
              question38b: false,
              question39: false,
              question40a: false,
              question40b: false,
              question40c: false
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
        console.log(`  ✓ PDS created (100% complete)`);

        // Apply to 2-3 random jobs
        const numApplications = Math.floor(Math.random() * 2) + 2; // 2-3 applications
        const selectedJobs = jobs.sort(() => 0.5 - Math.random()).slice(0, numApplications);

        for (const job of selectedJobs) {
          const { error: appError } = await supabase
            .from('applications')
            .insert({
              job_id: job.id,
              applicant_id: userId,
              applicant_profile_id: applicantProfile.id,
              pds_id: pdsRecord.id,
              status: 'pending',
              notification_sent: false
            });

          if (!appError) {
            console.log(`  ✓ Applied to: ${job.title}`);
          }
        }

        createdCount++;

      } catch (error) {
        console.error(`  ❌ Unexpected error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Seeding completed!`);
    console.log(`   Successfully created: ${createdCount} applicants`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
  }
}

// Run the seeding
seedTestApplicants();
