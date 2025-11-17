import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDSData } from '@/types/pds.types';
import { formatDateOnly } from '@/lib/utils/dateFormatters';

/**
 * Generate a PDF document from PDS data
 * Based on CS Form No. 212, Revised 2025
 * @param pdsData - The PDS data to export
 * @param includeSignature - Whether to include the digital signature image (default: false)
 * @param returnDoc - Whether to return the document instead of auto-downloading (default: false)
 * @param useCurrentDate - Whether to use current date instead of original PDS date (default: false)
 */
export async function generatePDSPDF(pdsData: Partial<PDSData>, includeSignature: boolean = false, returnDoc: boolean = false, useCurrentDate: boolean = false): Promise<jsPDF | void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > 280) {
      doc.addPage();
      yPosition = 15;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONAL DATA SHEET', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(CS Form No. 212, Revised 2025)', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // I. PERSONAL INFORMATION
  if (pdsData.personalInfo) {
    const pi = pdsData.personalInfo;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I. PERSONAL INFORMATION', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const personalInfoData = [
      ['Full Name:', `${pi.surname}, ${pi.firstName} ${pi.middleName || ''} ${pi.nameExtension || ''}`.trim()],
      ['Date of Birth:', formatDateOnly(pi.dateOfBirth)],
      ['Place of Birth:', pi.placeOfBirth || 'N/A'],
      ['Sex:', pi.sexAtBirth || 'N/A'],
      ['Civil Status:', pi.civilStatus === 'Others' && pi.civilStatusOthers ? `${pi.civilStatus} (${pi.civilStatusOthers})` : pi.civilStatus || 'N/A'],
      ['Height:', pi.height ? `${pi.height}m` : 'N/A'],
      ['Weight:', pi.weight ? `${pi.weight}kg` : 'N/A'],
      ['Blood Type:', pi.bloodType || 'N/A'],
      ['Citizenship:', pi.citizenship || 'N/A'],
      ...(pi.citizenship === 'Dual Citizenship' ? [
        ['Dual Citizenship Type:', pi.dualCitizenshipType || 'N/A'],
        ['Dual Citizenship Country:', pi.dualCitizenshipCountry || 'N/A'],
      ] : []),
      ['Mobile No.:', pi.mobileNo || 'N/A'],
      ['Telephone No.:', pi.telephoneNo || 'N/A'],
      ['Email:', pi.emailAddress || 'N/A'],
      [
        'Residential Address:',
        [
          pi.residentialAddress?.houseBlockLotNo,
          pi.residentialAddress?.street,
          pi.residentialAddress?.subdivisionVillage,
          pi.residentialAddress?.barangay,
          pi.residentialAddress?.cityMunicipality,
          pi.residentialAddress?.province,
          pi.residentialAddress?.zipCode,
        ].filter(Boolean).join(', ') || 'N/A'
      ],
      [
        'Permanent Address:',
        pi.permanentAddress?.sameAsResidential
          ? 'Same as Residential Address'
          : [
              pi.permanentAddress?.houseBlockLotNo,
              pi.permanentAddress?.street,
              pi.permanentAddress?.subdivisionVillage,
              pi.permanentAddress?.barangay,
              pi.permanentAddress?.cityMunicipality,
              pi.permanentAddress?.province,
              pi.permanentAddress?.zipCode,
            ].filter(Boolean).join(', ') || 'N/A'
      ],
      ['UMID No.:', pi.umidNo || 'N/A'],
      ['Pag-IBIG No.:', pi.pagibigNo || 'N/A'],
      ['PhilHealth No.:', pi.philhealthNo || 'N/A'],
      ['PhilSys No.:', pi.philsysNo || 'N/A'],
      ['TIN No.:', pi.tinNo || 'N/A'],
      ['Agency Employee No.:', pi.agencyEmployeeNo || 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: personalInfoData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 135 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // II. FAMILY BACKGROUND
  if (pdsData.familyBackground) {
    checkPageBreak(50);
    const fb = pdsData.familyBackground;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('II. FAMILY BACKGROUND', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Spouse Information (detailed)
    const spouseData = fb.spouse ? [
      ['Spouse Name:', `${fb.spouse.surname}, ${fb.spouse.firstName} ${fb.spouse.middleName || ''}`.trim()],
      ['Occupation:', fb.spouse.occupation || 'N/A'],
      ['Employer/Business Name:', fb.spouse.employerBusinessName || 'N/A'],
      ['Business Address:', fb.spouse.businessAddress || 'N/A'],
      ['Telephone No.:', fb.spouse.telephoneNo || 'N/A'],
    ] : [
      ['Spouse:', 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: spouseData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 130 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 5;

    // Children Information (detailed table)
    if (fb.children && fb.children.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Children:', 14, yPosition);
      yPosition += 5;

      const childrenData = fb.children.map((child) => [
        child.fullName || 'N/A',
        formatDateOnly(child.dateOfBirth),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Full Name', 'Date of Birth']],
        body: childrenData,
        theme: 'striped',
        headStyles: { fillColor: [34, 165, 85], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    } else {
      doc.setFontSize(9);
      doc.text('Children: None', 14, yPosition);
      yPosition += 5;
    }

    // Parents Information
    const parentsData = [
      ['Father:', fb.father ? `${fb.father.surname}, ${fb.father.firstName} ${fb.father.middleName || ''}`.trim() : 'N/A'],
      ['Mother:', fb.mother ? `${fb.mother.surname}, ${fb.mother.firstName} ${fb.mother.middleName || ''}`.trim() : 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: parentsData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 130 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // III. EDUCATIONAL BACKGROUND
  if (pdsData.educationalBackground && pdsData.educationalBackground.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('III. EDUCATIONAL BACKGROUND', 14, yPosition);
    yPosition += 7;

    const educationData = pdsData.educationalBackground.map((edu) => [
      edu.level || 'N/A',
      edu.nameOfSchool || 'N/A',
      edu.basicEducationDegreeCourse || 'N/A',
      `${formatDateOnly(edu.periodOfAttendance?.from)} - ${formatDateOnly(edu.periodOfAttendance?.to)}`,
      edu.yearGraduated || edu.highestLevelUnitsEarned || 'N/A',
      edu.scholarshipAcademicHonors || 'None',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Level', 'School', 'Course/Degree', 'Period', 'Year Grad/Units', 'Honors/Scholarship']],
      body: educationData,
      theme: 'striped',
      headStyles: { fillColor: [34, 165, 85], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // IV. CIVIL SERVICE ELIGIBILITY
  if (pdsData.eligibility && pdsData.eligibility.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IV. CIVIL SERVICE ELIGIBILITY', 14, yPosition);
    yPosition += 7;

    const eligibilityData = pdsData.eligibility.map((elig) => [
      elig.careerService || 'N/A',
      elig.rating?.toString() || 'N/A',
      formatDateOnly(elig.dateOfExaminationConferment),
      elig.placeOfExaminationConferment || 'N/A',
      elig.licenseNumber || 'N/A',
      formatDateOnly(elig.licenseValidity),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Career Service', 'Rating', 'Date of Exam', 'Place', 'License No.', 'Validity']],
      body: eligibilityData,
      theme: 'striped',
      headStyles: { fillColor: [34, 165, 85], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 18 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 24 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // V. WORK EXPERIENCE
  if (pdsData.workExperience && pdsData.workExperience.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('V. WORK EXPERIENCE', 14, yPosition);
    yPosition += 7;

    const workData = pdsData.workExperience.map((work) => [
      work.positionTitle || 'N/A',
      work.departmentAgencyOfficeCompany || 'N/A',
      `${formatDateOnly(work.periodOfService?.from)} - ${formatDateOnly(work.periodOfService?.to)}`,
      work.monthlySalary || 'N/A',
      work.salaryGrade || 'N/A',
      work.stepIncrement || 'N/A',
      work.statusOfAppointment || 'N/A',
      work.governmentService ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Position', 'Company/Agency', 'Period', 'Salary', 'SG', 'Step', 'Status', 'Gov\'t']],
      body: workData,
      theme: 'striped',
      headStyles: { fillColor: [34, 165, 85], fontSize: 6.5 },
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 42 },
        2: { cellWidth: 32 },
        3: { cellWidth: 18 },
        4: { cellWidth: 10 },
        5: { cellWidth: 10 },
        6: { cellWidth: 23 },
        7: { cellWidth: 13 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // VI. VOLUNTARY WORK
  if (pdsData.voluntaryWork && pdsData.voluntaryWork.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VI. VOLUNTARY WORK', 14, yPosition);
    yPosition += 7;

    const voluntaryData = pdsData.voluntaryWork.map((vol) => [
      vol.organizationName || 'N/A',
      vol.organizationAddress || 'N/A',
      vol.positionNatureOfWork || 'N/A',
      `${formatDateOnly(vol.periodOfInvolvement?.from)} - ${formatDateOnly(vol.periodOfInvolvement?.to)}`,
      vol.numberOfHours ? `${vol.numberOfHours}h` : 'N/A',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Organization', 'Address', 'Position', 'Period', 'Hours']],
      body: voluntaryData,
      theme: 'striped',
      headStyles: { fillColor: [34, 165, 85], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 45 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // VII. LEARNING & DEVELOPMENT
  if (pdsData.trainings && pdsData.trainings.length > 0) {
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VII. LEARNING & DEVELOPMENT', 14, yPosition);
    yPosition += 7;

    const trainingData = pdsData.trainings.map((training) => [
      training.title || 'N/A',
      training.conductedSponsoredBy || 'N/A',
      `${formatDateOnly(training.periodOfAttendance?.from)} - ${formatDateOnly(training.periodOfAttendance?.to)}`,
      `${training.numberOfHours || 0}h`,
      training.typeOfLD || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Training Title', 'Conducted By', 'Period', 'Hours', 'Type of L&D']],
      body: trainingData,
      theme: 'striped',
      headStyles: { fillColor: [34, 165, 85], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 15 },
        4: { cellWidth: 35 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // VIII. OTHER INFORMATION
  if (pdsData.otherInformation) {
    checkPageBreak(50);
    const oi = pdsData.otherInformation;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VIII. OTHER INFORMATION', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const otherInfoData = [
      ['Skills:', oi.skills && oi.skills.length > 0 ? oi.skills.join(', ') : 'None'],
      ['Recognitions:', oi.recognitions && oi.recognitions.length > 0 ? oi.recognitions.join(', ') : 'None'],
      ['Memberships:', oi.memberships && oi.memberships.length > 0 ? oi.memberships.join(', ') : 'None'],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: otherInfoData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 135 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 5;

    // Government Issued ID
    if (oi.governmentIssuedId && oi.governmentIssuedId.type) {
      checkPageBreak(20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Government Issued ID:', 14, yPosition);
      yPosition += 5;

      const govIdData = [
        ['Type:', oi.governmentIssuedId.type || 'N/A'],
        ['ID Number:', oi.governmentIssuedId.idNumber || 'N/A'],
        ['Date Issued:', formatDateOnly(oi.governmentIssuedId.dateIssued)],
      ];

      autoTable(doc, {
        startY: yPosition,
        body: govIdData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 135 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    }

    // References (detailed table)
    if (oi.references && oi.references.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('References:', 14, yPosition);
      yPosition += 5;

      const referencesData = oi.references.map((ref) => [
        ref.name || 'N/A',
        ref.address || 'N/A',
        ref.telephoneNo || 'N/A',
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Full Name', 'Address', 'Telephone No.']],
        body: referencesData,
        theme: 'striped',
        headStyles: { fillColor: [34, 165, 85], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 80 },
          2: { cellWidth: 40 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    } else {
      doc.setFontSize(9);
      doc.text('References: None', 14, yPosition);
      yPosition += 5;
    }

    // Questions 34-40 (part of Section VIII in CS Form 212, Revised 2025)
    if (oi.relatedThirdDegree !== undefined || oi.guiltyAdministrativeOffense !== undefined) {
      checkPageBreak(80);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Questions (34-40):', 14, yPosition);
      yPosition += 5;

      const questionsData: any[] = [
        [
          '34a. Related by consanguinity/affinity to appointing authority within 3rd degree?',
          oi.relatedThirdDegree ? 'YES' : 'NO',
          oi.relatedThirdDegreeDetails || 'N/A'
        ],
        [
          '34b. Related by consanguinity/affinity within 4th degree (for LGU)?',
          oi.relatedFourthDegree ? 'YES' : 'NO',
          oi.relatedFourthDegreeDetails || 'N/A'
        ],
        [
          '35a. Have you ever been found guilty of any administrative offense?',
          oi.guiltyAdministrativeOffense ? 'YES' : 'NO',
          oi.guiltyAdministrativeOffenseDetails || 'N/A'
        ],
        [
          '35b. Have you been criminally charged before any court?',
          oi.criminallyCharged ? 'YES' : 'NO',
          oi.criminallyCharged
            ? `${oi.criminallyChargedDetails || 'N/A'}${oi.criminallyChargedDateFiled ? ' | Date: ' + formatDateOnly(oi.criminallyChargedDateFiled) : ''}${oi.criminallyChargedStatus ? ' | Status: ' + oi.criminallyChargedStatus : ''}`
            : 'N/A'
        ],
        [
          '36. Have you ever been convicted of any crime or violation?',
          oi.convicted ? 'YES' : 'NO',
          oi.convictedDetails || 'N/A'
        ],
        [
          '37. Have you ever been separated from service (resignation, retirement, etc.)?',
          oi.separatedFromService ? 'YES' : 'NO',
          oi.separatedFromServiceDetails || 'N/A'
        ],
        [
          '38a. Have you ever been a candidate in a national/local election (except Barangay)?',
          oi.candidateNationalLocal ? 'YES' : 'NO',
          oi.candidateNationalLocalDetails || 'N/A'
        ],
        [
          '38b. Have you resigned from government service during candidacy?',
          oi.resignedForCandidacy ? 'YES' : 'NO',
          oi.resignedForCandidacyDetails || 'N/A'
        ],
        [
          '39. Have you acquired the status of immigrant or permanent resident?',
          oi.immigrantOrPermanentResident ? 'YES' : 'NO',
          oi.immigrantOrPermanentResidentCountry || 'N/A'
        ],
        [
          '40a. Are you a member of any indigenous group?',
          oi.indigenousGroupMember ? 'YES' : 'NO',
          oi.indigenousGroupName || 'N/A'
        ],
        [
          '40b. Are you a person with disability?',
          oi.personWithDisability ? 'YES' : 'NO',
          oi.pwdIdNumber ? `ID: ${oi.pwdIdNumber}` : 'N/A'
        ],
        [
          '40c. Are you a solo parent?',
          oi.soloParent ? 'YES' : 'NO',
          oi.soloParentIdNumber ? `ID: ${oi.soloParentIdNumber}` : 'N/A'
        ],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Question', 'Answer', 'Details']],
        body: questionsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 165, 85], fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 90 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    }

    yPosition += 3;
  }

  // DECLARATION
  checkPageBreak(40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DECLARATION', 14, yPosition);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const declarationText = 'I declare under oath that this Personal Data Sheet has been accomplished by me, and is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines.';
  const splitText = doc.splitTextToSize(declarationText, pageWidth - 28);
  doc.text(splitText, 14, yPosition);
  yPosition += splitText.length * 4 + 10;

  // Signature
  if (pdsData.otherInformation?.declaration?.dateAccomplished) {
    doc.setFontSize(9);

    // Define consistent layout positions for perfect alignment
    const signatureStartY = yPosition;
    const underlineY = signatureStartY;        // Y position for underlines
    const labelY = signatureStartY + 5;        // Y position for labels (consistent for both sides)

    // Left side - Signature
    if (includeSignature && (pdsData.otherInformation.declaration.signatureData || pdsData.otherInformation.declaration.signatureUrl)) {
      try {
        let signatureImageData = pdsData.otherInformation.declaration.signatureData;

        // If no Base64 data but we have a storage URL, fetch it
        if (!signatureImageData && pdsData.otherInformation.declaration.signatureUrl) {
          try {
            // Fetch signature from storage via API
            const response = await fetch('/api/pds/signature');
            const result = await response.json();

            if (result.success && result.data.signatureUrl) {
              // Fetch the actual image from signed URL
              const imageResponse = await fetch(result.data.signatureUrl);
              const imageBlob = await imageResponse.blob();

              // Convert Blob to Base64
              signatureImageData = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(imageBlob);
              });
            }
          } catch (fetchError) {
            console.error('Failed to fetch signature from storage:', fetchError);
          }
        }

        // If we have signature data (either from Base64 or fetched from storage), embed it
        if (signatureImageData) {
          // Position signature image above where the underline would be
          const imageY = signatureStartY - 10;
          const imageWidth = 50;
          const imageHeight = 12;

          // Embed the actual signature image
          doc.addImage(
            signatureImageData,
            'PNG',
            14,
            imageY,
            imageWidth,
            imageHeight
          );

          // Draw a subtle line under the signature image for consistency
          doc.setLineWidth(0.3);
          doc.line(14, underlineY, 14 + imageWidth, underlineY);
        } else {
          // Fallback if signature couldn't be loaded
          doc.text('______________________________', 14, underlineY);
        }

      } catch (error) {
        console.error('Failed to embed signature image:', error);
        // Fallback to empty line if image embedding fails
        doc.text('______________________________', 14, underlineY);
      }
    } else {
      // No signature or includeSignature is false - show empty line for wet signature
      doc.text('______________________________', 14, underlineY);
    }

    // Signature label - ALWAYS at consistent position
    doc.text('Signature', 14, labelY);

    // Right side - Date (ALWAYS same structure for consistency)
    // Use current date in Philippine timezone if useCurrentDate is true, otherwise use original PDS date
    const dateToShow = useCurrentDate
      ? new Date().toLocaleDateString('en-CA', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) // Returns YYYY-MM-DD format in Philippine timezone
      : pdsData.otherInformation.declaration.dateAccomplished;

    doc.text('______________________________', pageWidth - 70, underlineY);
    doc.text(`Date: ${formatDateOnly(dateToShow)}`, pageWidth - 70, labelY);

    // Move position down after signature section
    yPosition = labelY + 5;
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${totalPages} | Generated by JobSync`,
      pageWidth / 2,
      285,
      { align: 'center' }
    );
  }

  // If returnDoc is true, return the document for API use
  if (returnDoc) {
    return doc;
  }

  // Otherwise, generate filename and auto-download
  const surname = pdsData.personalInfo?.surname || 'Unknown';
  const firstName = pdsData.personalInfo?.firstName || 'User';
  const fileName = `PDS_${surname}_${firstName}_${new Date().getTime()}.pdf`;

  // Save the PDF
  doc.save(fileName);
}
