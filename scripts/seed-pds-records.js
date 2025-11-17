/**
 * Create PDS records for test users
 * Run with: node scripts/seed-pds-records.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const pdsTemplates = {
  'maria.santos.dev@gmail.com': {
    name: { first: 'Maria', middle: 'Cruz', last: 'Santos' },
    degree: 'Bachelor of Science in Information Technology',
    yearsExp: 4,
    skills: 'React, Node.js, JavaScript, TypeScript, Python, MongoDB, Git',
    eligibilities: []
  },
  'juan.delacruz.eng@gmail.com': {
    name: { first: 'Juan', middle: 'Pedro', last: 'Dela Cruz' },
    degree: 'Bachelor of Science in Civil Engineering',
    yearsExp: 6,
    skills: 'AutoCAD, Civil 3D, Structural Design, Project Management, Construction Planning',
    eligibilities: [{ title: 'Licensed Civil Engineer', rating: '88', date: '2017-08-15', place: 'Davao City', license: 'CE-98765', validity: '2030-12-31' }]
  },
  'ana.rodriguez.cpa@gmail.com': {
    name: { first: 'Ana', middle: 'Maria', last: 'Rodriguez' },
    degree: 'Bachelor of Science in Accountancy',
    yearsExp: 3,
    skills: 'Financial Reporting, Budget Management, QuickBooks, Excel, Tax Preparation, Auditing',
    eligibilities: [{ title: 'Certified Public Accountant (CPA)', rating: '90', date: '2019-05-10', place: 'Manila', license: 'CPA-123456', validity: '2030-12-31' }]
  },
  'pedro.martinez.hr@gmail.com': {
    name: { first: 'Pedro', middle: 'Luis', last: 'Martinez' },
    degree: 'Bachelor of Science in Psychology',
    yearsExp: 2,
    skills: 'Recruitment, Employee Relations, HR Policies, Training and Development, Conflict Resolution',
    eligibilities: []
  },
  'sofia.garcia.rn@gmail.com': {
    name: { first: 'Sofia', middle: 'Isabel', last: 'Garcia' },
    degree: 'Bachelor of Science in Nursing',
    yearsExp: 3,
    skills: 'Patient Care, First Aid, Health Assessment, Medical Documentation, Emergency Response',
    eligibilities: [{ title: 'Registered Nurse (RN) License', rating: '85', date: '2018-06-20', place: 'Davao City', license: 'RN-789012', validity: '2028-12-31' }]
  },
  'carlos.reyes.teach@gmail.com': {
    name: { first: 'Carlos', middle: 'Antonio', last: 'Reyes' },
    degree: 'Bachelor in Elementary Education',
    yearsExp: 2,
    skills: 'Lesson Planning, Classroom Management, Educational Assessment, Child Development',
    eligibilities: [{ title: 'Licensed Professional Teacher (LET)', rating: '87', date: '2019-09-15', place: 'Davao City', license: 'LET-345678', validity: '2029-12-31' }]
  },
  'isabel.fernandez.admin@gmail.com': {
    name: { first: 'Isabel', middle: 'Rosa', last: 'Fernandez' },
    degree: 'Bachelor of Arts in Communication',
    yearsExp: 1,
    skills: 'Microsoft Office, Document Management, Communication Skills, Scheduling, Data Entry',
    eligibilities: []
  },
  'miguel.torres.it@gmail.com': {
    name: { first: 'Miguel', middle: 'Angel', last: 'Torres' },
    degree: 'Bachelor of Science in Computer Science',
    yearsExp: 5,
    skills: 'Java, Python, SQL, React, Node.js, Docker, AWS',
    eligibilities: []
  },
  'carmen.lopez.nurse@gmail.com': {
    name: { first: 'Carmen', middle: 'Teresa', last: 'Lopez' },
    degree: 'Bachelor of Science in Nursing',
    yearsExp: 1,
    skills: 'Patient Care, Vital Signs Monitoring, Medical Documentation, First Aid',
    eligibilities: [{ title: 'Registered Nurse (RN) License', rating: '82', date: '2023-06-15', place: 'Davao City', license: 'RN-456789', validity: '2033-12-31' }]
  },
  'ricardo.sanchez.design@gmail.com': {
    name: { first: 'Ricardo', middle: 'Jose', last: 'Sanchez' },
    degree: 'Bachelor of Fine Arts',
    yearsExp: 3,
    skills: 'Adobe Photoshop, Adobe Illustrator, Adobe InDesign, Typography, Brand Design, UI/UX Design',
    eligibilities: []
  },
  'elena.morales.acct@gmail.com': {
    name: { first: 'Elena', middle: 'Victoria', last: 'Morales' },
    degree: 'Bachelor of Science in Accountancy',
    yearsExp: 1,
    skills: 'Bookkeeping, Financial Reporting, Excel, QuickBooks, Tax Preparation',
    eligibilities: []
  },
  'jose.rivera.civil@gmail.com': {
    name: { first: 'Jose', middle: 'Miguel', last: 'Rivera' },
    degree: 'Bachelor of Science in Civil Engineering',
    yearsExp: 4,
    skills: 'AutoCAD, Structural Design, Construction Planning, Project Management',
    eligibilities: [{ title: 'Licensed Civil Engineer', rating: '86', date: '2018-08-20', place: 'Manila', license: 'CE-654321', validity: '2030-12-31' }]
  },
  'lucia.gomez.teacher@gmail.com': {
    name: { first: 'Lucia', middle: 'Carmen', last: 'Gomez' },
    degree: 'Bachelor in Elementary Education',
    yearsExp: 1,
    skills: 'Lesson Planning, Classroom Management, Educational Assessment, Child Psychology',
    eligibilities: [{ title: 'Licensed Professional Teacher (LET)', rating: '84', date: '2023-09-10', place: 'Davao City', license: 'LET-567890', validity: '2033-12-31' }]
  },
  'antonio.diaz.web@gmail.com': {
    name: { first: 'Antonio', middle: 'Rafael', last: 'Diaz' },
    degree: 'Bachelor of Science in Information Technology',
    yearsExp: 2,
    skills: 'HTML, CSS, JavaScript, React, Node.js, Git',
    eligibilities: []
  },
  'patricia.castro.hr@gmail.com': {
    name: { first: 'Patricia', middle: 'Elena', last: 'Castro' },
    degree: 'Bachelor of Science in Human Resource Management',
    yearsExp: 4,
    skills: 'Recruitment, Employee Relations, HR Policies, Payroll Management, Training',
    eligibilities: []
  }
};

async function createPDSRecords() {
  console.log('🚀 Creating PDS records...\n');

  // Get user IDs
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', Object.keys(pdsTemplates));

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  let successCount = 0;

  for (const profile of profiles) {
    const template = pdsTemplates[profile.email];
    if (!template) continue;

    console.log(`Creating PDS for: ${template.name.first} ${template.name.last}`);

    // Generate work experience entries
    const workExperience = [];
    for (let i = 0; i < template.yearsExp; i++) {
      const yearStart = 2024 - template.yearsExp + i;
      workExperience.push({
        positionTitle: template.degree.includes('Engineering') ? `Engineer ${i + 1}` :
                       template.degree.includes('IT') || template.degree.includes('Computer') ? `Developer ${i + 1}` :
                       template.degree.includes('Nursing') ? `Nurse ${i + 1}` :
                       template.degree.includes('Education') ? `Teacher ${i + 1}` :
                       template.degree.includes('Accountancy') ? `Accountant ${i + 1}` :
                       `Officer ${i + 1}`,
        companyName: `Company ${String.fromCharCode(65 + i)}`,
        monthlySalary: 20000 + (i * 5000),
        salaryGrade: `SG-${10 + i}`,
        statusOfAppointment: 'Permanent',
        govtService: i % 2 === 0 ? 'Yes' : 'No',
        periodFrom: `${yearStart}-01-01`,
        periodTo: i === template.yearsExp - 1 ? 'Present' : `${yearStart}-12-31`
      });
    }

    const pdsData = {
      user_id: profile.id,
      personal_info: {
        surname: template.name.last,
        firstName: template.name.first,
        middleName: template.name.middle,
        dateOfBirth: '1995-05-15',
        placeOfBirth: 'Davao City',
        sex: Math.random() > 0.5 ? 'Male' : 'Female',
        civilStatus: 'Single',
        height: '165',
        weight: '60',
        bloodType: 'O',
        citizenship: 'Filipino',
        emailAddress: profile.email,
        mobileNo: '09171234567',
        residentialAddress: {
          houseNo: '123',
          street: 'Main Street',
          subdivision: 'Sample Village',
          barangay: 'Poblacion',
          city: 'Asuncion',
          province: 'Davao del Norte',
          zipCode: '8410'
        }
      },
      family_background: {
        spouse: null,
        father: { surname: template.name.last, firstName: 'Father', middleName: 'Test' },
        mother: { surname: 'Mother', firstName: 'Test', maidenName: 'Maiden' },
        children: []
      },
      educational_background: [
        {
          level: 'COLLEGE',
          schoolName: 'University of the Philippines',
          basicEdDegreeCourse: template.degree,
          periodFrom: '2013',
          periodTo: '2017',
          unitsEarned: 'N/A',
          yearGraduated: '2017',
          scholarshipHonors: 'None'
        },
        {
          level: 'SECONDARY',
          schoolName: 'Asuncion National High School',
          basicEdDegreeCourse: 'High School',
          periodFrom: '2009',
          periodTo: '2013',
          unitsEarned: 'N/A',
          yearGraduated: '2013',
          scholarshipHonors: 'None'
        }
      ],
      eligibility: template.eligibilities.map(elig => ({
        eligibilityTitle: elig.title,
        rating: elig.rating,
        dateOfExamConferment: elig.date,
        placeOfExamConferment: elig.place,
        licenseNumber: elig.license || null,
        licenseValidity: elig.validity || null
      })),
      work_experience: workExperience,
      voluntary_work: [],
      trainings: [],
      other_information: {
        skills: template.skills,
        nonAcademicRecognitions: 'None',
        membershipInOrganizations: 'None',
        governmentIssuedId: {
          idType: 'UMID',
          idNumber: 'UMID-' + Math.random().toString(36).substring(7).toUpperCase()
        },
        references: [
          { name: 'Reference One', address: 'Davao City', telephoneNo: '09171111111' },
          { name: 'Reference Two', address: 'Davao City', telephoneNo: '09172222222' },
          { name: 'Reference Three', address: 'Davao City', telephoneNo: '09173333333' }
        ],
        declaration: {
          sworn: true,
          dateAccomplished: '2025-10-30',
          signatureData: null
        }
      },
      completion_percentage: 100,
      is_completed: true
    };

    const { error: pdsError } = await supabase
      .from('applicant_pds')
      .insert(pdsData);

    if (pdsError) {
      console.error(`  ❌ Error: ${pdsError.message}`);
    } else {
      console.log(`  ✅ PDS created successfully`);
      successCount++;
    }
  }

  console.log(`\n✅ Created ${successCount}/${profiles.length} PDS records!`);
}

createPDSRecords().then(() => {
  console.log('\n🎉 PDS seed completed!');
}).catch(console.error);
