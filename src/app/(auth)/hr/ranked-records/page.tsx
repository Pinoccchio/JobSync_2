'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import Image from 'next/image';
import { Avatar, Card, EnhancedTable, Button, Container, Badge, RefreshButton, DropdownMenu, type DropdownMenuItem, StatusFilter, QuickFilters, ImagePreviewModal } from '@/components/ui';
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge';
import { PDSViewModal } from '@/components/ui/PDSViewModal';
import { RankingDetailsModal } from '@/components/hr/RankingDetailsModal';
import { PDSViewerModal } from '@/components/hr/PDSViewerModal';
import { DenyModal } from '@/components/hr/DenyModal';
import { ShortlistModal } from '@/components/hr/ShortlistModal';
import { ScheduleInterviewModal } from '@/components/hr/ScheduleInterviewModal';
import { ApproveModal } from '@/components/hr/ApproveModal';
import { MarkAsHiredModal } from '@/components/hr/MarkAsHiredModal';
import { UnderReviewModal } from '@/components/hr/UnderReviewModal';
import { ReverseToPendingModal } from '@/components/hr/ReverseToPendingModal';
import { ArchiveModal } from '@/components/hr/ArchiveModal';
import { ApplicationDrawer } from '@/components/hr/ApplicationDrawer';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { calculateStatistics, calculatePercentile } from '@/lib/utils/rankingStatistics';
import {
  Download,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  User,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Eye,
  Bell,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Users,
  Clock,
  Star,
  Calendar,
  RotateCcw,
  Archive,
  Target,
  History,
} from 'lucide-react';
import { StatusTimeline } from '@/components/hr/StatusTimeline';

interface StatusHistoryItem {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

interface Application {
  id: string;
  applicantName: string;
  email: string;
  jobTitle: string;
  matchScore: number | null;
  rank: number | null;
  status: string;
  appliedDate: string;
  pdsUrl: string;
  pdsId: string | null;
  signatureUrl: string | null;
  signatureUploadedAt: string | null;
  statusHistory?: StatusHistoryItem[];
  matchedSkillsCount?: number; // Number of job skills matched by applicant
  matchedEligibilitiesCount?: number; // Number of job eligibilities matched by applicant
  _raw: any;
}

export default function RankedRecordsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [selectedApplicationForDrawer, setSelectedApplicationForDrawer] = useState<Application | null>(null);
  const [showApplicationDrawer, setShowApplicationDrawer] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [selectedJobRequirements, setSelectedJobRequirements] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [jobToRank, setJobToRank] = useState<{ id: string; title: string } | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [applicantToApprove, setApplicantToApprove] = useState<Application | null>(null);
  const [applicantToDeny, setApplicantToDeny] = useState<Application | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdsViewerState, setPdsViewerState] = useState<{
    isOpen: boolean;
    url: string;
    applicantName: string;
  } | null>(null);
  const [pdsDataModal, setPdsDataModal] = useState<{
    isOpen: boolean;
    data: any;
    applicantName: string;
  } | null>(null);

  // New workflow modals state
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showScheduleInterviewModal, setShowScheduleInterviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showMarkAsHiredModal, setShowMarkAsHiredModal] = useState(false);
  const [showUnderReviewModal, setShowUnderReviewModal] = useState(false);
  const [showReverseToPendingModal, setShowReverseToPendingModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedApplicationForAction, setSelectedApplicationForAction] = useState<Application | null>(null);

  // Status History Modal
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [selectedApplicationForHistory, setSelectedApplicationForHistory] = useState<Application | null>(null);

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>('');

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications');
      const result = await response.json();

      if (result.success) {
        setApplications(
          result.data.map((app: any) => ({
            id: app.id,
            applicantName: `${app.applicant_profiles?.first_name || ''} ${app.applicant_profiles?.surname || ''}`.trim() || 'Unknown',
            email: app.applicant_profiles?.profiles?.email || user?.email || 'N/A',
            jobTitle: app.jobs?.title || 'Unknown Position',
            matchScore: app.match_score,
            rank: app.rank,
            status: app.status,
            appliedDate: new Date(app.created_at).toLocaleDateString(),
            pdsUrl: app.pds_file_url,
            pdsId: app.pds_id,
            signatureUrl: app.applicant_pds?.signature_url || null,
            signatureUploadedAt: app.applicant_pds?.signature_uploaded_at || null,
            statusHistory: app.status_history || [],
            matchedSkillsCount: app.matched_skills_count,
            matchedEligibilitiesCount: app.matched_eligibilities_count,
            _extracted: app._extracted || {
              skills: app.applicant_profiles?.skills || [],
              eligibilities: app.applicant_profiles?.eligibilities || [],
              total_years_experience: app.applicant_profiles?.total_years_experience || 0,
              highest_educational_attainment: app.applicant_profiles?.highest_educational_attainment || 'Not specified',
            },
            _raw: app,
          }))
        );

        // Extract unique jobs for filter
        const uniqueJobs = Array.from(
          new Set(result.data.map((app: any) => app.jobs?.id).filter(Boolean))
        ).map((jobId) => {
          const app = result.data.find((a: any) => a.jobs?.id === jobId);
          return {
            id: jobId,
            title: app?.jobs?.title || 'Unknown',
          };
        });
        setJobs(uniqueJobs);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle avatar click to show image preview
  const handleAvatarClick = (imageUrl: string | null, userName: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewUserName(userName);
      setShowImagePreview(true);
    }
  };

  // Show approve confirmation modal
  const handleApprove = (row: Application) => {
    setApplicantToApprove(row);
    setShowApproveConfirm(true);
  };

  // Show deny confirmation modal
  const handleDeny = (row: Application) => {
    setApplicantToDeny(row);
    setShowDenyConfirm(true);
  };

  // Perform approve action
  const handleApproveConfirm = async () => {
    if (!applicantToApprove) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${applicantToApprove.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application approved! Notification sent to ${applicantToApprove.applicantName}`, 'success');
        setShowApproveConfirm(false);
        setApplicantToApprove(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      showToast('Failed to approve application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Perform deny action
  const handleDenyConfirm = async () => {
    if (!applicantToDeny) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${applicantToDeny.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application denied. Notification sent to ${applicantToDeny.applicantName}`, 'success');
        setShowDenyConfirm(false);
        setApplicantToDeny(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error denying application:', error);
      showToast('Failed to deny application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // NEW WORKFLOW HANDLERS

  // Handle Mark as Under Review (with modal)
  const handleMarkUnderReview = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowUnderReviewModal(true);
  };

  const handleMarkUnderReviewConfirm = async () => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application marked as under review`, 'success');
        setShowUnderReviewModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      showToast('Failed to update application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Shortlist with modal
  const handleShortlist = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowShortlistModal(true);
  };

  const handleShortlistConfirm = async () => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shortlisted' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`${selectedApplicationForAction.applicantName} has been shortlisted!`, 'success');
        setShowShortlistModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error shortlisting application:', error);
      showToast('Failed to shortlist application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Schedule Interview with modal
  const handleScheduleInterview = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowScheduleInterviewModal(true);
  };

  const handleScheduleInterviewConfirm = async (interview_date: string, location: string, instructions: string) => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'interviewed',
          interview_date,
          next_steps: `Interview Location: ${location}. ${instructions}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Interview scheduled for ${selectedApplicationForAction.applicantName}!`, 'success');
        setShowScheduleInterviewModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      showToast('Failed to schedule interview', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve with enhanced modal
  const handleApproveNew = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowApproveModal(true);
  };

  const handleApproveConfirmNew = async (next_steps: string, hr_notes?: string) => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          next_steps,
          hr_notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application approved! Notification sent to ${selectedApplicationForAction.applicantName}`, 'success');
        setShowApproveModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      showToast('Failed to approve application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deny with enhanced modal
  const handleDenyNew = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowDenyModal(true);
  };

  const handleDenyConfirmNew = async (denial_reason: string, hr_notes?: string) => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'denied',
          denial_reason,
          hr_notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application denied. Notification sent to ${selectedApplicationForAction.applicantName}`, 'success');
        setShowDenyModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error denying application:', error);
      showToast('Failed to deny application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark as Hired
  const handleMarkAsHired = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowMarkAsHiredModal(true);
  };

  const handleMarkAsHiredConfirm = async (next_steps: string, hr_notes?: string) => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'hired',
          next_steps,
          hr_notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`${selectedApplicationForAction.applicantName} marked as hired! 🎉`, 'success');
        setShowMarkAsHiredModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error marking as hired:', error);
      showToast('Failed to mark as hired', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reverse to Pending
  const handleReverseToPending = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowReverseToPendingModal(true);
  };

  const handleReverseToPendingConfirm = async () => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application reversed to pending status`, 'success');
        setShowReverseToPendingModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error reversing application:', error);
      showToast('Failed to reverse application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Archive
  const handleArchive = (application: Application) => {
    setSelectedApplicationForAction(application);
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async () => {
    if (!selectedApplicationForAction) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/applications/${selectedApplicationForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Application archived successfully`, 'success');
        setShowArchiveModal(false);
        setSelectedApplicationForAction(null);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error archiving application:', error);
      showToast('Failed to archive application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // View PDS in modal
  const handleDownloadPDS = async (application: Application) => {
    try {
      const pdsId = application.pdsId || application._raw?.pds_id;
      const pdsUrl = application.pdsUrl;
      const applicantId = application._raw?.applicant_id;
      const applicantName = application.applicantName;

      // Priority 1: Check for web-based PDS (pds_id)
      if (pdsId) {
        const response = await fetch(`/api/pds/${pdsId}`);
        const result = await response.json();

        if (result.success) {
          setPdsDataModal({
            isOpen: true,
            data: result.data,
            applicantName,
          });
          return;
        } else {
          showToast(getErrorMessage(result.error), 'error');
          return;
        }
      }

      // Priority 2: Check for uploaded PDF - Show OCR-extracted data
      if (pdsUrl && applicantId) {
        // Fetch OCR-extracted data from applicant_profiles
        const response = await fetch(`/api/applicants/${applicantId}/profile`);
        const result = await response.json();

        if (result.success && result.data) {
          // Show OCR-extracted data in structured view (same as web PDS)
          setPdsDataModal({
            isOpen: true,
            data: result.data,
            applicantName,
          });
          return;
        } else {
          // Fallback: Show PDF if OCR data not available
          showToast('OCR data not available. Showing original PDF...', 'info');

          // Get fresh signed URL for PDF
          const url = new URL(pdsUrl);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/([^\/]+)\/(.+)\?/);

          if (pathMatch) {
            const bucket = pathMatch[1];
            const path = pathMatch[2];

            const storageResponse = await fetch(`/api/storage?bucket=${bucket}&path=${encodeURIComponent(path)}`);
            const storageResult = await storageResponse.json();

            if (storageResult.success) {
              setPdsViewerState({
                isOpen: true,
                url: storageResult.data.signedUrl,
                applicantName,
              });
              return;
            }
          }

          showToast(getErrorMessage(result.error || 'Failed to load PDS'), 'error');
          return;
        }
      }

      // No PDS available
      showToast('No PDS data available for this applicant', 'warning');
    } catch (error) {
      console.error('Error loading PDS:', error);
      showToast('Failed to load PDS', 'error');
    }
  };

  // Open confirmation modal for ranking
  const handleRankApplicants = () => {
    if (selectedJob === 'all') {
      showToast('Please select a specific job position to rank applicants', 'warning');
      return;
    }

    const job = jobs.find(j => j.id === selectedJob);
    if (!job) return;

    setJobToRank({ id: job.id, title: job.title });
    setIsConfirmModalOpen(true);
  };

  // Perform the actual ranking after confirmation
  const performRanking = async () => {
    if (!jobToRank) return;

    setIsRanking(true);

    try {
      const response = await fetch(`/api/jobs/${jobToRank.id}/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          `✨ Successfully ranked ${result.totalApplicants} applicant${result.totalApplicants !== 1 ? 's' : ''} for ${result.jobTitle}! Rankings are now visible below.`,
          'success'
        );

        // CRITICAL ORDER (following user-management pattern):
        setIsRanking(false);          // 1. Reset loading FIRST
        setIsConfirmModalOpen(false); // 2. Close modal SECOND
        setJobToRank(null);           // 3. Clear selection THIRD
        await fetchApplications();     // 4. Refresh data FOURTH
      } else {
        showToast(getErrorMessage(result.error || result.message), 'error');
        setIsRanking(false); // Reset but keep modal open for retry
      }
    } catch (error) {
      console.error('Error ranking applicants:', error);
      showToast('Failed to rank applicants. Please try again.', 'error');
      setIsRanking(false); // Reset but keep modal open for retry
    }
  };

  // Handle opening ranking details modal
  const handleViewDetails = (application: Application) => {
    console.log('🔍 Opening ranking details for:', {
      name: application.applicantName,
      rank: application.rank,
      matchScore: application.matchScore,
      hasRawData: !!application._raw,
    });

    if (!application.rank || !application.matchScore) {
      console.warn('⚠️ Cannot open details: applicant not ranked', {
        rank: application.rank,
        matchScore: application.matchScore,
      });
      showToast('This applicant has not been ranked yet', 'warning');
      return;
    }

    const raw = application._raw;
    console.log('📊 Raw application data:', raw);

    // Get all applicants for the same job (for statistical comparison)
    const jobId = raw?.job_id;
    const jobApplicants = applications.filter(
      app => app._raw?.job_id === jobId && app.rank !== null && app.matchScore !== null
    );

    console.log(`📈 Calculating statistics for ${jobApplicants.length} applicants in job pool`);

    // Calculate statistics for all score dimensions
    const matchScores = jobApplicants.map(app => app.matchScore).filter(Boolean) as number[];
    const educationScores = jobApplicants.map(app => app._raw?.education_score).filter(s => s != null) as number[];
    const experienceScores = jobApplicants.map(app => app._raw?.experience_score).filter(s => s != null) as number[];
    const skillsScores = jobApplicants.map(app => app._raw?.skills_score).filter(s => s != null) as number[];
    const eligibilityScores = jobApplicants.map(app => app._raw?.eligibility_score).filter(s => s != null) as number[];

    const statistics = {
      matchScore: calculateStatistics(matchScores),
      educationScore: calculateStatistics(educationScores),
      experienceScore: calculateStatistics(experienceScores),
      skillsScore: calculateStatistics(skillsScores),
      eligibilityScore: calculateStatistics(eligibilityScores),
    };

    // Calculate percentiles for current applicant
    const percentiles = {
      matchScore: calculatePercentile(application.matchScore, matchScores),
      educationScore: calculatePercentile(raw?.education_score || 0, educationScores),
      experienceScore: calculatePercentile(raw?.experience_score || 0, experienceScores),
      skillsScore: calculatePercentile(raw?.skills_score || 0, skillsScores),
      eligibilityScore: calculatePercentile(raw?.eligibility_score || 0, eligibilityScores),
    };

    // Get top 3 performers for comparison
    const topPerformers = jobApplicants
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))
      .slice(0, 3)
      .map(app => ({
        name: app.applicantName,
        rank: app.rank!,
        matchScore: app.matchScore!,
        educationScore: app._raw?.education_score || 0,
        experienceScore: app._raw?.experience_score || 0,
        skillsScore: app._raw?.skills_score || 0,
        eligibilityScore: app._raw?.eligibility_score || 0,
      }));

    const applicantData = {
      name: application.applicantName,
      jobTitle: application.jobTitle,
      rank: application.rank,
      matchScore: application.matchScore,
      educationScore: raw?.education_score || 0,
      experienceScore: raw?.experience_score || 0,
      skillsScore: raw?.skills_score || 0,
      eligibilityScore: raw?.eligibility_score || 0,
      algorithmUsed: raw?.algorithm_used || 'Unknown',
      reasoning: raw?.ranking_reasoning || 'No reasoning available',
      education: raw?._extracted?.highest_educational_attainment || raw?.applicant_profiles?.highest_educational_attainment,
      experience: raw?._extracted?.total_years_experience || raw?.applicant_profiles?.total_years_experience,
      skills: raw?._extracted?.skills || raw?.applicant_profiles?.skills || [],
      eligibilities: (raw?._extracted?.eligibilities || raw?.applicant_profiles?.eligibilities || []).map((e: any) => e.eligibilityTitle || e),
      algorithmDetails: raw?.algorithm_details ? (
        typeof raw.algorithm_details === 'string'
          ? JSON.parse(raw.algorithm_details)
          : raw.algorithm_details
      ) : undefined,
      // Add match counts from database
      matchedSkillsCount: application.matchedSkillsCount,
      matchedEligibilitiesCount: application.matchedEligibilitiesCount,
      // Add statistical context
      statistics,
      percentiles,
      topPerformers,
      totalApplicants: jobApplicants.length,
    };

    // Extract job requirements from the raw data
    const jobRequirements = raw?.jobs ? {
      degreeRequirement: raw.jobs.degree_requirement || 'Not specified',
      eligibilities: raw.jobs.eligibilities || [],
      skills: raw.jobs.skills || [],
      yearsOfExperience: raw.jobs.years_of_experience || 0,
    } : null;

    console.log('✅ Setting applicant data with statistics:', applicantData);
    console.log('✅ Setting job requirements:', jobRequirements);
    setSelectedApplicant(applicantData);
    setSelectedJobRequirements(jobRequirements);
    setIsModalOpen(true);
    console.log('✅ Modal state set to open');
  };

  const getRankIcon = (ranking: number | null) => {
    if (!ranking) return null;
    switch (ranking) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeVariant = (ranking: number | null): 'success' | 'info' | 'warning' | 'default' => {
    if (!ranking) return 'default';
    switch (ranking) {
      case 1:
        return 'success';
      case 2:
        return 'info';
      case 3:
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      header: 'Rank',
      accessor: 'rank' as const,
      render: (value: number | null, row: Application) => {
        if (!value) {
          return <Badge variant="default">Unranked</Badge>;
        }
        return (
          <button
            onClick={() => handleViewDetails(row)}
            className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer"
            title="Click to view detailed scores"
          >
            {getRankIcon(value)}
            <Badge variant={getRankBadgeVariant(value)}>
              {value === 1 ? '1st' : value === 2 ? '2nd' : value === 3 ? '3rd' : `${value}th`}
            </Badge>
          </button>
        );
      },
    },
    {
      header: 'Applicant',
      accessor: 'applicantName' as const,
      render: (value: string, row: Application) => (
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={row.applicant_profiles?.profiles?.profile_image_url}
            userName={value}
            size="sm"
            onClick={() => handleAvatarClick(row.applicant_profiles?.profiles?.profile_image_url, value)}
            clickable
          />
          <button
            onClick={() => handleViewApplicationDetails(row)}
            className="flex-1 text-left hover:opacity-75 transition-opacity"
            title="Click to view application details"
          >
            <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{value}</span>
          </button>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      header: 'Position',
      accessor: 'jobTitle' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      header: 'Match Score',
      accessor: 'matchScore' as const,
      render: (value: number | null, row: Application) => {
        if (!value) {
          return <span className="text-sm text-gray-500">Not scored</span>;
        }
        return (
          <button
            onClick={() => handleViewDetails(row)}
            className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer"
            title="Click to view detailed scores"
          >
            <TrendingUp className="w-4 h-4 text-[#22A555]" />
            <span className="font-bold text-[#22A555] text-lg">{value.toFixed(1)}%</span>
          </button>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string, row: Application) => (
        <ApplicationStatusBadge
          status={value as any}
          createdAt={row.appliedDate}
          matchScore={row.matchScore}
          showDate={false}
        />
      ),
    },
    {
      header: 'Applied',
      accessor: 'appliedDate' as const,
    },
    {
      header: 'Signature',
      accessor: 'signatureUrl' as const,
      render: (_: any, row: Application) => (
        <div className="flex items-center gap-2">
          {row.signatureUrl ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-green-700">Signed</span>
                {row.signatureUploadedAt && (
                  <span className="text-[10px] text-gray-500">
                    {new Date(row.signatureUploadedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">No Signature</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status History',
      accessor: 'id' as const,
      render: (_: any, row: Application) => {
        const hasHistory = row.statusHistory && row.statusHistory.length > 0;
        return (
          <Button
            variant={hasHistory ? "primary" : "secondary"}
            size="sm"
            icon={History}
            onClick={() => {
              setSelectedApplicationForHistory(row);
              setShowStatusHistoryModal(true);
            }}
            className="text-xs whitespace-nowrap"
          >
            {hasHistory ? `View History (${row.statusHistory?.length || 0})` : 'View Status'}
          </Button>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions' as const,
      render: (_: any, row: Application) => {
        const menuItems: DropdownMenuItem[] = [];

        // Always show these actions
        menuItems.push(
          {
            label: 'View Ranking Details',
            icon: FileText,
            onClick: () => handleViewDetails(row),
            variant: 'default',
            disabled: !row.rank || !row.matchScore,
          },
          {
            label: 'View PDS',
            icon: Eye,
            onClick: () => handleDownloadPDS(row),
            variant: 'default',
          }
        );

        // Status-specific actions
        switch (row.status) {
          case 'pending':
            menuItems.push(
              {
                label: 'Mark as Under Review',
                icon: Clock,
                onClick: () => handleMarkUnderReview(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Shortlist',
                icon: Star,
                onClick: () => handleShortlist(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: () => handleApproveNew(row),
                variant: 'success',
                disabled: submitting,
              },
              {
                label: 'Deny',
                icon: XCircle,
                onClick: () => handleDenyNew(row),
                variant: 'danger',
                disabled: submitting,
              }
            );
            break;

          case 'under_review':
            menuItems.push(
              {
                label: 'Shortlist',
                icon: Star,
                onClick: () => handleShortlist(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: () => handleApproveNew(row),
                variant: 'success',
                disabled: submitting,
              },
              {
                label: 'Deny',
                icon: XCircle,
                onClick: () => handleDenyNew(row),
                variant: 'danger',
                disabled: submitting,
              },
              {
                label: 'Back to Pending',
                icon: RotateCcw,
                onClick: () => handleReverseToPending(row),
                variant: 'default',
                disabled: submitting,
              }
            );
            break;

          case 'shortlisted':
            menuItems.push(
              {
                label: 'Schedule Interview',
                icon: Calendar,
                onClick: () => handleScheduleInterview(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: () => handleApproveNew(row),
                variant: 'success',
                disabled: submitting,
              },
              {
                label: 'Deny',
                icon: XCircle,
                onClick: () => handleDenyNew(row),
                variant: 'danger',
                disabled: submitting,
              }
            );
            break;

          case 'interviewed':
            menuItems.push(
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: () => handleApproveNew(row),
                variant: 'success',
                disabled: submitting,
              },
              {
                label: 'Deny',
                icon: XCircle,
                onClick: () => handleDenyNew(row),
                variant: 'danger',
                disabled: submitting,
              },
              {
                label: 'Reschedule Interview',
                icon: Calendar,
                onClick: () => handleScheduleInterview(row),
                variant: 'default',
                disabled: submitting,
              }
            );
            break;

          case 'approved':
            menuItems.push(
              {
                label: 'Mark as Hired',
                icon: Briefcase,
                onClick: () => handleMarkAsHired(row),
                variant: 'success',
                disabled: submitting,
              },
              {
                label: 'Reverse to Pending',
                icon: RotateCcw,
                onClick: () => handleReverseToPending(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Archive',
                icon: Archive,
                onClick: () => handleArchive(row),
                variant: 'default',
                disabled: submitting,
              }
            );
            break;

          case 'denied':
            menuItems.push(
              {
                label: 'Reverse to Pending',
                icon: RotateCcw,
                onClick: () => handleReverseToPending(row),
                variant: 'default',
                disabled: submitting,
              },
              {
                label: 'Archive',
                icon: Archive,
                onClick: () => handleArchive(row),
                variant: 'default',
                disabled: submitting,
              }
            );
            break;

          case 'hired':
            menuItems.push(
              {
                label: 'Archive',
                icon: Archive,
                onClick: () => handleArchive(row),
                variant: 'default',
                disabled: submitting,
              }
            );
            break;

          case 'archived':
            // Only view actions for archived applications
            break;

          case 'withdrawn':
            // Withdrawn by applicant - no status changes allowed by HR
            // This respects the applicant's decision to withdraw
            break;

          default:
            // For any other status, show basic actions
            menuItems.push(
              {
                label: 'Update Status',
                icon: AlertCircle,
                onClick: () => showToast('Please select an action', 'info'),
                variant: 'default',
                disabled: submitting,
              }
            );
        }

        return <DropdownMenu items={menuItems} />;
      },
    },
  ];

  // Filter applications by selected job and status
  const filteredApplications = applications.filter((app) => {
    // Job filter
    const matchesJob = selectedJob === 'all' || app._raw.job_id === selectedJob;

    // Status filter (from dropdown)
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    // Quick filter (from pills)
    let matchesQuickFilter = true;
    if (quickFilter !== 'all') {
      const quickFilterMap: Record<string, string[]> = {
        needsAction: ['pending'],
        inProgress: ['under_review', 'shortlisted', 'interviewed'],
        approved: ['approved', 'hired'],
        denied: ['denied'],
      };
      matchesQuickFilter = quickFilterMap[quickFilter]?.includes(app.status) || false;
    }

    return matchesJob && matchesStatus && matchesQuickFilter;
  });

  // Sort by rank (nulls last), then by match score
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (a.rank === null && b.rank === null) return 0;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  // Calculate complementary metrics (not redundant with Quick Filters)
  const rankedCount = applications.filter((a) => a.rank !== null).length;
  const unrankedCount = applications.filter((a) => a.rank === null).length;

  // Calculate average match score from ranked applications
  const rankedApps = applications.filter((a) => a.matchScore !== null);
  const avgMatchScore = rankedApps.length > 0
    ? rankedApps.reduce((sum, app) => sum + (app.matchScore || 0), 0) / rankedApps.length
    : 0;

  // Quick filter counts
  const quickFilterCounts = {
    needsAction: applications.filter((a) => a.status === 'pending').length,
    inProgress: applications.filter((a) => ['under_review', 'shortlisted', 'interviewed'].includes(a.status)).length,
    approved: applications.filter((a) => ['approved', 'hired'].includes(a.status)).length,
    denied: applications.filter((a) => a.status === 'denied').length,
  };

  // Handler for opening application details drawer
  const handleViewApplicationDetails = (application: Application) => {
    setSelectedApplicationForDrawer(application);
    setShowApplicationDrawer(true);
  };

  return (
    <AdminLayout
      role="HR"
      userName={user?.fullName || 'HR Admin'}
      pageTitle="Ranked Applications"
      pageDescription="Review and manage applicant rankings"
    >
      <Container size="xl">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555]"
              >
                <option value="all">All Positions</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>

              <StatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
              />

              <Button
                variant="primary"
                icon={Award}
                loading={isRanking}
                onClick={handleRankApplicants}
                disabled={selectedJob === 'all'}
                className="whitespace-nowrap"
              >
                {isRanking ? 'Ranking with AI...' : 'Rank Applicants'}
              </Button>

              <Button
                variant="success"
                icon={Download}
                onClick={() => {
                  // Build export URL with filters
                  let exportUrl = '/api/applications/export';
                  const params = new URLSearchParams();
                  if (selectedJob !== 'all') {
                    params.append('job_id', selectedJob);
                  }
                  if (params.toString()) {
                    exportUrl += `?${params.toString()}`;
                  }
                  // Trigger download
                  window.location.href = exportUrl;
                  showToast('Exporting applications to Excel...', 'success');
                }}
                className="whitespace-nowrap"
              >
                Export to Excel
              </Button>
            </div>
            <RefreshButton
              onRefresh={fetchApplications}
              label="Refresh Applications"
              showLastRefresh={true}
            />
          </div>

          {/* Summary Stats - Complementary Metrics (Non-Redundant with Quick Filters) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Applications Ranked</p>
                  <p className="text-3xl font-bold text-gray-900">{rankedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">AI-ranked applicants</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Match Score</p>
                  <p className="text-3xl font-bold text-gray-900">{avgMatchScore.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Pool quality indicator</p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unranked Applicants</p>
                  <p className="text-3xl font-bold text-gray-900">{unrankedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting AI ranking</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <QuickFilters
              activeFilter={quickFilter}
              onChange={setQuickFilter}
              counts={quickFilterCounts}
            />
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredApplications.length}</span> of {applications.length} applications
            </div>
          </div>

          {/* Applications Table */}
          <Card title="APPLICANT RANKINGS" headerColor="bg-[#D4F4DD]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading applications...</span>
              </div>
            ) : sortedApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No applications found
                {selectedJob !== 'all' && ' for this position'}
              </div>
            ) : (
              <EnhancedTable
                columns={columns}
                data={sortedApplications}
                searchable
                paginated={true}
                pageSize={10}
                searchPlaceholder="Search by name, email, or position..."
              />
            )}
          </Card>
        </div>
      </Container>

      {/* Ranking Details Modal */}
      <RankingDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicant={selectedApplicant}
        jobRequirements={selectedJobRequirements}
      />

      {/* Custom Rank Applicants Confirmation Modal */}
      {isConfirmModalOpen && jobToRank && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
            {/* Blue Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                    <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Rank Applicants with Gemini AI</h3>
                    <p className="text-sm text-white/90">AI-powered intelligent ranking</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setJobToRank(null);
                  }}
                  className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                  disabled={isRanking}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* AI Info Message */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">AI Ranking Process</p>
                    <p className="text-sm text-blue-700">
                      Gemini AI will analyze and rank all pending applicants using advanced algorithms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Info */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Job Position:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900">{jobToRank.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      All pending applicants will be ranked
                    </span>
                  </div>
                </div>
              </div>

              {/* What Will Happen */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm font-semibold text-blue-900">What Happens Next:</p>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                  <li>Analyzes education, experience, skills, and eligibilities</li>
                  <li>Calculates match scores (0-100%) for each applicant</li>
                  <li>Ranks applicants from best to least match</li>
                  <li>Uses 3 AI algorithms with ensemble method</li>
                  <li>Provides detailed reasoning for each score</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setJobToRank(null);
                  }}
                  className="flex-1"
                  disabled={isRanking}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Award}
                  loading={isRanking}
                  onClick={performRanking}
                  className="flex-1"
                  disabled={isRanking}
                >
                  {isRanking ? 'Ranking with AI...' : 'Rank Applicants'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Approve Confirmation Modal */}
      {showApproveConfirm && applicantToApprove && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Green Gradient Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                    <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Approve Application</h3>
                    <p className="text-sm text-white/90">Applicant will be notified</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setApplicantToApprove(null);
                  }}
                  className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Success Info Message */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 mb-1">Approve Application</p>
                    <p className="text-sm text-green-700">
                      This applicant will be notified in-app about their application approval. They will see the notification in their dashboard bell icon.
                    </p>
                  </div>
                </div>
              </div>

              {/* Applicant Info */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Applicant Details:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{applicantToApprove.applicantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{applicantToApprove.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Rank: #{applicantToApprove.rank}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-semibold text-green-600">Score: {applicantToApprove.matchScore?.toFixed(1) || 'N/A'}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preview */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm font-semibold text-blue-900">Notification Preview:</p>
                </div>
                <p className="text-sm text-blue-800 italic">
                  "Your application for {applicantToApprove.jobTitle} has been approved! Congratulations, we will contact you soon with the next steps."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setApplicantToApprove(null);
                  }}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  loading={submitting}
                  onClick={handleApproveConfirm}
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Deny Confirmation Modal */}
      {showDenyConfirm && applicantToDeny && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Red Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                    <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Deny Application</h3>
                    <p className="text-sm text-white/90">Applicant will be notified</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDenyConfirm(false);
                    setApplicantToDeny(null);
                  }}
                  className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Warning Message */}
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 mb-1">Deny Application</p>
                    <p className="text-sm text-red-700">
                      This applicant will be notified in-app that their application has been denied. They will see the notification in their dashboard bell icon. This action can be reversed later if needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Applicant Info */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Applicant Details:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{applicantToDeny.applicantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{applicantToDeny.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Rank: #{applicantToDeny.rank}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm font-semibold text-orange-600">Score: {applicantToDeny.matchScore?.toFixed(1) || 'N/A'}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preview */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Bell className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-900">Notification Preview:</p>
                </div>
                <p className="text-sm text-amber-800 italic">
                  "Thank you for applying to {applicantToDeny.jobTitle}. Unfortunately, your application has not been approved at this time. We encourage you to apply for other positions."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDenyConfirm(false);
                    setApplicantToDeny(null);
                  }}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  icon={AlertCircle}
                  loading={submitting}
                  onClick={handleDenyConfirm}
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Denying...' : 'Deny'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDS Viewer Modal (for PDF files) */}
      <PDSViewerModal
        isOpen={pdsViewerState?.isOpen || false}
        onClose={() => setPdsViewerState(null)}
        pdsUrl={pdsViewerState?.url || ''}
        applicantName={pdsViewerState?.applicantName || ''}
      />

      {/* PDS Data Modal (for web-based PDS) */}
      <PDSViewModal
        isOpen={pdsDataModal?.isOpen || false}
        onClose={() => setPdsDataModal(null)}
        pdsData={pdsDataModal?.data}
        applicantName={pdsDataModal?.applicantName || ''}
      />

      {/* NEW WORKFLOW MODALS */}

      {/* Deny Modal with Reason */}
      <DenyModal
        isOpen={showDenyModal}
        onClose={() => {
          setShowDenyModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleDenyConfirmNew}
        submitting={submitting}
      />

      {/* Shortlist Modal */}
      <ShortlistModal
        isOpen={showShortlistModal}
        onClose={() => {
          setShowShortlistModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleShortlistConfirm}
        submitting={submitting}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleInterviewModal}
        onClose={() => {
          setShowScheduleInterviewModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleScheduleInterviewConfirm}
        submitting={submitting}
      />

      {/* Approve Modal with Next Steps */}
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleApproveConfirmNew}
        submitting={submitting}
      />

      {/* Mark as Hired Modal */}
      <MarkAsHiredModal
        isOpen={showMarkAsHiredModal}
        onClose={() => {
          setShowMarkAsHiredModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleMarkAsHiredConfirm}
        submitting={submitting}
      />

      {/* Under Review Modal */}
      <UnderReviewModal
        isOpen={showUnderReviewModal}
        onClose={() => {
          setShowUnderReviewModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleMarkUnderReviewConfirm}
        submitting={submitting}
      />

      {/* Reverse to Pending Modal */}
      <ReverseToPendingModal
        isOpen={showReverseToPendingModal}
        onClose={() => {
          setShowReverseToPendingModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleReverseToPendingConfirm}
        submitting={submitting}
      />

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedApplicationForAction(null);
        }}
        application={selectedApplicationForAction}
        onConfirm={handleArchiveConfirm}
        submitting={submitting}
      />

      {/* Application Details Drawer */}
      <ApplicationDrawer
        isOpen={showApplicationDrawer}
        onClose={() => {
          setShowApplicationDrawer(false);
          setSelectedApplicationForDrawer(null);
        }}
        application={selectedApplicationForDrawer}
      />

      {/* Status History Modal */}
      {showStatusHistoryModal && selectedApplicationForHistory && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all">
            {/* Blue Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Status History</h3>
                    <p className="text-sm text-white/90">{selectedApplicationForHistory.applicantName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStatusHistoryModal(false);
                    setSelectedApplicationForHistory(null);
                  }}
                  className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Position Info */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{selectedApplicationForHistory.jobTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Applied on {selectedApplicationForHistory.appliedDate}</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-visible">
                <StatusTimeline
                  statusHistory={selectedApplicationForHistory.statusHistory || []}
                  currentStatus={selectedApplicationForHistory.status}
                />
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowStatusHistoryModal(false);
                    setSelectedApplicationForHistory(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={previewImageUrl}
        imageName={`${previewUserName}'s Profile Picture`}
        userName={previewUserName}
      />
    </AdminLayout>
  );
}
