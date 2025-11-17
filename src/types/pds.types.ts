/**
 * Personal Data Sheet (PDS) Type Definitions
 * Based on CS Form No. 212, Revised 2025
 */

// Section I: Personal Information
export interface PersonalInformation {
  // Name
  surname: string;
  firstName: string;
  middleName: string;
  nameExtension?: string; // JR., SR., III, etc.

  // Birth Information
  dateOfBirth: string; // ISO date format
  placeOfBirth: string;
  sexAtBirth: 'Male' | 'Female';

  // Civil Status
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled' | 'Solo Parent' | 'Others';
  civilStatusOthers?: string; // If Others is selected

  // Physical Attributes
  height: number; // in meters
  weight: number; // in kilograms
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

  // Government IDs
  umidNo?: string;
  pagibigNo?: string;
  philhealthNo?: string;
  philsysNo?: string; // PhilSys Number (PSN)
  tinNo?: string;
  agencyEmployeeNo?: string;

  // Citizenship
  citizenship: 'Filipino' | 'Dual Citizenship';
  dualCitizenshipType?: 'by birth' | 'by naturalization';
  dualCitizenshipCountry?: string;

  // Residential Address
  residentialAddress: {
    houseBlockLotNo?: string;
    street?: string;
    subdivisionVillage?: string;
    barangay: string;
    cityMunicipality: string;
    province: string;
    zipCode: string;
  };

  // Permanent Address
  permanentAddress: {
    sameAsResidential: boolean;
    houseBlockLotNo?: string;
    street?: string;
    subdivisionVillage?: string;
    barangay?: string;
    cityMunicipality?: string;
    province?: string;
    zipCode?: string;
  };

  // Contact Information
  telephoneNo?: string;
  mobileNo: string;
  emailAddress: string;
}

// Section II: Family Background
export interface FamilyBackground {
  // Spouse Information (if married/widowed)
  spouse?: {
    surname: string;
    firstName: string;
    middleName: string;
    occupation?: string;
    employerBusinessName?: string;
    businessAddress?: string;
    telephoneNo?: string;
  };

  // Children
  children: Array<{
    fullName: string;
    dateOfBirth: string; // ISO date format
  }>;

  // Father's Information
  father: {
    surname: string;
    firstName: string;
    middleName: string;
  };

  // Mother's Maiden Name
  mother: {
    surname: string;
    firstName: string;
    middleName: string;
  };
}

// Section III: Educational Background
export interface EducationalBackground {
  level: 'Elementary' | 'Secondary' | 'Vocational/Trade Course' | 'College' | 'Graduate Studies';
  nameOfSchool: string;
  basicEducationDegreeCourse: string; // Course or degree
  periodOfAttendance: {
    from: string; // Year or ISO date
    to: string; // Year or ISO date
  };
  highestLevelUnitsEarned?: string; // If not graduated
  yearGraduated?: string;
  scholarshipAcademicHonors?: string;
}

// Section IV: Civil Service Eligibility
export interface Eligibility {
  careerService: string; // e.g., "Career Service Professional", "RA 1080"
  rating?: string; // If applicable
  dateOfExaminationConferment: string; // ISO date format
  placeOfExaminationConferment: string;
  licenseNumber?: string;
  licenseValidity?: string; // ISO date format or "N/A"
}

// Section V: Work Experience
export interface WorkExperience {
  positionTitle: string;
  departmentAgencyOfficeCompany: string;
  monthlySalary?: number;
  salaryGrade?: string;
  statusOfAppointment?: string; // Permanent, Temporary, Contractual, etc.
  governmentService: boolean; // Y/N
  periodOfService: {
    from: string; // ISO date format
    to: string | 'Present'; // ISO date format or "Present"
  };
}

// Section VI: Voluntary Work or Involvement in Civic / Non-Government / People / Voluntary Organization/s
export interface VoluntaryWork {
  organizationName: string;
  organizationAddress?: string;
  periodOfInvolvement: {
    from: string; // ISO date format
    to: string | 'Present'; // ISO date format or "Present"
  };
  numberOfHours?: number;
  positionNatureOfWork: string;
}

// Section VII: Learning and Development (L&D) Interventions/Training Programs Attended
export interface Training {
  title: string; // Title of Learning and Development Intervention/Training Programs
  periodOfAttendance: {
    from: string; // ISO date format
    to: string; // ISO date format
  };
  numberOfHours: number;
  typeOfLD: string; // Type of LD (Managerial, Supervisory, Technical, etc.)
  conductedSponsoredBy: string; // Conducted/Sponsored By
}

// Section VIII: Other Information
export interface OtherInformation {
  // Special Skills and Hobbies
  skills: string[];

  // Non-Academic Distinctions / Recognition
  recognitions: string[];

  // Membership in Association/Organization
  memberships: string[];

  // References (at least 3 persons not related by consanguinity or affinity)
  references: Array<{
    name: string;
    address: string;
    telephoneNo: string;
  }>;

  // Government Issued ID
  governmentIssuedId?: {
    type: string; // Driver's License, Passport, UMID, etc.
    idNumber: string;
    dateIssued?: string; // ISO date format
  };

  // Questions 34-40 (part of Section VIII in CS Form 212, Revised 2025)
  // Q34: Related by consanguinity/affinity to appointing/recommending authority within 3rd degree?
  relatedThirdDegree?: boolean;
  relatedThirdDegreeDetails?: string;

  // Q35: Related by consanguinity/affinity to appointing/recommending authority within 4th degree (LGU)?
  relatedFourthDegree?: boolean;
  relatedFourthDegreeDetails?: string;

  // Q36: Found guilty of any administrative offense?
  guiltyAdministrativeOffense?: boolean;
  guiltyAdministrativeOffenseDetails?: string;

  // Q37: Criminally charged before any court?
  criminallyCharged?: boolean;
  criminallyChargedDetails?: string;
  criminallyChargedDateFiled?: string;
  criminallyChargedStatus?: string;

  // Q38: Ever been convicted of any crime or violation?
  convicted?: boolean;
  convictedDetails?: string;

  // Q39: Separated from service in government or private employment?
  separatedFromService?: boolean;
  separatedFromServiceDetails?: string;

  // Q38a: Candidate in a national or local election (except Barangay)?
  candidateNationalLocal?: boolean;
  candidateNationalLocalDetails?: string;

  // Q38b: Resigned from government service during candidacy?
  resignedForCandidacy?: boolean;
  resignedForCandidacyDetails?: string;

  // Q39: Immigrant or permanent resident of another country?
  immigrantOrPermanentResident?: boolean;
  immigrantOrPermanentResidentCountry?: string;

  // Q40a: Member of any indigenous group?
  indigenousGroupMember?: boolean;
  indigenousGroupName?: string;

  // Q40b: Person with disability (PWD)?
  personWithDisability?: boolean;
  pwdIdNumber?: string;

  // Q40c: Solo parent?
  soloParent?: boolean;
  soloParentIdNumber?: string;

  // Declaration
  declaration: {
    agreed: boolean;
    signatureData?: string; // Base64 signature data from canvas (legacy)
    signatureUrl?: string; // Storage path to signature image (preferred)
    signatureUploadedAt?: string; // ISO timestamp of signature upload
    dateAccomplished: string; // ISO date format
  };
}

// Complete PDS Data Structure
export interface PDSData {
  id?: string;
  userId?: string;
  personalInfo: PersonalInformation;
  familyBackground: FamilyBackground;
  educationalBackground: EducationalBackground[];
  eligibility: Eligibility[];
  workExperience: WorkExperience[];
  voluntaryWork: VoluntaryWork[];
  trainings: Training[];
  otherInformation: OtherInformation;
  completionPercentage?: number;
  isCompleted?: boolean;
  lastSavedSection?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database record type
export interface ApplicantPDS {
  id: string;
  user_id: string;
  personal_info: PersonalInformation;
  family_background: FamilyBackground;
  educational_background: EducationalBackground[];
  eligibility: Eligibility[];
  work_experience: WorkExperience[];
  voluntary_work: VoluntaryWork[];
  trainings: Training[];
  other_information: OtherInformation;
  completion_percentage: number;
  is_completed: boolean;
  last_saved_section: string | null;
  created_at: string;
  updated_at: string;
}

// PDS Section names
export type PDSSection =
  | 'personal-information'
  | 'family-background'
  | 'educational-background'
  | 'civil-service-eligibility'
  | 'work-experience'
  | 'voluntary-work'
  | 'learning-development'
  | 'other-information'
  | 'review';

// PDS Wizard Step
export interface PDSWizardStep {
  id: PDSSection;
  title: string;
  description: string;
  isComplete: boolean;
}
