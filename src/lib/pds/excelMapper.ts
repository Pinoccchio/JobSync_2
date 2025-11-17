/**
 * Excel Cell Mapping Configuration for PDS 2025
 * Maps PDS data fields to specific cells in the official CSC template
 * Updated for xlsx-populate compatibility
 */

/**
 * SHEET C1 - PERSONAL INFORMATION, FAMILY BACKGROUND & EDUCATIONAL BACKGROUND
 */
export const SHEET_C1_MAPPING = {
  // Section I: Personal Information
  personalInfo: {
    // Names (Rows 10-12)
    surname: 'D10',
    firstName: 'D11',
    middleName: 'D12',
    nameExtension: 'L12', // JR., SR., III, etc.

    // Birth Information (Rows 13-15)
    dateOfBirth: 'D13',
    placeOfBirth: 'D15',

    // Sex (Row 16) - Checkboxes
    sexMale: '',
    sexFemale: '',

    // Civil Status (Row 17-18) - Checkboxes
    civilStatusSingle: '',
    civilStatusMarried: '',
    civilStatusWidowed: '',
    civilStatusSeparated: '',
    civilStatusOthers: '',
    civilStatusOthersText: '',

    // Physical Attributes (Rows 22-26)
    height: 'D22',
    weight: 'D24',
    bloodType: 'D25',

    // Government IDs (Rows 27-34)
    umidNo: 'D27',
    pagibigNo: 'D29',
    philhealthNo: 'D31',
    sssNo: 'D32',
    tinNo: 'D33',
    agencyEmployeeNo: 'D34',
    philsysNo: 'D32',

    // Citizenship (Rows 13-14) - Checkboxes and details
    citizenshipFilipino: '',
    citizenshipDualByBirth: '',
    citizenshipDualByNaturalization: '',
    dualCitizenshipCountry: '',

    // Residential Address (Rows 17-24)
    residentialHouseNo: 'I17',
    residentialStreet: 'L17',
    residentialSubdivision: 'I19',
    residentialBarangay: 'L19',
    residentialCity: 'I22',
    residentialProvince: 'L22',
    residentialZipCode: 'I24',

    // Permanent Address (Rows 25-31)
    permanentHouseNo: 'I25',
    permanentStreet: 'L25',
    permanentSubdivision: 'I27',
    permanentBarangay: 'L27',
    permanentCity: 'I29',
    permanentProvince: 'L29',
    permanentZipCode: 'I31',

    // Contact Information (Rows 32-34)
    telephoneNo: 'I32',
    mobileNo: 'I33',
    emailAddress: 'I34',
  },

  // Section II: Family Background
  familyBackground: {
    // Spouse Information (Rows 36-42)
    spouseSurname: 'D36',
    spouseFirstName: 'D37',
    spouseMiddleName: 'D38',
    spouseOccupation: 'D39',
    spouseEmployer: 'D40',
    spouseBusinessAddress: 'D41',
    spouseTelephone: 'D42',

    // Father's Name (Rows 43-45)
    fatherSurname: 'D43',
    fatherFirstName: 'D44',
    fatherMiddleName: 'D45',

    // Mother's Maiden Name (Rows 47-49)
    motherSurname: 'D47',
    motherFirstName: 'D48',
    motherMiddleName: 'D49',

    // Children (starts at Row 37)
    childrenStartRow: 37,
    childrenEndRow: 48,
    childNameColumn: 'I',
    childDOBColumn: 'M',
  },

  // Section III: Educational Background
  educationalBackground: {
    startRow: 54,
    columns: {
      level: 'B',
      nameOfSchool: 'D',
      basicEducation: 'G',
      from: 'J',
      to: 'K',
      highestLevel: 'L',
      yearGraduated: 'M',
      scholarship: 'N',
    },
    maxRows: 5,
  },
};

/**
 * SHEET C2 - CIVIL SERVICE ELIGIBILITY & WORK EXPERIENCE
 */
export const SHEET_C2_MAPPING = {
  // Section IV: Civil Service Eligibility
  eligibility: {
    startRow: 5,
    columns: {
      careerService: 'A',
      rating: 'F',
      dateOfExam: 'G',
      placeOfExam: 'I',
      licenseNumber: 'J',
      licenseValidity: 'K',
    },
    maxRows: 7,
  },

  // Section V: Work Experience
  workExperience: {
    startRow: 18,
    columns: {
      from: 'A',
      to: 'C',
      positionTitle: 'D',
      department: 'G',
     
      statusOfAppointment: 'J',
      govService: 'K',
    },
    maxRows: 28,
  },
};

/**
 * SHEET C3 - VOLUNTARY WORK & TRAINING PROGRAMS
 */
export const SHEET_C3_MAPPING = {
  // Section VI: Voluntary Work
  voluntaryWork: {
    startRow: 6,
    columns: {
      organizationName: 'A',
      from: 'E',
      to: 'F',
      numberOfHours: 'G',
      position: 'H',
    },
    maxRows: 8,
  },

  // Section VII: Learning & Development (Training)
  trainings: {
    startRow: 18,
    columns: {
      title: 'A',
      from: 'E',
      to: 'F',
      numberOfHours: 'G',
      typeOfLD: 'H',
      conductedBy: 'I',
    },
    maxRows: 20,
  },

  // Special Skills and Hobbies (starts Row 2)
  skills: {
    startRow: 42,
    column: 'A',
    maxRows: 7,
  },

  // Non-Academic Distinctions (Row 10+)
  recognitions: {
    startRow: 42,
    column: 'C',
    maxRows: 7,
  },

  // Memberships (Row 18+)
  memberships: {
    startRow: 42,
    column: 'I',
    maxRows: 7,
  },
};

/**
 * SHEET C4 - OTHER INFORMATION & QUESTIONS
 */
export const SHEET_C4_MAPPING = {
  
  // Questions 34-40
  questions: {
    // Q34a: Related within 3rd degree
    q34a_yes: '',
    q34a_no: '',
    q34a_details: 'I11',

    // Q34b: Related within 4th degree (LGU)
    q34b_yes: '',
    q34b_no: '',
    q34b_details: '',

    // Q35a: Found guilty of administrative offense
    q35a_yes: '',
    q35a_no: '',
    q35a_details: 'I15',

    // Q35b: Criminally charged
    q35b_yes: '',
    q35b_no: '',
    q35b_details: 'C40',
    q35b_dateFiled: 'K20',
    q35b_status: 'K21',

    // Q36: Convicted of any crime
    q36_yes: '',
    q36_no: '',
    q36_details: 'I25',

    // Q37: Separated from service
    q37_yes: '',
    q37_no: '',
    q37_details: 'I29',

    // Q38a: Candidate in election
    q38a_yes: '',
    q38a_no: '',
    q38a_details: 'K32',

    // Q38b: Resigned for candidacy
    q38b_yes: '',
    q38b_no: '',
    q38b_details: 'K35',

    // Q39: Immigrant or permanent resident
    q39_yes: '',
    q39_no: '',
    q39_country: 'I39',

    // Q40a: Indigenous group member
    q40a_yes: '',
    q40a_no: '',
    q40a_group: 'L44',

    // Q40b: Person with disability
    q40b_yes: '',
    q40b_no: '',
    q40b_id: 'L46',

    // Q40c: Solo parent
    q40c_yes: '',
    q40c_no: '',
    q40c_id: 'L48',
  },

  // References (Row 78+)
  references: {
    startRow: 52,
    columns: {
      name: 'A',
      address: 'F',
      telephone: 'G',
    },
    maxRows: 3,
  },

  // Government Issued ID (Row 85+)
  governmentId: {
    type: 'D61',
    idNumber: 'D62',
    dateIssued: 'D64',
  },

  // Declaration (Row 90+)
  declaration: {
    date: 'F64',
    signaturePlaceholder: 'C92',
  },
};

/**
 * Checkbox character constants
 */
export const CHECKBOX = {
  CHECKED: '☑',
  UNCHECKED: '☐',
  YES: '☑',
  NO: '☐',
};

/**
 * Helper function: Extract first cell from a range
 * xlsx-populate can handle ranges, but for consistency we use first cell
 */
export function firstCell(ref: string): string {
  return ref.split(':')[0];
}

/**
 * Helper function: Get first column letter from a range
 */
export function firstColumn(ref: string): string {
  return ref.split(':')[0].replace(/[0-9]/g, '');
}

/**
 * Helper function to convert column letter to index
 */
export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
}

/**
 * Helper function to convert cell reference to row/col indices
 */
export function cellRefToIndices(cellRef: string): { row: number; col: number } {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }

  const col = columnLetterToIndex(match[1]);
  const row = parseInt(match[2], 10) - 1; // Convert to 0-based index

  return { row, col };
}

/**
 * Helper function to create cell reference from row/col indices
 */
export function indicesToCellRef(row: number, col: number): string {
  let colLetter = '';
  let c = col + 1; // Convert to 1-based

  while (c > 0) {
    const remainder = (c - 1) % 26;
    colLetter = String.fromCharCode('A'.charCodeAt(0) + remainder) + colLetter;
    c = Math.floor((c - 1) / 26);
  }

  return `${colLetter}${row + 1}`;
}

/**
 * Sheet names in the PDS template
 */
export const SHEET_NAMES = {
  C1: 'C1',
  C2: 'C2', 
  C3: 'C3',
  C4: 'C4'
} as const;

/**
 * Template validation functions
 */
export const TemplateValidator = {
  /**
   * Validate if all required sheets exist in the workbook
   */
  validateWorkbookStructure(workbook: any): boolean {
    const sheetNames = workbook.sheets().map((sheet: any) => sheet.name());
    const requiredSheets = Object.values(SHEET_NAMES);
    
    return requiredSheets.every(sheet => sheetNames.includes(sheet));
  },

  /**
   * Validate if a cell reference is valid
   */
  isValidCellRef(ref: string): boolean {
    return /^[A-Z]+\d+$/.test(ref);
  },

  /**
   * Validate if a range reference is valid
   */
  isValidRangeRef(ref: string): boolean {
    return /^[A-Z]+\d+:[A-Z]+\d+$/.test(ref);
  }
};

/**
 * Data transformation utilities for PDS-specific formatting
 */
export const PDSDataTransformer = {
  /**
   * Format height from meters to centimeters for display
   */
  formatHeight(heightInMeters: number): string {
    if (!heightInMeters) return '';
    const heightInCm = Math.round(heightInMeters * 100);
    return `${heightInCm} cm`;
  },

  /**
   * Format weight for display
   */
  formatWeight(weightInKg: number): string {
    if (!weightInKg) return '';
    return `${weightInKg} kg`;
  },

  /**
   * Format salary for display
   */
  formatSalary(amount: number): string {
    if (!amount) return '';
    return `₱${amount.toLocaleString()}`;
  },

  /**
   * Format hours for display
   */
  formatHours(hours: number): string {
    if (!hours) return '';
    return `${hours} hours`;
  },

  /**
   * Format date for CSC format (DD/MM/YYYY)
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  },

  /**
   * Format year only from date
   */
  formatYear(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.getFullYear().toString();
    } catch {
      return dateString;
    }
  }
};

/**
 * Checkbox utilities for handling checkbox fields
 */
export const CheckboxUtils = {
  /**
   * Set checkbox value based on boolean
   */
  setCheckbox(workbook: any, sheetName: string, cellRef: string, isChecked: boolean): void {
    const sheet = workbook.sheet(sheetName);
    sheet.cell(cellRef).value(isChecked ? CHECKBOX.CHECKED : CHECKBOX.UNCHECKED);
  },

  /**
   * Set sex checkbox (mutually exclusive)
   */
  setSex(workbook: any, sex: string): void {
    const sheet = workbook.sheet('C1');
    const mapping = SHEET_C1_MAPPING.personalInfo;
    
    // Clear both first
    sheet.cell(mapping.sexMale).value(CHECKBOX.UNCHECKED);
    sheet.cell(mapping.sexFemale).value(CHECKBOX.UNCHECKED);
    
    // Set the appropriate one
    if (sex === 'male') {
      sheet.cell(mapping.sexMale).value(CHECKBOX.CHECKED);
    } else if (sex === 'female') {
      sheet.cell(mapping.sexFemale).value(CHECKBOX.CHECKED);
    }
  },

  /**
   * Set civil status checkbox (mutually exclusive)
   */
  setCivilStatus(workbook: any, civilStatus: string): void {
    const sheet = workbook.sheet('C1');
    const mapping = SHEET_C1_MAPPING.personalInfo;
    
    // Clear all first
    sheet.cell(mapping.civilStatusSingle).value(CHECKBOX.UNCHECKED);
    sheet.cell(mapping.civilStatusMarried).value(CHECKBOX.UNCHECKED);
    sheet.cell(mapping.civilStatusWidowed).value(CHECKBOX.UNCHECKED);
    sheet.cell(mapping.civilStatusSeparated).value(CHECKBOX.UNCHECKED);
    sheet.cell(mapping.civilStatusOthers).value(CHECKBOX.UNCHECKED);
    
    // Set the appropriate one
    switch (civilStatus) {
      case 'single':
        sheet.cell(mapping.civilStatusSingle).value(CHECKBOX.CHECKED);
        break;
      case 'married':
        sheet.cell(mapping.civilStatusMarried).value(CHECKBOX.CHECKED);
        break;
      case 'widowed':
        sheet.cell(mapping.civilStatusWidowed).value(CHECKBOX.CHECKED);
        break;
      case 'separated':
        sheet.cell(mapping.civilStatusSeparated).value(CHECKBOX.CHECKED);
        break;
      case 'others':
        sheet.cell(mapping.civilStatusOthers).value(CHECKBOX.CHECKED);
        break;
    }
  },

  /**
   * Set yes/no question checkbox
   */
  setYesNoQuestion(workbook: any, sheetName: string, yesCell: string, noCell: string, isYes: boolean): void {
    const sheet = workbook.sheet(sheetName);
    sheet.cell(yesCell).value(isYes ? CHECKBOX.CHECKED : CHECKBOX.UNCHECKED);
    sheet.cell(noCell).value(isYes ? CHECKBOX.UNCHECKED : CHECKBOX.CHECKED);
  }
};

export default {
  SHEET_C1_MAPPING,
  SHEET_C2_MAPPING,
  SHEET_C3_MAPPING,
  SHEET_C4_MAPPING,
  CHECKBOX,
  firstCell,
  firstColumn,
  SHEET_NAMES,
  TemplateValidator,
  PDSDataTransformer,
  CheckboxUtils
};