/**
 * Seed 20 Complete Test Users
 * Creates 20 applicant users with:
 * - Supabase Auth accounts
 * - Complete profiles
 * - Fully filled PDS (Personal Data Sheet)
 * - Ready for training application enrollment
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { generateCompleteTestUser, generatePhilippineAddress } from './filipino-test-data';
import type { PersonalInformation, FamilyBackground, EducationalBackground, Eligibility, WorkExperience, VoluntaryWork, Training, OtherInformation } from '../src/types/pds.types';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CreatedUser {
  userId: string;
  email: string;
  fullName: string;
  pdsId: string;
}

const createdUsers: CreatedUser[] = [];

/**
 * Create a single test user with complete data
 */
async function createCompleteUser(index: number): Promise<CreatedUser | null> {
  try {
    console.log(`\n[${index}/50] Generating user data...`);

    // Generate test data
    const userData = generateCompleteTestUser(index);

    console.log(`  📧 Email: ${userData.email}`);
    console.log(`  👤 Name: ${userData.fullName}`);

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.fullName,
        role: 'APPLICANT',
      },
    });

    if (authError) {
      console.error(`  ❌ Auth creation failed: ${authError.message}`);
      return null;
    }

    if (!authData.user) {
      console.error(`  ❌ No user returned from auth creation`);
      return null;
    }

    const userId = authData.user.id;
    console.log(`  ✅ Auth user created: ${userId}`);

    // Step 2: Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 3: Verify profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error(`  ⚠️  Profile not found, trigger may have failed. Creating manually...`);

      // Manually create profile if trigger failed
      const { error: manualProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.fullName,
          role: 'APPLICANT',
          phone: userData.phone,
          status: 'active'
        });

      if (manualProfileError) {
        console.error(`  ❌ Manual profile creation failed: ${manualProfileError.message}`);
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return null;
      }
    }

    console.log(`  ✅ Profile created`);

    // Step 4: Create complete PDS record
    const address = generatePhilippineAddress();

    // Parse address components
    const residentialAddress = {
      houseBlockLotNo: address.street.split(' ')[0],
      street: address.street,
      subdivisionVillage: '',
      barangay: address.barangay,
      cityMunicipality: address.city,
      province: address.province,
      zipCode: address.zipCode
    };

    // Build Personal Information
    const personalInfo: PersonalInformation = {
      surname: userData.lastName,
      firstName: userData.firstName,
      middleName: userData.middleName,
      nameExtension: userData.suffix,
      dateOfBirth: userData.birthDate.toISOString().split('T')[0],
      placeOfBirth: userData.birthPlace,
      sexAtBirth: userData.gender as 'Male' | 'Female',
      civilStatus: userData.civilStatus as any,
      height: 1.6 + Math.random() * 0.3, // 1.6 - 1.9m
      weight: 50 + Math.floor(Math.random() * 40), // 50-90kg
      bloodType: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)] as any,
      citizenship: 'Filipino',
      residentialAddress,
      permanentAddress: {
        sameAsResidential: true
      },
      telephoneNo: '',
      mobileNo: userData.mobile,
      emailAddress: userData.email,
      tinNo: `${Math.floor(Math.random() * 900000000) + 100000000}`,
      pagibigNo: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      philhealthNo: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      philsysNo: `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
    };

    // Build Family Background
    const familyBackground: FamilyBackground = {
      children: userData.civilStatus === 'Married' ? [
        {
          fullName: 'N/A',
          dateOfBirth: '2000-01-01'
        }
      ] : [],
      father: {
        surname: userData.lastName,
        firstName: 'Juan',
        middleName: 'Dela Cruz'
      },
      mother: {
        surname: 'Santos',
        firstName: 'Maria',
        middleName: 'Garcia'
      }
    };

    // Build Educational Background
    const educationalBackground: EducationalBackground[] = userData.education.map(edu => ({
      level: edu.level,
      nameOfSchool: edu.school,
      basicEducationDegreeCourse: edu.degree,
      periodOfAttendance: {
        from: edu.from.toString(),
        to: edu.to.toString()
      },
      highestLevelUnitsEarned: edu.units,
      yearGraduated: edu.graduated ? edu.to.toString() : undefined,
      scholarshipAcademicHonors: edu.honors || undefined
    }));

    // Build Eligibility
    const eligibility: Eligibility[] = userData.eligibility.map(elig => ({
      careerService: elig.title,
      rating: elig.rating,
      dateOfExaminationConferment: elig.dateOfExam,
      placeOfExaminationConferment: elig.placeOfExam,
      licenseNumber: elig.licenseNumber,
      licenseValidity: elig.validity
    }));

    // Build Work Experience
    const workExperience: WorkExperience[] = userData.workExperience.map(work => ({
      positionTitle: work.position,
      departmentAgencyOfficeCompany: work.company,
      monthlySalary: parseInt(work.monthlySalary),
      salaryGrade: work.salaryGrade,
      statusOfAppointment: work.status,
      governmentService: work.governmentService,
      periodOfService: {
        from: work.from,
        to: work.to
      }
    }));

    // Build Voluntary Work
    const voluntaryWork: VoluntaryWork[] = userData.voluntaryWork.map(vol => ({
      organizationName: vol.organization,
      organizationAddress: '',
      periodOfInvolvement: {
        from: vol.from,
        to: vol.to
      },
      numberOfHours: parseInt(vol.hoursRendered),
      positionNatureOfWork: vol.position
    }));

    // Build Trainings
    const trainings: Training[] = userData.trainings.map(training => ({
      title: training.title,
      periodOfAttendance: {
        from: training.from,
        to: training.to
      },
      numberOfHours: parseInt(training.hours),
      typeOfLD: training.type,
      conductedSponsoredBy: training.sponsor
    }));

    // Build Other Information
    const otherInformation: OtherInformation = {
      skills: userData.skills,
      recognitions: [],
      memberships: userData.organizations,
      references: [
        {
          name: 'Reference Person 1',
          address: address.fullAddress,
          telephoneNo: userData.mobile
        },
        {
          name: 'Reference Person 2',
          address: address.fullAddress,
          telephoneNo: userData.mobile
        },
        {
          name: 'Reference Person 3',
          address: address.fullAddress,
          telephoneNo: userData.mobile
        }
      ],
      governmentIssuedId: {
        type: 'UMID',
        idNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        dateIssued: '2020-01-01'
      },
      relatedThirdDegree: false,
      relatedFourthDegree: false,
      guiltyAdministrativeOffense: false,
      criminallyCharged: false,
      convicted: false,
      separatedFromService: false,
      candidateNationalLocal: false,
      resignedForCandidacy: false,
      immigrantOrPermanentResident: false,
      indigenousGroupMember: false,
      personWithDisability: false,
      soloParent: false,
      declaration: {
        agreed: true,
        dateAccomplished: new Date().toISOString().split('T')[0]
      }
    };

    // Insert PDS record
    const { data: pdsData, error: pdsError } = await supabaseAdmin
      .from('applicant_pds')
      .insert({
        user_id: userId,
        personal_info: personalInfo,
        family_background: familyBackground,
        educational_background: educationalBackground,
        eligibility: eligibility,
        work_experience: workExperience,
        voluntary_work: voluntaryWork,
        trainings: trainings,
        other_information: otherInformation,
        completion_percentage: 100,
        is_completed: true,
        last_saved_section: 'review'
      })
      .select()
      .single();

    if (pdsError) {
      console.error(`  ❌ PDS creation failed: ${pdsError.message}`);
      // Rollback user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return null;
    }

    console.log(`  ✅ PDS created: ${pdsData.id}`);
    console.log(`  🎉 User ${index}/50 complete!`);

    return {
      userId,
      email: userData.email,
      fullName: userData.fullName,
      pdsId: pdsData.id
    };

  } catch (error) {
    console.error(`  ❌ Error creating user ${index}:`, error);
    return null;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n🚀 Starting seed: 20 Complete Test Users\n');
  console.log('=' .repeat(60));

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Create users sequentially to avoid rate limiting
  for (let i = 1; i <= 20; i++) {
    const result = await createCompleteUser(i);

    if (result) {
      createdUsers.push(result);
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between users to avoid overwhelming the server
    if (i < 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`  ✅ Successfully created: ${successCount}/20 users`);
  console.log(`  ❌ Failed: ${failCount}/20 users`);
  console.log(`  ⏱️  Total time: ${duration}s`);
  console.log(`  📧 Test email pattern: test.applicant.XX@jobsync.test`);
  console.log(`  🔑 Test password: TestPass123`);

  if (createdUsers.length > 0) {
    console.log('\n📝 Sample created users:');
    createdUsers.slice(0, 5).forEach(user => {
      console.log(`  - ${user.email} | ${user.fullName}`);
    });
  }

  console.log('\n✨ Seed complete! Ready for training application enrollment.\n');
}

// Execute
main().catch(console.error);
