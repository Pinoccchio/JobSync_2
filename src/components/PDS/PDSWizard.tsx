'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from './ProgressBar';
import { useToast } from '@/contexts/ToastContext';
import { useAutoSavePDS } from '@/hooks/useAutoSavePDS';
import { PDSData, PDSSection, PDSWizardStep } from '@/types/pds.types';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// Import section components (will create these next)
import { PersonalInformationForm } from './sections/PersonalInformationForm';
import { FamilyBackgroundForm } from './sections/FamilyBackgroundForm';
import { EducationalBackgroundForm } from './sections/EducationalBackgroundForm';
import { EligibilityForm } from './sections/EligibilityForm';
import { WorkExperienceForm } from './sections/WorkExperienceForm';
import { VoluntaryWorkForm } from './sections/VoluntaryWorkForm';
import { TrainingForm } from './sections/TrainingForm';
import { OtherInformationForm } from './sections/OtherInformationForm';
import { ReviewSubmit } from './sections/ReviewSubmit';

const WIZARD_STEPS: PDSWizardStep[] = [
  {
    id: 'personal-information',
    title: 'Personal Info',
    description: 'Basic personal details',
    isComplete: false,
  },
  {
    id: 'family-background',
    title: 'Family',
    description: 'Family information',
    isComplete: false,
  },
  {
    id: 'educational-background',
    title: 'Education',
    description: 'Educational background',
    isComplete: false,
  },
  {
    id: 'civil-service-eligibility',
    title: 'Eligibility',
    description: 'Certifications',
    isComplete: false,
  },
  {
    id: 'work-experience',
    title: 'Work',
    description: 'Work experience',
    isComplete: false,
  },
  {
    id: 'voluntary-work',
    title: 'Voluntary',
    description: 'Voluntary work',
    isComplete: false,
  },
  {
    id: 'learning-development',
    title: 'Training',
    description: 'L&D programs',
    isComplete: false,
  },
  {
    id: 'other-information',
    title: 'Other Info',
    description: 'Skills & questions',
    isComplete: false,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review & submit',
    isComplete: false,
  },
];

// Mock test data for development/debugging
const MOCK_PDS_DATA: Partial<PDSData> = {
  personalInfo: {
    surname: 'SANTOS',
    firstName: 'JUAN MIGUEL',
    middleName: 'REYES',
    nameExtension: 'JR.',
    dateOfBirth: '1995-01-15',
    placeOfBirth: 'Manila, Philippines',
    sexAtBirth: 'Male',
    civilStatus: 'Married',
    civilStatusOthers: undefined,
    height: 1.70, // in meters
    weight: 68, // in kilograms
    bloodType: 'O+',
    citizenship: 'Filipino',
    dualCitizenshipType: undefined,
    dualCitizenshipCountry: undefined,
    umidNo: '0001-2345678-9',
    pagibigNo: '1234-5678-9012',
    philhealthNo: '12-345678901-2',
    philsysNo: '1234-5678-9012-3456',
    tinNo: '123-456-789-000',
    agencyEmployeeNo: 'ASUN-2016-001',
    residentialAddress: {
      houseBlockLotNo: 'Block 5 Lot 23',
      street: 'Rizal Street',
      subdivisionVillage: 'San Isidro Village',
      barangay: 'Poblacion',
      cityMunicipality: 'Asuncion',
      province: 'Davao del Norte',
      zipCode: '8410',
    },
    permanentAddress: {
      sameAsResidential: true,
      houseBlockLotNo: 'Block 5 Lot 23',
      street: 'Rizal Street',
      subdivisionVillage: 'San Isidro Village',
      barangay: 'Poblacion',
      cityMunicipality: 'Asuncion',
      province: 'Davao del Norte',
      zipCode: '8410',
    },
    telephoneNo: '084-123-4567',
    mobileNo: '+63 912 345 6789',
    emailAddress: 'juanmiguel.santos@email.com',
  },
  familyBackground: {
    spouse: {
      surname: 'SANTOS',
      firstName: 'MARIA ELENA',
      middleName: 'REYES',
      occupation: 'Public School Teacher II',
      employerBusinessName: 'Asuncion National High School',
      businessAddress: 'Poblacion, Asuncion, Davao del Norte 8410',
      telephoneNo: '084-234-9876',
    },
    children: [
      {
        fullName: 'JUAN MIGUEL SANTOS III',
        dateOfBirth: '2018-03-15',
      },
      {
        fullName: 'SOPHIA MARIE SANTOS',
        dateOfBirth: '2020-07-22',
      },
    ],
    father: {
      surname: 'SANTOS',
      firstName: 'ROBERTO',
      middleName: 'DELA CRUZ',
    },
    mother: {
      surname: 'REYES',
      firstName: 'MARIA',
      middleName: 'GARCIA',
    },
  },
  educationalBackground: [
    {
      level: 'Elementary',
      nameOfSchool: 'San Isidro Elementary School',
      basicEducationDegreeCourse: 'Elementary Education',
      periodOfAttendance: {
        from: '2001',
        to: '2007',
      },
      highestLevelUnitsEarned: undefined,
      yearGraduated: '2007',
      scholarshipAcademicHonors: 'With Honors',
    },
    {
      level: 'Secondary',
      nameOfSchool: 'Manila High School',
      basicEducationDegreeCourse: 'High School Diploma',
      periodOfAttendance: {
        from: '2007',
        to: '2011',
      },
      highestLevelUnitsEarned: undefined,
      yearGraduated: '2011',
      scholarshipAcademicHonors: 'Honor Student',
    },
    {
      level: 'Vocational/Trade Course',
      nameOfSchool: 'TESDA - Asuncion Training Center',
      basicEducationDegreeCourse: 'Computer System Servicing NC II',
      periodOfAttendance: {
        from: '2011',
        to: '2012',
      },
      highestLevelUnitsEarned: '240 hours',
      yearGraduated: '2012',
      scholarshipAcademicHonors: 'TESDA Scholarship',
    },
    {
      level: 'College',
      nameOfSchool: 'University of Santo Tomas',
      basicEducationDegreeCourse: 'Bachelor of Science in Computer Science',
      periodOfAttendance: {
        from: '2011',
        to: '2015',
      },
      highestLevelUnitsEarned: undefined,
      yearGraduated: '2015',
      scholarshipAcademicHonors: 'Cum Laude',
    },
  ],
  eligibility: [
    {
      careerService: 'Career Service Professional',
      rating: '85.50',
      dateOfExaminationConferment: '2016-03-15',
      placeOfExaminationConferment: 'Professional Regulation Commission, Manila',
      licenseNumber: 'CSP-2016-0012345',
      licenseValidity: '2026-03-15',
    },
    {
      careerService: 'TESDA NC II - Computer System Servicing',
      rating: '90.00',
      dateOfExaminationConferment: '2012-11-20',
      placeOfExaminationConferment: 'TESDA Regional Training Center XI, Davao City',
      licenseNumber: 'TESDA-2012-CS-5678',
      licenseValidity: 'N/A',
    },
  ],
  workExperience: [
    {
      positionTitle: 'IT Assistant',
      departmentAgencyOfficeCompany: 'Asuncion Municipal Hall - IT Department',
      monthlySalary: 15000,
      salaryGrade: 'SG-9',
      statusOfAppointment: 'Permanent',
      governmentService: true,
      periodOfService: {
        from: '2016-06-01',
        to: '2018-05-31',
      },
    },
    {
      positionTitle: 'Systems Analyst II',
      departmentAgencyOfficeCompany: 'Asuncion Municipal Hall - MIS Office',
      monthlySalary: 22000,
      salaryGrade: 'SG-15',
      statusOfAppointment: 'Permanent',
      governmentService: true,
      periodOfService: {
        from: '2018-06-01',
        to: '2021-12-31',
      },
    },
    {
      positionTitle: 'Senior IT Officer',
      departmentAgencyOfficeCompany: 'Davao del Norte Provincial Government - ICT Office',
      monthlySalary: 35000,
      salaryGrade: 'SG-18',
      statusOfAppointment: 'Permanent',
      governmentService: true,
      periodOfService: {
        from: '2022-01-01',
        to: 'Present',
      },
    },
  ],
  voluntaryWork: [
    {
      organizationName: 'Asuncion Youth Development Center',
      organizationAddress: 'Poblacion, Asuncion, Davao del Norte 8410',
      periodOfInvolvement: {
        from: '2020-01-15',
        to: '2020-12-20',
      },
      numberOfHours: 120,
      positionNatureOfWork: 'Coding Workshop Facilitator - Conducted 12 sessions teaching HTML, CSS, and JavaScript basics to 25 out-of-school youth. Developed curriculum and provided hands-on coding exercises. Assisted participants in building their first portfolio websites.',
    },
    {
      organizationName: 'Philippine Red Cross - Davao del Norte Chapter',
      organizationAddress: 'Red Cross Building, Apokon Road, Tagum City, Davao del Norte',
      periodOfInvolvement: {
        from: '2019-06-01',
        to: '2019-08-31',
      },
      numberOfHours: 80,
      positionNatureOfWork: 'IT Systems Volunteer - Maintained and repaired computer systems, set up network infrastructure for blood donation drives, and provided technical support during disaster response operations. Configured database systems for volunteer management.',
    },
    {
      organizationName: 'Kabataan Kontra Droga at Terorismo (KKDAT) - Asuncion Chapter',
      organizationAddress: 'Municipal Hall, Poblacion, Asuncion, Davao del Norte',
      periodOfInvolvement: {
        from: '2021-03-01',
        to: '2021-06-30',
      },
      numberOfHours: 60,
      positionNatureOfWork: 'Social Media Manager - Created and managed Facebook page for drug abuse prevention campaigns. Designed infographics using Canva, organized 5 online webinars reaching 500+ youth participants, and coordinated with barangay officials for community outreach programs.',
    },
  ],
  trainings: [
    {
      title: 'Advanced Cybersecurity and Network Defense Training',
      periodOfAttendance: {
        from: '2022-08-01',
        to: '2022-08-05',
      },
      numberOfHours: 40,
      typeOfLD: 'Technical Training',
      conductedSponsoredBy: 'Department of Information and Communications Technology (DICT) - Region XI, Davao City Convention Center',
    },
    {
      title: 'Project Management for Government IT Infrastructure Projects',
      periodOfAttendance: {
        from: '2021-05-10',
        to: '2021-05-12',
      },
      numberOfHours: 24,
      typeOfLD: 'Managerial Training',
      conductedSponsoredBy: 'Civil Service Commission (CSC) - Regional Office XI, Marco Polo Hotel, Davao City',
    },
    {
      title: 'Data Analytics and Business Intelligence Visualization Workshop',
      periodOfAttendance: {
        from: '2023-03-15',
        to: '2023-03-17',
      },
      numberOfHours: 16,
      typeOfLD: 'Technical Training',
      conductedSponsoredBy: 'Philippine Statistics Authority (PSA) - Davao Regional Office, Ecoland Hotel, Davao City',
    },
    {
      title: 'Leadership and Supervisory Development Program (LSDP)',
      periodOfAttendance: {
        from: '2023-09-04',
        to: '2023-09-08',
      },
      numberOfHours: 40,
      typeOfLD: 'Supervisory Training',
      conductedSponsoredBy: 'Development Academy of the Philippines (DAP), Tagaytay Learning Center',
    },
    {
      title: 'Government Procurement Reform Act (RA 9184) Seminar',
      periodOfAttendance: {
        from: '2020-02-18',
        to: '2020-02-19',
      },
      numberOfHours: 16,
      typeOfLD: 'Technical Training',
      conductedSponsoredBy: 'Government Procurement Policy Board (GPPB), Manila Hotel, Manila',
    },
  ],
  otherInformation: {
    skills: [
      // Programming Languages
      'JavaScript (ES6+)',
      'TypeScript',
      'Python 3.x',
      'PHP 7+',
      'Java SE',
      // Web Development
      'React.js',
      'Vue.js',
      'Node.js',
      'Express.js',
      'Laravel Framework',
      // Database Systems
      'MySQL',
      'PostgreSQL',
      'MongoDB',
      'Redis Cache',
      // DevOps & Tools
      'Git/GitHub',
      'Docker Containerization',
      'Linux Server Administration',
      'Apache/Nginx Web Servers',
      // Development Practices
      'RESTful API Development',
      'Agile/Scrum Methodology',
      'Test-Driven Development (TDD)',
      // Networking & Security
      'Network Configuration & Troubleshooting',
      'Firewall Configuration',
      'Cybersecurity Best Practices',
      // Office & Documentation
      'MS Office Suite (Word, Excel, PowerPoint, Access)',
      'Google Workspace (Docs, Sheets, Drive)',
      'Technical Writing & Documentation',
      'Project Management',
      // Design
      'Adobe Photoshop (Basic)',
      'Canva (Graphic Design)',
    ],
    recognitions: [
      'Best IT Employee of the Year 2022 - Asuncion Municipal Hall',
      'Outstanding Young Professional Award 2020 - Davao del Norte',
      'Excellence in Public Service Award 2021 - Provincial Government',
      'Dean\'s Lister - University of Santo Tomas (2013-2015)',
      'Hackathon Finalist - National ICT Conference 2019',
    ],
    memberships: [
      'Philippine Computer Society (PCS) - Active Member since 2016',
      'Government IT Professionals Association (GITPA) - Member since 2018',
      'Association for Computing Machinery (ACM) - Student Member 2013-2015',
    ],
    references: [
      {
        name: 'ENGR. ROBERTO GOMEZ',
        address: 'Asuncion Municipal Hall, Poblacion, Asuncion, Davao del Norte',
        telephoneNo: '084-234-5678',
      },
      {
        name: 'MS. MARIA CLARA SANTOS',
        address: 'Provincial Government of Davao del Norte, Tagum City',
        telephoneNo: '084-876-5432',
      },
      {
        name: 'DR. JOSE RIZAL CRUZ',
        address: 'University of Santo Tomas, España Boulevard, Manila',
        telephoneNo: '02-8888-9999',
      },
    ],
    governmentIssuedId: {
      type: 'Philippine Passport',
      idNumber: 'P1234567A',
      dateIssued: '2020-06-15',
    },
    // Questions 34-40 (part of Section VIII in CS Form 212, Revised 2025)
    relatedThirdDegree: false,
    relatedThirdDegreeDetails: undefined,
    relatedFourthDegree: false,
    relatedFourthDegreeDetails: undefined,
    guiltyAdministrativeOffense: true,
    guiltyAdministrativeOffenseDetails: 'Minor infraction related to late submission of quarterly report in 2019, resolved with written warning.',
    criminallyCharged: false,
    criminallyChargedDetails: undefined,
    convicted: false,
    convictedDetails: undefined,
    separatedFromService: true,
    separatedFromServiceDetails: 'End of contract employment at Department of Information and Communications Technology (DICT) - Regional Office XI in December 2021.',
    candidateNationalLocal: false,
    candidateNationalLocalDetails: undefined,
    resignedForCandidacy: false,
    resignedForCandidacyDetails: undefined,
    immigrantOrPermanentResident: false,
    immigrantOrPermanentResidentCountry: undefined,
    indigenousGroupMember: true,
    indigenousGroupName: 'Ata-Manobo',
    personWithDisability: false,
    pwdIdNumber: undefined,
    soloParent: true,
    soloParentIdNumber: 'SP-2022-045789',
    declaration: {
      agreed: true,
      signatureData: undefined,
      dateAccomplished: new Date().toISOString().split('T')[0],
    },
  },
  completionPercentage: 0,
  isCompleted: false,
  lastSavedSection: undefined,
};

/**
 * Normalizes PDS data to ensure all nested structures have proper defaults
 * Prevents undefined errors when accessing nested properties
 */
const normalizePDSData = (data: any): Partial<PDSData> => ({
  id: data.id,
  userId: data.userId || data.user_id,
  personalInfo: data.personalInfo || data.personal_info || {},
  familyBackground: {
    children: [],
    father: { surname: '', firstName: '', middleName: '' },
    mother: { surname: '', firstName: '', middleName: '' },
    ...(data.familyBackground || data.family_background || {}),
  },
  educationalBackground: data.educationalBackground || data.educational_background || [],
  eligibility: data.eligibility || [],
  workExperience: data.workExperience || data.work_experience || [],
  voluntaryWork: data.voluntaryWork || data.voluntary_work || [],
  trainings: data.trainings || [],
  otherInformation: {
    skills: [],
    references: [],
    governmentIssuedId: {},
    declaration: {},
    ...(data.otherInformation || data.other_information || {}),
  },
  completionPercentage: data.completionPercentage || data.completion_percentage || 0,
  isCompleted: data.isCompleted || data.is_completed || false,
  lastSavedSection: data.lastSavedSection || data.last_saved_section,
});

export const PDSWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [pdsData, setPdsData] = useState<Partial<PDSData>>({});
  const [steps, setSteps] = useState<PDSWizardStep[]>(WIZARD_STEPS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  // Validate if section data is complete
  const validateSectionData = (sectionId: PDSSection, data: any): boolean => {
    switch (sectionId) {
      case 'personal-information':
        return !!(data?.surname && data?.firstName && data?.dateOfBirth);
      case 'family-background':
        return !!(data?.father?.surname && data?.mother?.surname);
      case 'educational-background':
        return Array.isArray(data) && data.length > 0 && !!data[0]?.nameOfSchool;
      case 'civil-service-eligibility':
        return Array.isArray(data) && data.length > 0 && !!data[0]?.careerService;
      case 'work-experience':
        return Array.isArray(data) && data.length > 0 && !!data[0]?.positionTitle;
      case 'voluntary-work':
        return Array.isArray(data) && data.length > 0 && !!data[0]?.organizationName;
      case 'learning-development':
        return Array.isArray(data) && data.length > 0 && !!data[0]?.title;
      case 'other-information':
        return !!(data?.declaration?.agreed);
      default:
        return false;
    }
  };

  // Auto-save hook
  const { saveStatus, saveError, triggerSave, lastSavedAt } = useAutoSavePDS(pdsData, {
    debounceMs: 2000,
    onSaveSuccess: (data) => {
      // Always update state with returned data to ensure id is set
      // This prevents POST/PUT conflicts when navigating between pages
      if (data && data.id) {
        setPdsData((prev) => ({
          ...prev,
          id: data.id,
          userId: data.user_id || prev.userId,
        }));
      }
    },
    onSaveError: (error) => {
      showToast(`Auto-save failed: ${error}`, 'error');
    },
  });

  // Load existing PDS data on mount
  useEffect(() => {
    loadPDSData();
  }, []);

  const loadPDSData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pds');
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        // Use normalizePDSData to ensure all nested structures have defaults
        setPdsData(normalizePDSData(data));

        // Update step completion status
        updateStepCompletion(data);

        // Resume from last saved section
        if (data.last_saved_section && !data.is_completed) {
          const stepIndex = steps.findIndex((s) => s.id === data.last_saved_section);
          if (stepIndex !== -1) {
            setCurrentStep(stepIndex);
          }
        }
      } else if (result.success && !result.data) {
        // No PDS exists yet - initialize with empty state using normalizePDSData
        // Auto-save will create it on first change
        setPdsData(normalizePDSData({}));
      }
    } catch (error) {
      console.error('Error loading PDS data:', error);
      showToast('Failed to load your PDS data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStepCompletion = (data: any) => {
    const updatedSteps = [...steps];
    updatedSteps[0].isComplete = !!data.personal_info?.surname;
    updatedSteps[1].isComplete = !!data.family_background?.father;
    updatedSteps[2].isComplete = (data.educational_background?.length || 0) > 0;
    updatedSteps[3].isComplete = (data.eligibility?.length || 0) > 0;
    updatedSteps[4].isComplete = (data.work_experience?.length || 0) > 0;
    updatedSteps[5].isComplete = (data.voluntary_work?.length || 0) > 0;
    updatedSteps[6].isComplete = (data.trainings?.length || 0) > 0;
    updatedSteps[7].isComplete = !!data.other_information?.declaration?.agreed;
    updatedSteps[8].isComplete = data.is_completed || false;
    setSteps(updatedSteps);
  };

  const calculateCompletion = () => {
    // Only count the first 8 steps (exclude review step from both numerator and denominator)
    const completableSteps = steps.slice(0, -1); // Exclude last step (review)
    const completedSteps = completableSteps.filter((s) => s.isComplete).length;
    const percentage = (completedSteps / completableSteps.length) * 100;

    // Ensure percentage is always between 0 and 100 (database constraint)
    return Math.max(0, Math.min(100, Math.round(percentage)));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Update last saved section
      setPdsData((prev) => ({
        ...prev,
        lastSavedSection: steps[nextStep].id,
      }));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Update last saved section to sync with current step
      setPdsData((prev) => ({
        ...prev,
        lastSavedSection: steps[prevStep].id,
      }));
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await triggerSave();
      showToast('Draft saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionChange = useCallback((sectionId: PDSSection, data: any) => {
    setPdsData((prev) => {
      const updated = { ...prev };

      switch (sectionId) {
        case 'personal-information':
          updated.personalInfo = data;
          break;
        case 'family-background':
          updated.familyBackground = data;
          break;
        case 'educational-background':
          updated.educationalBackground = data;
          break;
        case 'civil-service-eligibility':
          updated.eligibility = data;
          break;
        case 'work-experience':
          updated.workExperience = data;
          break;
        case 'voluntary-work':
          updated.voluntaryWork = data;
          break;
        case 'learning-development':
          updated.trainings = data;
          break;
        case 'other-information':
          updated.otherInformation = data;
          break;
      }

      updated.completionPercentage = calculateCompletion();
      updated.lastSavedSection = sectionId;

      return updated;
    });

    // Validate and mark current step as complete only if data is valid
    setSteps((prev) => {
      const updated = [...prev];
      const currentStepData = updated[currentStep];
      if (currentStepData) {
        currentStepData.isComplete = validateSectionData(sectionId, data);
      }
      return updated;
    });
  }, [currentStep, validateSectionData, calculateCompletion]);

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/pds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pdsData,
          isCompleted: true,
          completionPercentage: 100,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('PDS submitted successfully!', 'success');
        // Optionally redirect to dashboard or applications page
        window.location.href = '/applicant/dashboard';
      } else {
        throw new Error(result.error || 'Failed to submit PDS');
      }
    } catch (error: any) {
      console.error('Error submitting PDS:', error);
      showToast(error.message || 'Failed to submit PDS', 'error');
    }
  };

  // Load test data for debugging (development only)
  const handleLoadTestData = () => {
    // Preserve existing id and userId if they exist (prevents auto-save POST error)
    const existingId = pdsData.id;
    const existingUserId = pdsData.userId;

    setPdsData({
      ...MOCK_PDS_DATA,
      id: existingId, // Keep existing ID for PUT request
      userId: existingUserId, // Keep existing user ID
    });

    // Mark all steps as complete
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        isComplete: index < prev.length - 1, // All except review step
      }))
    );

    showToast('Test data loaded! All sections filled with sample data.', 'success');

    // Use setTimeout to ensure state updates complete first (fixes progress bar lag)
    setTimeout(() => {
      setCurrentStep(0); // Go back to first step to see the data
    }, 0);
  };

  const renderCurrentSection = () => {
    const currentSectionId = steps[currentStep]?.id;

    switch (currentSectionId) {
      case 'personal-information':
        return (
          <PersonalInformationForm
            data={pdsData.personalInfo}
            onChange={(data) => handleSectionChange('personal-information', data)}
          />
        );
      case 'family-background':
        return (
          <FamilyBackgroundForm
            data={pdsData.familyBackground}
            onChange={(data) => handleSectionChange('family-background', data)}
          />
        );
      case 'educational-background':
        return (
          <EducationalBackgroundForm
            data={pdsData.educationalBackground || []}
            onChange={(data) => handleSectionChange('educational-background', data)}
          />
        );
      case 'civil-service-eligibility':
        return (
          <EligibilityForm
            data={pdsData.eligibility || []}
            onChange={(data) => handleSectionChange('civil-service-eligibility', data)}
          />
        );
      case 'work-experience':
        return (
          <WorkExperienceForm
            data={pdsData.workExperience || []}
            onChange={(data) => handleSectionChange('work-experience', data)}
          />
        );
      case 'voluntary-work':
        return (
          <VoluntaryWorkForm
            data={pdsData.voluntaryWork || []}
            onChange={(data) => handleSectionChange('voluntary-work', data)}
          />
        );
      case 'learning-development':
        return (
          <TrainingForm
            data={pdsData.trainings || []}
            onChange={(data) => handleSectionChange('learning-development', data)}
          />
        );
      case 'other-information':
        return (
          <OtherInformationForm
            data={pdsData.otherInformation}
            onChange={(data) => handleSectionChange('other-information', data)}
          />
        );
      case 'review':
        return (
          <ReviewSubmit
            pdsData={pdsData}
            pdsId={pdsData.id}
            onEdit={(sectionIndex) => setCurrentStep(sectionIndex)}
            onSubmit={handleSubmit}
          />
        );
      default:
        return <div>Section not found</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22A555] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your PDS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Debug Button - Disabled for production use
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadTestData}
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
          >
            🔧 Load Test Data
          </Button>
        </div>
      )}
      */}

      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={steps.length}
        completionPercentage={calculateCompletion()}
        steps={steps}
      />

      {/* Auto-save Indicator */}
      <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <>
              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-600">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="w-4 h-4 text-[#22A555]" />
              <span className="text-sm text-[#22A555]">Saved automatically</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{saveError || 'Save failed'}</span>
            </>
          )}
          {saveStatus === 'idle' && lastSavedAt && (
            <span className="text-sm text-gray-500">
              Last saved: {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Save}
          onClick={handleSaveDraft}
          disabled={isSaving}
          loading={isSaving}
        >
          Save Draft
        </Button>
      </div>

      {/* Current Section Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
        {renderCurrentSection()}
      </div>

      {/* Navigation Buttons - Full navigation for steps 1-8 */}
      {currentStep < steps.length - 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-6 py-4">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            icon={ChevronRight}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      )}

      {/* Minimal navigation for Review step (step 9) - Only Previous button */}
      {currentStep === steps.length - 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-6 py-4">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="w-24"></div> {/* Empty space for alignment */}
        </div>
      )}

      {/* Help Text */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Your progress is automatically saved. You can complete this form in multiple sessions.
      </p>
    </div>
  );
};
