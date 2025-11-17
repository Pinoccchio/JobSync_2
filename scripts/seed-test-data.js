/**
 * Seed script to populate JobSync database with test data
 * Run with: node scripts/seed-test-data.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testApplicants = [
  {
    email: 'maria.santos.dev@gmail.com',
    password: 'Test123!',
    full_name: 'Maria Santos',
    pds: {
      degree: 'Bachelor of Science in Information Technology',
      yearsOfExperience: 4,
      skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'MongoDB', 'Git'],
      eligibilities: ['None']
    }
  },
  {
    email: 'juan.delacruz.eng@gmail.com',
    password: 'Test123!',
    full_name: 'Juan Dela Cruz',
    pds: {
      degree: 'Bachelor of Science in Civil Engineering',
      yearsOfExperience: 6,
      skills: ['AutoCAD', 'Civil 3D', 'Structural Design', 'Project Management', 'Construction Planning'],
      eligibilities: ['Licensed Civil Engineer']
    }
  },
  {
    email: 'ana.rodriguez.cpa@gmail.com',
    password: 'Test123!',
    full_name: 'Ana Rodriguez',
    pds: {
      degree: 'Bachelor of Science in Accountancy',
      yearsOfExperience: 3,
      skills: ['Financial Reporting', 'Budget Management', 'QuickBooks', 'Excel', 'Tax Preparation', 'Auditing'],
      eligibilities: ['Certified Public Accountant (CPA)']
    }
  },
  {
    email: 'pedro.martinez.hr@gmail.com',
    password: 'Test123!',
    full_name: 'Pedro Martinez',
    pds: {
      degree: 'Bachelor of Science in Psychology',
      yearsOfExperience: 2,
      skills: ['Recruitment', 'Employee Relations', 'HR Policies', 'Training and Development', 'Conflict Resolution'],
      eligibilities: ['None']
    }
  },
  {
    email: 'sofia.garcia.rn@gmail.com',
    password: 'Test123!',
    full_name: 'Sofia Garcia',
    pds: {
      degree: 'Bachelor of Science in Nursing',
      yearsOfExperience: 3,
      skills: ['Patient Care', 'First Aid', 'Health Assessment', 'Medical Documentation', 'Emergency Response'],
      eligibilities: ['Registered Nurse (RN) License']
    }
  },
  {
    email: 'carlos.reyes.teach@gmail.com',
    password: 'Test123!',
    full_name: 'Carlos Reyes',
    pds: {
      degree: 'Bachelor in Elementary Education',
      yearsOfExperience: 2,
      skills: ['Lesson Planning', 'Classroom Management', 'Educational Assessment', 'Child Development'],
      eligibilities: ['Licensed Professional Teacher (LET)']
    }
  },
  {
    email: 'isabel.fernandez.admin@gmail.com',
    password: 'Test123!',
    full_name: 'Isabel Fernandez',
    pds: {
      degree: 'Bachelor of Arts in Communication',
      yearsOfExperience: 1,
      skills: ['Microsoft Office', 'Document Management', 'Communication Skills', 'Scheduling', 'Data Entry'],
      eligibilities: ['None']
    }
  },
  {
    email: 'miguel.torres.it@gmail.com',
    password: 'Test123!',
    full_name: 'Miguel Torres',
    pds: {
      degree: 'Bachelor of Science in Computer Science',
      yearsOfExperience: 5,
      skills: ['Java', 'Python', 'SQL', 'React', 'Node.js', 'Docker', 'AWS'],
      eligibilities: ['None']
    }
  },
  {
    email: 'carmen.lopez.nurse@gmail.com',
    password: 'Test123!',
    full_name: 'Carmen Lopez',
    pds: {
      degree: 'Bachelor of Science in Nursing',
      yearsOfExperience: 1,
      skills: ['Patient Care', 'Vital Signs Monitoring', 'Medical Documentation', 'First Aid'],
      eligibilities: ['Registered Nurse (RN) License']
    }
  },
  {
    email: 'ricardo.sanchez.design@gmail.com',
    password: 'Test123!',
    full_name: 'Ricardo Sanchez',
    pds: {
      degree: 'Bachelor of Fine Arts',
      yearsOfExperience: 3,
      skills: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Typography', 'Brand Design', 'UI/UX Design'],
      eligibilities: ['None']
    }
  },
  {
    email: 'elena.morales.acct@gmail.com',
    password: 'Test123!',
    full_name: 'Elena Morales',
    pds: {
      degree: 'Bachelor of Science in Accountancy',
      yearsOfExperience: 1,
      skills: ['Bookkeeping', 'Financial Reporting', 'Excel', 'QuickBooks', 'Tax Preparation'],
      eligibilities: ['None']
    }
  },
  {
    email: 'jose.rivera.civil@gmail.com',
    password: 'Test123!',
    full_name: 'Jose Rivera',
    pds: {
      degree: 'Bachelor of Science in Civil Engineering',
      yearsOfExperience: 4,
      skills: ['AutoCAD', 'Structural Design', 'Construction Planning', 'Project Management'],
      eligibilities: ['Licensed Civil Engineer']
    }
  },
  {
    email: 'lucia.gomez.teacher@gmail.com',
    password: 'Test123!',
    full_name: 'Lucia Gomez',
    pds: {
      degree: 'Bachelor in Elementary Education',
      yearsOfExperience: 1,
      skills: ['Lesson Planning', 'Classroom Management', 'Educational Assessment', 'Child Psychology'],
      eligibilities: ['Licensed Professional Teacher (LET)']
    }
  },
  {
    email: 'antonio.diaz.web@gmail.com',
    password: 'Test123!',
    full_name: 'Antonio Diaz',
    pds: {
      degree: 'Bachelor of Science in Information Technology',
      yearsOfExperience: 2,
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Git'],
      eligibilities: ['None']
    }
  },
  {
    email: 'patricia.castro.hr@gmail.com',
    password: 'Test123!',
    full_name: 'Patricia Castro',
    pds: {
      degree: 'Bachelor of Science in Human Resource Management',
      yearsOfExperience: 4,
      skills: ['Recruitment', 'Employee Relations', 'HR Policies', 'Payroll Management', 'Training'],
      eligibilities: ['None']
    }
  }
];

async function createTestUsers() {
  console.log('🚀 Starting seed script...\n');

  const createdUsers = [];

  for (const applicant of testApplicants) {
    try {
      console.log(`Creating user: ${applicant.full_name} (${applicant.email})`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: applicant.email,
        password: applicant.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`  ❌ Auth error: ${authError.message}`);
        continue;
      }

      console.log(`  ✅ Auth user created: ${authData.user.id}`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: applicant.email,
          full_name: applicant.full_name,
          role: 'APPLICANT'
        });

      if (profileError) {
        console.error(`  ❌ Profile error: ${profileError.message}`);
        continue;
      }

      console.log(`  ✅ Profile created`);

      // Create complete PDS
      const pdsData = {
        user_id: authData.user.id,
        personal_info: {
          surname: applicant.full_name.split(' ').pop(),
          firstName: applicant.full_name.split(' ')[0],
          middleName: applicant.full_name.split(' ')[1] || '',
          dateOfBirth: '1995-01-15',
          placeOfBirth: 'Davao City',
          sex: Math.random() > 0.5 ? 'Male' : 'Female',
          civilStatus: 'Single',
          height: '165',
          weight: '60',
          bloodType: 'O',
          citizenship: 'Filipino',
          emailAddress: applicant.email,
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
          father: {
            surname: 'Father',
            firstName: 'Test',
            middleName: 'Middle'
          },
          mother: {
            surname: 'Mother',
            firstName: 'Test',
            maidenName: 'Maiden'
          },
          children: []
        },
        educational_background: [
          {
            level: 'COLLEGE',
            schoolName: 'University of the Philippines',
            basicEdDegreeCourse: applicant.pds.degree,
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
        civil_service: applicant.pds.eligibilities.map(elig => ({
          eligibilityTitle: elig,
          rating: '85',
          dateOfExamConferment: '2018-06-15',
          placeOfExamConferment: 'Davao City',
          licenseNumber: elig.includes('Licensed') ? 'LIC-12345' : null,
          licenseValidity: elig.includes('Licensed') ? '2030-12-31' : null
        })),
        work_experience: Array.from({ length: applicant.pds.yearsOfExperience }, (_, i) => ({
          positionTitle: `${applicant.pds.degree.includes('Engineering') ? 'Engineer' : applicant.pds.degree.includes('IT') || applicant.pds.degree.includes('Computer') ? 'Developer' : applicant.pds.degree.includes('Nursing') ? 'Nurse' : applicant.pds.degree.includes('Education') ? 'Teacher' : applicant.pds.degree.includes('Accountancy') ? 'Accountant' : 'Officer'} ${i > 0 ? i + 1 : ''}`,
          companyName: `Company ${String.fromCharCode(65 + i)}`,
          monthlySalary: 20000 + (i * 5000),
          salaryGrade: `SG-${10 + i}`,
          statusOfAppointment: 'Permanent',
          govtService: i % 2 === 0 ? 'Yes' : 'No',
          periodFrom: `${2017 + i}-01-01`,
          periodTo: i === applicant.pds.yearsOfExperience - 1 ? 'Present' : `${2017 + i + 1}-12-31`
        })),
        voluntary_work: [],
        learning_development: [],
        other_information: {
          skills: applicant.pds.skills.join(', '),
          nonAcademicRecognitions: 'None',
          membershipInOrganizations: 'None',
          governmentIssuedId: {
            idType: 'UMID',
            idNumber: 'UMID-' + Math.random().toString(36).substring(7)
          },
          references: [
            {
              name: 'Reference One',
              address: 'Davao City',
              telephoneNo: '09171111111'
            },
            {
              name: 'Reference Two',
              address: 'Davao City',
              telephoneNo: '09172222222'
            },
            {
              name: 'Reference Three',
              address: 'Davao City',
              telephoneNo: '09173333333'
            }
          ],
          declaration: {
            sworn: true,
            dateAccomplished: new Date().toISOString().split('T')[0],
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
        console.error(`  ❌ PDS error: ${pdsError.message}`);
        continue;
      }

      console.log(`  ✅ PDS created (100% complete)`);
      console.log(`  ✅ User fully set up!\n`);

      createdUsers.push({
        userId: authData.user.id,
        email: applicant.email,
        name: applicant.full_name,
        pds: applicant.pds
      });

    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error.message}\n`);
    }
  }

  console.log(`\n✅ Created ${createdUsers.length} users successfully!`);
  return createdUsers;
}

async function main() {
  await createTestUsers();
  console.log('\n🎉 Seed script completed!');
}

main().catch(console.error);
