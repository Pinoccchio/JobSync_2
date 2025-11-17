'use client';
import React, { useState } from 'react';
import { PDSData } from '@/types/pds.types';
import { Button } from '@/components/ui/Button';
import { Edit, CheckCircle, Download } from 'lucide-react';
import { PDSDownloadModal } from '@/components/PDS/PDSDownloadModal';

interface ReviewSubmitProps {
  pdsData: Partial<PDSData>;
  pdsId?: string; // Optional - needed for downloading after save
  onEdit: (sectionIndex: number) => void;
  onSubmit: () => void;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({
  pdsData,
  pdsId,
  onEdit,
  onSubmit,
}) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);

  const isComplete = () => {
    return (
      pdsData.personalInfo?.surname &&
      pdsData.familyBackground?.father?.surname &&
      (pdsData.educationalBackground?.length || 0) > 0 &&
      pdsData.otherInformation?.declaration?.agreed
    );
  };

  const handleDownloadClick = () => {
    if (pdsId) {
      setIsDownloadModalOpen(true);
    } else {
      alert('Please save your PDS first before downloading.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Review & Submit</h3>
        <p className="text-sm text-gray-600">
          Please review all sections before submitting your Personal Data Sheet.
        </p>
      </div>

      {/* Section I: Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">I. Personal Information</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(0)}>
            Edit
          </Button>
        </div>

        {pdsData.personalInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Full Name:</span>
              <p className="text-gray-900">
                {pdsData.personalInfo.surname}, {pdsData.personalInfo.firstName}{' '}
                {pdsData.personalInfo.middleName} {pdsData.personalInfo.nameExtension || ''}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date of Birth:</span>
              <p className="text-gray-900">{pdsData.personalInfo.dateOfBirth}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sex:</span>
              <p className="text-gray-900">{pdsData.personalInfo.sexAtBirth}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Civil Status:</span>
              <p className="text-gray-900">{pdsData.personalInfo.civilStatus}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{pdsData.personalInfo.emailAddress}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mobile:</span>
              <p className="text-gray-900">{pdsData.personalInfo.mobileNo}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No personal information provided</p>
        )}
      </div>

      {/* Section II: Family Background */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">II. Family Background</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(1)}>
            Edit
          </Button>
        </div>

        {pdsData.familyBackground ? (
          <div className="space-y-4 text-sm">
            {pdsData.familyBackground.spouse && (
              <div>
                <span className="font-medium text-gray-700">Spouse:</span>
                <p className="text-gray-900">
                  {pdsData.familyBackground.spouse.surname}, {pdsData.familyBackground.spouse.firstName}{' '}
                  {pdsData.familyBackground.spouse.middleName}
                </p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Children:</span>
              <p className="text-gray-900">
                {(pdsData.familyBackground?.children?.length || 0) > 0
                  ? `${pdsData.familyBackground.children.length} child(ren)`
                  : 'None'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Father:</span>
              <p className="text-gray-900">
                {pdsData.familyBackground.father?.surname || 'N/A'}, {pdsData.familyBackground.father?.firstName || ''}{' '}
                {pdsData.familyBackground.father?.middleName || ''}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mother:</span>
              <p className="text-gray-900">
                {pdsData.familyBackground.mother?.surname || 'N/A'}, {pdsData.familyBackground.mother?.firstName || ''}{' '}
                {pdsData.familyBackground.mother?.middleName || ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No family background provided</p>
        )}
      </div>

      {/* Section III: Educational Background */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">III. Educational Background</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(2)}>
            Edit
          </Button>
        </div>

        {pdsData.educationalBackground && pdsData.educationalBackground.length > 0 ? (
          <div className="space-y-3">
            {pdsData.educationalBackground.map((edu, index) => (
              <div key={index} className="border-l-4 border-[#22A555] pl-4">
                <p className="font-medium text-gray-900">{edu.level}</p>
                <p className="text-sm text-gray-700">{edu.nameOfSchool}</p>
                <p className="text-sm text-gray-600">{edu.basicEducationDegreeCourse}</p>
                <p className="text-xs text-gray-500">
                  {edu.periodOfAttendance.from} - {edu.periodOfAttendance.to}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No educational background provided</p>
        )}
      </div>

      {/* Section IV: Civil Service Eligibility */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">IV. Civil Service Eligibility</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(3)}>
            Edit
          </Button>
        </div>

        {pdsData.eligibility && pdsData.eligibility.length > 0 ? (
          <div className="space-y-2">
            {pdsData.eligibility.map((elig, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-gray-900">{elig.careerService}</p>
                <p className="text-xs text-gray-600">
                  {elig.placeOfExaminationConferment} • {elig.dateOfExaminationConferment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No eligibilities provided</p>
        )}
      </div>

      {/* Section V: Work Experience */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">V. Work Experience</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(4)}>
            Edit
          </Button>
        </div>

        {pdsData.workExperience && pdsData.workExperience.length > 0 ? (
          <div className="space-y-3">
            {pdsData.workExperience.map((work, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">{work.positionTitle}</p>
                <p className="text-sm text-gray-700">{work.departmentAgencyOfficeCompany}</p>
                <p className="text-xs text-gray-500">
                  {work.periodOfService.from} - {work.periodOfService.to}
                  {work.governmentService && ' • Government'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No work experience provided</p>
        )}
      </div>

      {/* Section VI: Voluntary Work */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">VI. Voluntary Work</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(5)}>
            Edit
          </Button>
        </div>

        {pdsData.voluntaryWork && pdsData.voluntaryWork.length > 0 ? (
          <div className="space-y-3">
            {pdsData.voluntaryWork.map((vol, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <p className="font-medium text-gray-900">{vol.organizationName}</p>
                <p className="text-sm text-gray-700">{vol.positionNatureOfWork}</p>
                <p className="text-xs text-gray-500">
                  {vol.periodOfInvolvement.from} - {vol.periodOfInvolvement.to}
                  {vol.numberOfHours && ` • ${vol.numberOfHours} hours`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No voluntary work provided</p>
        )}
      </div>

      {/* Section VII: Learning & Development */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">VII. Learning & Development</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(6)}>
            Edit
          </Button>
        </div>

        {pdsData.trainings && pdsData.trainings.length > 0 ? (
          <div className="space-y-3">
            {pdsData.trainings.map((training, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4">
                <p className="font-medium text-gray-900">{training.title}</p>
                <p className="text-sm text-gray-700">{training.conductedSponsoredBy}</p>
                <p className="text-xs text-gray-500">
                  {training.periodOfAttendance.from} - {training.periodOfAttendance.to}
                  {` • ${training.numberOfHours} hours`}
                  {training.typeOfLD && ` • ${training.typeOfLD}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No trainings provided</p>
        )}
      </div>

      {/* Section VIII: Other Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">VIII. Other Information</h4>
          <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(7)}>
            Edit
          </Button>
        </div>

        {pdsData.otherInformation ? (
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Skills:</span>
              <p className="text-gray-900">
                {(pdsData.otherInformation.skills?.length || 0) > 0
                  ? pdsData.otherInformation.skills.join(', ')
                  : 'None'}
              </p>
            </div>

            {/* Questions 34-40 */}
            <div>
              <span className="font-medium text-gray-700">Questions (34-40):</span>
              <div className="mt-2 space-y-1.5">
                {(() => {
                  const oi = pdsData.otherInformation;
                  const hasAnyYes =
                    oi.relatedThirdDegree ||
                    oi.relatedFourthDegree ||
                    oi.guiltyAdministrativeOffense ||
                    oi.criminallyCharged ||
                    oi.convicted ||
                    oi.separatedFromService ||
                    oi.candidateNationalLocal ||
                    oi.resignedForCandidacy ||
                    oi.immigrantOrPermanentResident ||
                    oi.indigenousGroupMember ||
                    oi.personWithDisability ||
                    oi.soloParent;

                  if (!hasAnyYes) {
                    return <p className="text-xs text-gray-600 italic">All questions answered NO</p>;
                  }

                  return (
                    <div className="text-xs space-y-1">
                      {oi.relatedThirdDegree && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 34a:</span> Related within 3rd degree
                          {oi.relatedThirdDegreeDetails && <span className="text-gray-700"> - {oi.relatedThirdDegreeDetails}</span>}
                        </p>
                      )}
                      {oi.relatedFourthDegree && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 34b:</span> Related within 4th degree (LGU)
                          {oi.relatedFourthDegreeDetails && <span className="text-gray-700"> - {oi.relatedFourthDegreeDetails}</span>}
                        </p>
                      )}
                      {oi.guiltyAdministrativeOffense && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 35a:</span> Administrative offense
                          {oi.guiltyAdministrativeOffenseDetails && <span className="text-gray-700"> - {oi.guiltyAdministrativeOffenseDetails}</span>}
                        </p>
                      )}
                      {oi.criminallyCharged && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 35b:</span> Criminally charged
                          {oi.criminallyChargedDetails && <span className="text-gray-700"> - {oi.criminallyChargedDetails}</span>}
                        </p>
                      )}
                      {oi.convicted && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 36:</span> Convicted of crime/violation
                          {oi.convictedDetails && <span className="text-gray-700"> - {oi.convictedDetails}</span>}
                        </p>
                      )}
                      {oi.separatedFromService && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 37:</span> Separated from service
                          {oi.separatedFromServiceDetails && <span className="text-gray-700"> - {oi.separatedFromServiceDetails}</span>}
                        </p>
                      )}
                      {oi.candidateNationalLocal && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 38a:</span> Election candidate
                          {oi.candidateNationalLocalDetails && <span className="text-gray-700"> - {oi.candidateNationalLocalDetails}</span>}
                        </p>
                      )}
                      {oi.resignedForCandidacy && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 38b:</span> Resigned for candidacy
                          {oi.resignedForCandidacyDetails && <span className="text-gray-700"> - {oi.resignedForCandidacyDetails}</span>}
                        </p>
                      )}
                      {oi.immigrantOrPermanentResident && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 39:</span> Immigrant/Permanent resident
                          {oi.immigrantOrPermanentResidentCountry && <span className="text-gray-700"> - {oi.immigrantOrPermanentResidentCountry}</span>}
                        </p>
                      )}
                      {oi.indigenousGroupMember && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 40a:</span> Indigenous group member
                          {oi.indigenousGroupName && <span className="text-gray-700"> - {oi.indigenousGroupName}</span>}
                        </p>
                      )}
                      {oi.personWithDisability && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 40b:</span> Person with disability
                          {oi.pwdIdNumber && <span className="text-gray-700"> - ID: {oi.pwdIdNumber}</span>}
                        </p>
                      )}
                      {oi.soloParent && (
                        <p className="text-gray-900">
                          <span className="text-[#22A555] font-bold">✓ 40c:</span> Solo parent
                          {oi.soloParentIdNumber && <span className="text-gray-700"> - ID: {oi.soloParentIdNumber}</span>}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-700">References:</span>
              <p className="text-gray-900">
                {pdsData.otherInformation.references?.length || 0} reference(s) provided
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Declaration:</span>
              <p className="text-gray-900">
                {pdsData.otherInformation.declaration?.agreed ? (
                  <span className="text-[#22A555] flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Agreed
                  </span>
                ) : (
                  <span className="text-red-600">Not agreed</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No other information provided</p>
        )}
      </div>

      {/* Submit Section */}
      <div className="bg-[#22A555]/5 border-2 border-[#22A555] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Submit?</h4>
        <p className="text-sm text-gray-700 mb-4">
          By clicking "Submit PDS", you confirm that all information provided is accurate and complete.
          This PDS will be used for job application screening and ranking.
        </p>

        {!isComplete() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Some required sections are incomplete. Please review and complete:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
              {!pdsData.personalInfo?.surname && <li>Personal Information</li>}
              {!pdsData.familyBackground?.father?.surname && <li>Family Background</li>}
              {(pdsData.educationalBackground?.length || 0) === 0 && <li>Educational Background</li>}
              {!pdsData.otherInformation?.declaration?.agreed && <li>Declaration & Signature</li>}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {/* Signature inclusion option for PDF export - Always visible */}
          {(() => {
            const hasSignature = !!(pdsData.otherInformation?.declaration?.signatureData || pdsData.otherInformation?.declaration?.signatureUrl);
            return (
              <div className={`border rounded-lg p-4 ${hasSignature ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300'}`}>
                <label className={`flex items-center gap-3 ${hasSignature ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={includeSignature}
                    onChange={(e) => setIncludeSignature(e.target.checked)}
                    disabled={!hasSignature}
                    className="w-4 h-4 text-[#22A555] border-gray-300 rounded focus:ring-[#22A555] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${hasSignature ? 'text-gray-900' : 'text-gray-500'}`}>
                      Include digital signature in PDF
                    </span>
                    {hasSignature ? (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Check this if submitting digitally. Leave unchecked for traditional wet signature.
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600 mt-0.5">
                        ⚠ Complete the Declaration section (step 8) and add your signature first
                      </p>
                    )}
                  </div>
                </label>
              </div>
            );
          })()}

          <Button
            variant="secondary"
            size="lg"
            icon={Download}
            onClick={handleDownloadClick}
            disabled={!pdsId || !pdsData.personalInfo?.surname}
            className="w-full"
          >
            Download PDS
          </Button>

          <Button
            variant="success"
            size="lg"
            icon={CheckCircle}
            onClick={onSubmit}
            disabled={!isComplete()}
            className="w-full"
          >
            {isComplete() ? 'Submit Personal Data Sheet' : 'Complete Required Sections First'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> After submission, your PDS will be saved and can be used when applying for job postings.
          You can still edit your PDS later if needed. You can also download your PDS as a PDF document for printing or offline use.
        </p>
      </div>

      {/* Download Format Selection Modal */}
      {pdsId && (
        <PDSDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          pdsId={pdsId}
        />
      )}
    </div>
  );
};
