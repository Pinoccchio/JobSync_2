'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { PDSDownloadModal } from '@/components/PDS/PDSDownloadModal';
import { formatAddress, formatPermanentAddress } from '@/lib/utils/formatAddress';
import { ensureArray, ensureString } from '@/lib/utils/dataTransformers';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface PDSViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdsData: any;
  applicantName: string;
}

export function PDSViewModal({ isOpen, onClose, pdsData, applicantName }: PDSViewModalProps) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(false);

  // Fetch signed URL for signature when modal opens
  useEffect(() => {
    const fetchSignatureUrl = async () => {
      if (!pdsData?.signature_url || !isOpen) {
        setSignatureUrl(null);
        return;
      }

      setLoadingSignature(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('pds-signatures')
          .createSignedUrl(pdsData.signature_url, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignatureUrl(null);
        } else {
          setSignatureUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error fetching signature:', error);
        setSignatureUrl(null);
      } finally {
        setLoadingSignature(false);
      }
    };

    fetchSignatureUrl();
  }, [pdsData?.signature_url, isOpen]);

  if (!pdsData) return null;

  const personalInfo = pdsData.personal_info || {};
  let familyBackground = pdsData.family_background || {};
  const educationalBackground = ensureArray(pdsData.educational_background);
  const workExperience = ensureArray(pdsData.work_experience);
  const eligibility = ensureArray(pdsData.eligibility);
  const trainings = ensureArray(pdsData.trainings);
  const voluntaryWork = ensureArray(pdsData.voluntary_work);
  let otherInformation = pdsData.other_information || {};

  const handleDownloadClick = () => {
    if (pdsData.id) {
      setIsDownloadModalOpen(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Personal Data Sheet (CS Form 212)"
      showFooter={false}
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Applicant Name Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{applicantName}</h2>
                {pdsData.signature_url && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Digitally Signed
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Civil Service Form 212 - Revised 2025</p>
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadClick}
              title="Download PDS"
            >
              Download PDS
            </Button>
          </div>
        </div>

        {/* Personal Information */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            {/* Name Fields */}
            <InfoRow label="Surname" value={personalInfo.surname} />
            <InfoRow label="First Name" value={personalInfo.firstName} />
            <InfoRow label="Middle Name" value={personalInfo.middleName} />
            <InfoRow label="Name Extension" value={personalInfo.nameExtension} />

            {/* Birth Information */}
            <InfoRow label="Date of Birth" value={personalInfo.dateOfBirth} icon={<Calendar className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Place of Birth" value={personalInfo.placeOfBirth} icon={<MapPin className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Sex at Birth" value={personalInfo.sexAtBirth} />

            {/* Civil Status */}
            <InfoRow label="Civil Status" value={personalInfo.civilStatus} />
            {personalInfo.civilStatusOthers && (
              <InfoRow label="Civil Status Details" value={personalInfo.civilStatusOthers} />
            )}

            {/* Physical Attributes */}
            <InfoRow label="Height (m)" value={personalInfo.height} />
            <InfoRow label="Weight (kg)" value={personalInfo.weight} />
            <InfoRow label="Blood Type" value={personalInfo.bloodType} />

            {/* Government IDs */}
            <InfoRow label="UMID No." value={personalInfo.umidNo} />
            <InfoRow label="Pag-IBIG No." value={personalInfo.pagibigNo} />
            <InfoRow label="PhilHealth No." value={personalInfo.philhealthNo} />
            <InfoRow label="PhilSys No." value={personalInfo.philsysNo} />
            <InfoRow label="TIN No." value={personalInfo.tinNo} />
            <InfoRow label="Agency Employee No." value={personalInfo.agencyEmployeeNo} />

            {/* Citizenship */}
            <InfoRow label="Citizenship" value={personalInfo.citizenship} />
            {personalInfo.citizenship === 'Dual Citizenship' && (
              <>
                <InfoRow label="Dual Citizenship Type" value={personalInfo.dualCitizenshipType} />
                <InfoRow label="Dual Citizenship Country" value={personalInfo.dualCitizenshipCountry} />
              </>
            )}

            {/* Contact Information */}
            <InfoRow label="Telephone No." value={personalInfo.telephoneNo} icon={<Phone className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Mobile Number" value={personalInfo.mobileNumber || personalInfo.mobileNo} icon={<Phone className="w-4 h-4 text-gray-400" />} />
            <InfoRow label="Email" value={personalInfo.email || personalInfo.emailAddress} icon={<Mail className="w-4 h-4 text-gray-400" />} />

            {/* Addresses */}
            <InfoRow label="Residential Address" value={formatAddress(personalInfo.residentialAddress)} className="col-span-2" />
            <InfoRow label="Permanent Address" value={formatPermanentAddress(personalInfo.permanentAddress, personalInfo.residentialAddress)} className="col-span-2" />
          </div>
        </section>

        {/* Digital Signature - Prominent Display */}
        {pdsData.signature_url && (
          <section className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg shadow-md">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Digital Signature</h3>
                  <p className="text-xs text-green-700">This PDS has been digitally signed by the applicant</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-green-200 shadow-inner">
                <div className="flex flex-col items-center">
                  {loadingSignature ? (
                    <div className="flex items-center gap-3 text-gray-600 py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                      <span className="text-sm font-medium">Loading signature...</span>
                    </div>
                  ) : signatureUrl ? (
                    <div className="text-center">
                      <img
                        src={signatureUrl}
                        alt="Digital Signature"
                        className="max-h-[200px] max-w-[400px] object-contain border-2 border-gray-300 rounded-lg bg-white p-4 shadow-sm"
                      />
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {pdsData.signature_uploaded_at && (
                          <p className="text-sm text-gray-700 font-medium">
                            <Calendar className="w-4 h-4 inline mr-1 text-green-600" />
                            Signed on: {new Date(pdsData.signature_uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-red-600 font-medium">Unable to load signature</p>
                      <p className="text-xs text-gray-500 mt-1">The signature file may be temporarily unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Family Background */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Family Background</h3>
          </div>
          <div className="space-y-4">
            {/* Spouse Information */}
            {familyBackground.spouse && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Spouse Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Surname" value={familyBackground.spouse.surname} />
                  <InfoRow label="First Name" value={familyBackground.spouse.firstName} />
                  <InfoRow label="Middle Name" value={familyBackground.spouse.middleName} />
                  <InfoRow label="Name Extension" value={familyBackground.spouse.nameExtension} />
                  <InfoRow label="Occupation" value={familyBackground.spouse.occupation} className="col-span-2" />
                  <InfoRow label="Employer/Business" value={familyBackground.spouse.employerBusinessName} className="col-span-2" />
                  <InfoRow label="Business Address" value={familyBackground.spouse.businessAddress} className="col-span-2" />
                  <InfoRow label="Telephone No." value={familyBackground.spouse.telephoneNo} icon={<Phone className="w-4 h-4 text-gray-400" />} />
                </div>
              </div>
            )}

            {/* Children */}
            {ensureArray(familyBackground.children).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Children</p>
                <div className="space-y-2">
                  {ensureArray(familyBackground.children).map((child: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-sm font-medium text-gray-900">{child.fullName || 'N/A'}</span>
                      <span className="text-sm text-gray-600">{child.dateOfBirth || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Father Information */}
            {familyBackground.father && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Father Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Surname" value={familyBackground.father.surname} />
                  <InfoRow label="First Name" value={familyBackground.father.firstName} />
                  <InfoRow label="Middle Name" value={familyBackground.father.middleName} />
                  <InfoRow label="Name Extension" value={familyBackground.father.nameExtension} />
                </div>
              </div>
            )}

            {/* Mother Information */}
            {familyBackground.mother && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Mother's Maiden Name</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Surname" value={familyBackground.mother.surname} />
                  <InfoRow label="First Name" value={familyBackground.mother.firstName} />
                  <InfoRow label="Middle Name" value={familyBackground.mother.middleName} />
                </div>
              </div>
            )}

            {!familyBackground.spouse && !familyBackground.father && !familyBackground.mother && (
              <p className="text-gray-500 text-sm">No family background provided</p>
            )}
          </div>
        </section>

        {/* Educational Background */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Educational Background</h3>
          </div>
          {educationalBackground.length > 0 ? (
            <div className="space-y-3">
              {educationalBackground.map((edu: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{edu.level || 'N/A'}</p>
                      <p className="text-sm text-gray-700">{edu.nameOfSchool || edu.schoolName || 'N/A'}</p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {edu.periodOfAttendance?.from || edu.periodFrom} - {edu.periodOfAttendance?.to || edu.periodTo}
                    </span>
                  </div>
                  {(edu.basicEducationDegreeCourse || edu.basicEducation || edu.degreeEarned || edu.basicEdDegreeCourse) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Course/Degree:</span> {edu.basicEducationDegreeCourse || edu.basicEducation || edu.degreeEarned || edu.basicEdDegreeCourse}
                    </p>
                  )}
                  {(edu.highestLevelUnitsEarned || edu.unitsEarned) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Highest Level/Units Earned:</span> {edu.highestLevelUnitsEarned || edu.unitsEarned}
                    </p>
                  )}
                  {edu.yearGraduated && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Year Graduated:</span> {edu.yearGraduated}
                    </p>
                  )}
                  {edu.scholarshipAcademicHonors && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Scholarship/Academic Honors:</span> {edu.scholarshipAcademicHonors}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No educational background provided</p>
          )}
        </section>

        {/* Work Experience */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
          </div>
          {workExperience.length > 0 ? (
            <div className="space-y-3">
              {workExperience.map((work: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{work.positionTitle || 'N/A'}</p>
                      <p className="text-sm text-gray-700">{work.departmentAgencyOfficeCompany || work.department || work.company || work.companyName || 'N/A'}</p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {work.periodOfService?.from || work.fromDate || work.periodFrom} - {work.periodOfService?.to || work.toDate || work.periodTo || 'Present'}
                    </span>
                  </div>
                  {work.monthlySalary && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Monthly Salary:</span> ₱{parseFloat(work.monthlySalary).toLocaleString()}
                    </p>
                  )}
                  {work.salaryGrade && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Salary Grade:</span> {work.salaryGrade}
                    </p>
                  )}
                  {(work.statusOfAppointment || work.appointmentStatus) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status of Appointment:</span> {work.statusOfAppointment || work.appointmentStatus}
                    </p>
                  )}
                  {(work.governmentService !== undefined || work.govtService !== undefined) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Government Service:</span> {(work.governmentService || work.govtService) ? 'Yes' : 'No'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No work experience provided</p>
          )}
        </section>

        {/* Voluntary Work */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-semibold text-gray-900">Voluntary Work & Civic Involvement</h3>
          </div>
          {voluntaryWork.length > 0 ? (
            <div className="space-y-3">
              {voluntaryWork.map((work: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-pink-500">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{work.organizationName || 'N/A'}</p>
                      <p className="text-sm text-gray-700 mb-2">{work.organizationAddress || 'N/A'}</p>
                    </div>
                    <span className="text-sm text-gray-600 ml-4 whitespace-nowrap">
                      {work.periodOfInvolvement?.from || work.fromDate} - {work.periodOfInvolvement?.to || work.toDate || 'Present'}
                    </span>
                  </div>
                  {work.positionNatureOfWork && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Position/Nature of Work:</span> {work.positionNatureOfWork}
                    </p>
                  )}
                  {work.numberOfHours && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Hours:</span> {work.numberOfHours} hours
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No voluntary work records provided</p>
          )}
        </section>

        {/* Eligibilities */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Civil Service Eligibility</h3>
          </div>
          {eligibility.length > 0 ? (
            <div className="space-y-3">
              {eligibility.map((elig: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">{elig.careerService || elig.eligibilityTitle || 'N/A'}</p>
                    <span className="text-sm text-gray-600">
                      {elig.dateOfExaminationConferment || elig.examDate}
                    </span>
                  </div>
                  {elig.rating && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Rating:</span> {elig.rating}%
                    </p>
                  )}
                  {(elig.placeOfExaminationConferment || elig.placeOfExam) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Place of Examination/Conferment:</span> {elig.placeOfExaminationConferment || elig.placeOfExam}
                    </p>
                  )}
                  {elig.licenseNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">License Number:</span> {elig.licenseNumber}
                    </p>
                  )}
                  {elig.licenseValidity && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">License Validity:</span> {elig.licenseValidity}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No eligibility records provided</p>
          )}
        </section>

        {/* Trainings */}
        {trainings.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Learning & Development</h3>
            </div>
            <div className="space-y-3">
              {trainings.map((training: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-teal-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">{training.title || 'N/A'}</p>
                    <span className="text-sm text-gray-600">
                      {training.periodOfAttendance?.from || training.fromDate} - {training.periodOfAttendance?.to || training.toDate}
                    </span>
                  </div>
                  {training.numberOfHours && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Number of Hours:</span> {training.numberOfHours}
                    </p>
                  )}
                  {(training.typeOfLD || training.type) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type of L&D:</span> {training.typeOfLD || training.type}
                    </p>
                  )}
                  {(training.conductedSponsoredBy || training.conductedBy) && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Conducted/Sponsored By:</span> {training.conductedSponsoredBy || training.conductedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Other Information */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Other Information</h3>
          </div>
          <div className="space-y-4">
            {/* Skills & Hobbies */}
            {ensureArray(otherInformation.skills).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Special Skills & Hobbies</p>
                <div className="flex flex-wrap gap-2">
                  {ensureArray(otherInformation.skills).map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {ensureString(skill)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Academic Distinctions/Recognition */}
            {ensureArray(otherInformation.recognitions).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Non-Academic Distinctions/Recognition</p>
                <ul className="space-y-2">
                  {ensureArray(otherInformation.recognitions).map((recognition: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <Award className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>{ensureString(recognition)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Memberships in Associations/Organizations */}
            {ensureArray(otherInformation.memberships).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Memberships in Associations/Organizations</p>
                <ul className="space-y-2">
                  {ensureArray(otherInformation.memberships).map((membership: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <User className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>{ensureString(membership)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* References */}
            {ensureArray(otherInformation.references).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Character References</p>
                <div className="space-y-3">
                  {ensureArray(otherInformation.references).map((reference: any, index: number) => (
                    <div key={index} className="pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-900">{reference.name || 'N/A'}</p>
                      <p className="text-sm text-gray-700">{reference.address || 'N/A'}</p>
                      {reference.telephoneNo && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {reference.telephoneNo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Government Issued ID */}
            {otherInformation.governmentIssuedId && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-700 mb-3">Government Issued ID</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="ID Type" value={otherInformation.governmentIssuedId.type} />
                  <InfoRow label="ID Number" value={otherInformation.governmentIssuedId.idNumber} />
                  <InfoRow label="Date Issued" value={otherInformation.governmentIssuedId.dateIssued} />
                </div>
              </div>
            )}

            {ensureArray(otherInformation.skills).length === 0 &&
             ensureArray(otherInformation.recognitions).length === 0 &&
             ensureArray(otherInformation.memberships).length === 0 &&
             ensureArray(otherInformation.references).length === 0 &&
             !otherInformation.governmentIssuedId && (
              <p className="text-gray-500 text-sm">No other information provided</p>
            )}
          </div>
        </section>

        {/* Questions (34-40) */}
        {otherInformation && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Questions (34-40)</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">34a. Related within 3rd degree:</span> {otherInformation.relatedThirdDegree ? 'Yes' : 'No'}
                </p>
                {otherInformation.relatedThirdDegree && otherInformation.relatedThirdDegreeDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.relatedThirdDegreeDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">34b. Related within 4th degree (LGU):</span> {otherInformation.relatedFourthDegree ? 'Yes' : 'No'}
                </p>
                {otherInformation.relatedFourthDegree && otherInformation.relatedFourthDegreeDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.relatedFourthDegreeDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">35a. Guilty of administrative offense:</span> {otherInformation.guiltyAdministrativeOffense ? 'Yes' : 'No'}
                </p>
                {otherInformation.guiltyAdministrativeOffense && otherInformation.guiltyAdministrativeOffenseDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.guiltyAdministrativeOffenseDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">35b. Criminally charged:</span> {otherInformation.criminallyCharged ? 'Yes' : 'No'}
                </p>
                {otherInformation.criminallyCharged && (
                  <>
                    {otherInformation.criminallyChargedDetails && (
                      <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.criminallyChargedDetails}</p>
                    )}
                    {otherInformation.criminallyChargedDateFiled && (
                      <p className="text-sm text-gray-600 pl-4">Date Filed: {otherInformation.criminallyChargedDateFiled}</p>
                    )}
                    {otherInformation.criminallyChargedStatus && (
                      <p className="text-sm text-gray-600 pl-4">Status: {otherInformation.criminallyChargedStatus}</p>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">36. Convicted of any crime:</span> {otherInformation.convicted ? 'Yes' : 'No'}
                </p>
                {otherInformation.convicted && otherInformation.convictedDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.convictedDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">37. Separated from service:</span> {otherInformation.separatedFromService ? 'Yes' : 'No'}
                </p>
                {otherInformation.separatedFromService && otherInformation.separatedFromServiceDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.separatedFromServiceDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">38a. Candidate in national/local election:</span> {otherInformation.candidateNationalLocal ? 'Yes' : 'No'}
                </p>
                {otherInformation.candidateNationalLocal && otherInformation.candidateNationalLocalDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.candidateNationalLocalDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">38b. Resigned for candidacy:</span> {otherInformation.resignedForCandidacy ? 'Yes' : 'No'}
                </p>
                {otherInformation.resignedForCandidacy && otherInformation.resignedForCandidacyDetails && (
                  <p className="text-sm text-gray-600 pl-4">Details: {otherInformation.resignedForCandidacyDetails}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">39. Immigrant/permanent resident:</span> {otherInformation.immigrantOrPermanentResident ? 'Yes' : 'No'}
                </p>
                {otherInformation.immigrantOrPermanentResident && otherInformation.immigrantOrPermanentResidentCountry && (
                  <p className="text-sm text-gray-600 pl-4">Country: {otherInformation.immigrantOrPermanentResidentCountry}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">40a. Member of indigenous group:</span> {otherInformation.indigenousGroupMember ? 'Yes' : 'No'}
                </p>
                {otherInformation.indigenousGroupMember && otherInformation.indigenousGroupName && (
                  <p className="text-sm text-gray-600 pl-4">Group: {otherInformation.indigenousGroupName}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">40b. Person with disability (PWD):</span> {otherInformation.personWithDisability ? 'Yes' : 'No'}
                </p>
                {otherInformation.personWithDisability && otherInformation.pwdIdNumber && (
                  <p className="text-sm text-gray-600 pl-4">ID Number: {otherInformation.pwdIdNumber}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">40c. Solo parent:</span> {otherInformation.soloParent ? 'Yes' : 'No'}
                </p>
                {otherInformation.soloParent && otherInformation.soloParentIdNumber && (
                  <p className="text-sm text-gray-600 pl-4">ID Number: {otherInformation.soloParentIdNumber}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Completion Status */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">PDS Completion Status</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full px-3 py-1">
                <span className="text-sm font-semibold text-blue-700">
                  {pdsData.completion_percentage || 0}%
                </span>
              </div>
              {pdsData.is_completed && (
                <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Format Selection Modal */}
      {pdsData.id && (
        <PDSDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          pdsId={pdsData.id}
        />
      )}
    </Modal>
  );
}

// Helper component for displaying info rows
function InfoRow({
  label,
  value,
  icon,
  className = ''
}: {
  label: string;
  value: any;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
