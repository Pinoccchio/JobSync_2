'use client';
import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, TrendingUp, FileText, Calendar } from 'lucide-react';
import { Avatar, Button, ImagePreviewModal } from '@/components/ui';
import { PDSViewModal } from '@/components/ui/PDSViewModal';
import { StatusTimeline } from './StatusTimeline';

interface ApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    id: string;
    applicantName: string;
    email?: string;
    jobTitle: string;
    matchScore?: number | null;
    rank?: number | null;
    status: string;
    appliedDate: string;
    statusHistory?: any[];
    denialReason?: string;
    nextSteps?: string;
    interviewDate?: string;
    hrNotes?: string;
    _raw?: any;
  } | null;
}

export const ApplicationDrawer: React.FC<ApplicationDrawerProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  const [showPDSModal, setShowPDSModal] = useState(false);
  const [fetchedPDSData, setFetchedPDSData] = useState<any>(null);
  const [loadingPDS, setLoadingPDS] = useState(false);

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);

  if (!isOpen || !application) return null;

  const statusHistory = application._raw?.status_history || application.statusHistory || [];

  // Fetch complete PDS data from API (same pattern as scanned-records page)
  const handleViewFullPDS = async () => {
    const pdsId = application._raw?.pds_id;

    if (!pdsId) {
      alert('PDS data not available for this applicant');
      return;
    }

    setLoadingPDS(true);
    try {
      const response = await fetch(`/api/pds/${pdsId}`);
      const result = await response.json();

      if (result.success) {
        setFetchedPDSData(result.data);
        setShowPDSModal(true);
      } else {
        alert(`Failed to load PDS: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading PDS:', error);
      alert('Error loading PDS data. Please try again.');
    } finally {
      setLoadingPDS(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        {/* Centered Modal */}
        <div
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                imageUrl={application._raw?.applicant_profiles?.profiles?.profile_image_url}
                userName={application.applicantName}
                size="lg"
                onClick={() => {
                  if (application._raw?.applicant_profiles?.profiles?.profile_image_url) {
                    setShowImagePreview(true);
                  }
                }}
                clickable
              />
              <div>
                <h2 className="text-2xl font-bold">{application.applicantName}</h2>
                <p className="text-sm text-white/90 mt-1">{application.jobTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-4">
            {application.rank && (
              <div className="bg-white/20 px-3 py-1.5 rounded-lg">
                <p className="text-xs text-white/80">Rank</p>
                <p className="text-lg font-bold">#{application.rank}</p>
              </div>
            )}
            {application.matchScore && (
              <div className="bg-white/20 px-3 py-1.5 rounded-lg">
                <p className="text-xs text-white/80">Match Score</p>
                <p className="text-lg font-bold">{application.matchScore.toFixed(1)}%</p>
              </div>
            )}
            <div className="bg-white/20 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-white/80">Applied</p>
              <p className="text-sm font-semibold">
                {application._raw?.created_at
                  ? new Date(application._raw.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Status Timeline */}
          {statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-visible">
              <StatusTimeline
                statusHistory={statusHistory}
                currentStatus={application.status}
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-2">
              {application.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{application.email}</span>
                </div>
              )}
              {application._raw?.applicant_profiles?.contact_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{application._raw.applicant_profiles.contact_number}</span>
                </div>
              )}
              {application._raw?.applicant_profiles?.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{application._raw.applicant_profiles.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Application Scores (if ranked) */}
          {/* NOTE: These scores come directly from the database (applications table) */}
          {/* They are calculated by Gemini AI ranking algorithms and NOT hardcoded */}
          {application._raw?.education_score && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Evaluation Scores
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Education</p>
                  {/* Source: application._raw.education_score from database */}
                  <p className="text-lg font-bold text-blue-600">{application._raw.education_score.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Experience</p>
                  {/* Source: application._raw.experience_score from database */}
                  <p className="text-lg font-bold text-green-600">{application._raw.experience_score.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Skills</p>
                  {/* Source: application._raw.skills_score from database */}
                  <p className="text-lg font-bold text-purple-600">{application._raw.skills_score.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Eligibility</p>
                  {/* Source: application._raw.eligibility_score from database */}
                  <p className="text-lg font-bold text-orange-600">{application._raw.eligibility_score.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Interview Details */}
          {application.status === 'interviewed' && application.interviewDate && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-cyan-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Interview Scheduled
              </h3>
              <p className="text-sm text-cyan-800">
                {new Date(application.interviewDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {application.nextSteps && (
                <p className="text-sm text-cyan-700 mt-2">{application.nextSteps}</p>
              )}
            </div>
          )}

          {/* Approval/Hire Details */}
          {(application.status === 'approved' || application.status === 'hired') && application.nextSteps && (
            <div className={`${application.status === 'hired' ? 'bg-teal-50 border-teal-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
              <h3 className={`text-sm font-bold ${application.status === 'hired' ? 'text-teal-900' : 'text-green-900'} mb-2 flex items-center gap-2`}>
                <FileText className={`w-4 h-4 ${application.status === 'hired' ? 'text-teal-600' : 'text-green-600'}`} />
                Next Steps
              </h3>
              <p className={`text-sm ${application.status === 'hired' ? 'text-teal-800' : 'text-green-800'}`}>
                {application.nextSteps}
              </p>
            </div>
          )}

          {/* Denial Reason */}
          {application.status === 'denied' && application.denialReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-red-900 mb-2">Denial Reason</h3>
              <p className="text-sm text-red-800">{application.denialReason}</p>
            </div>
          )}

          {/* HR Internal Notes */}
          {application.hrNotes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-600" />
                HR Internal Notes
              </h3>
              <p className="text-sm text-yellow-800">{application.hrNotes}</p>
              <p className="text-xs text-yellow-600 mt-2">Note: This is for HR reference only and not visible to the applicant</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleViewFullPDS}
              className="flex-1"
              disabled={!application._raw?.pds_id || loadingPDS}
            >
              {loadingPDS ? 'Loading PDS...' : 'View Full PDS'}
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* PDS View Modal - Uses fetched data from API */}
      <PDSViewModal
        isOpen={showPDSModal}
        onClose={() => {
          setShowPDSModal(false);
          setFetchedPDSData(null); // Clear data when modal closes
        }}
        pdsData={fetchedPDSData}
        applicantName={application?.applicantName || ''}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={application?._raw?.applicant_profiles?.profiles?.profile_image_url || null}
        imageName={`${application?.applicantName || 'Applicant'}'s Profile Picture`}
        userName={application?.applicantName || 'Applicant'}
      />
    </>
  );
};
