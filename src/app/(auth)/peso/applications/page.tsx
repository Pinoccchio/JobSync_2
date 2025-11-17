'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout';
import { Avatar, Card, EnhancedTable, Button, Container, Badge, RefreshButton, ModernModal, Input, Textarea, DropdownMenu, ImagePreviewModal } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { StatusTimeline } from '@/components/peso/StatusTimeline';
import { getStatusConfig } from '@/lib/config/statusConfig';
import { generateCertificatePreview, generateCertificateId } from '@/lib/certificates/certificateGenerator';
import type { CertificateData, CertificateLayoutParams } from '@/types/certificate.types';
import { MarkAttendanceModal } from '@/components/peso/MarkAttendanceModal';
import { AwardCompletionModal } from '@/components/peso/AwardCompletionModal';
import BulkCertificateModal from '@/components/peso/BulkCertificateModal';
import CertificatePreview from '@/components/peso/CertificatePreview';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// import { useTableRealtime } from '@/hooks/useTableRealtime'; // REMOVED: Realtime disabled
import { Eye, CheckCircle, XCircle, User, Mail, Phone, MapPin, GraduationCap, Briefcase, Clock, Download, Image as ImageIcon, Filter, Loader2, History, UserCheck, Play, Award, CheckCircle2, AlertCircle, FileText, Users, ExternalLink, CheckSquare, Square, FileCheck } from 'lucide-react';

interface TrainingProgram {
  id: string;
  title: string;
  duration: string;
  start_date: string;
}

interface StatusHistoryItem {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

interface TrainingApplication {
  id: string;
  program_id: string;
  applicant_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  highest_education: string;
  id_image_url: string;
  id_image_name: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'enrolled' | 'in_progress' | 'completed' | 'certified' | 'withdrawn' | 'failed' | 'archived';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  status_history?: StatusHistoryItem[];
  training_programs?: TrainingProgram;
  profiles?: {
    profile_image_url?: string | null;
  };
}

export default function PESOApplicationsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [underReviewModalOpen, setUnderReviewModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [certifyModalOpen, setCertifyModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TrainingApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [nextSteps, setNextSteps] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [includeSignature, setIncludeSignature] = useState(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [signatureLoading, setSignatureLoading] = useState<boolean>(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  // Bulk operations state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showBulkCertificateModal, setShowBulkCertificateModal] = useState(false);
  const [selectedProgramForBulk, setSelectedProgramForBulk] = useState<any | null>(null);
  const [programApplicationsForBulk, setProgramApplicationsForBulk] = useState<any[]>([]);
  const [loadingBulkApps, setLoadingBulkApps] = useState(false);
  const [programStats, setProgramStats] = useState<{
    total: number;
    enrolled: number;
    inProgress: number;
    completed: number;
  } | null>(null);

  // Multi-select state for bulk status updates
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkReviewModalOpen, setBulkReviewModalOpen] = useState(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [bulkDenyModalOpen, setBulkDenyModalOpen] = useState(false);
  const [bulkEnrollModalOpen, setBulkEnrollModalOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>('');

  // Fetch training applications function
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/applications?status=all');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch applications');
      }

      setApplications(result.data || []);
      showToast('Applications refreshed', 'success');
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // REMOVED: Real-time subscription disabled for performance
  // useTableRealtime('training_applications', ['INSERT', 'UPDATE', 'DELETE'], null, () => {
  //   showToast('Training application updated', 'info');
  //   // fetchApplications(); // Uncomment when real data
  // });

  // Handle avatar click to show image preview
  const handleAvatarClick = (imageUrl: string | null, userName: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewUserName(userName);
      setShowImagePreview(true);
    }
  };

  // Handle view details
  const handleView = (application: TrainingApplication) => {
    setSelectedApplication(application);
    setViewModalOpen(true);
  };

  // Handle view status history
  const handleViewHistory = (application: TrainingApplication) => {
    setSelectedApplication(application);
    setHistoryModalOpen(true);
  };

  // Handle mark as under review
  const handleUnderReview = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark as under review');
      }

      showToast(result.message || 'Application marked as under review', 'success');
      setUnderReviewModalOpen(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error updating application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve application with next steps
  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          next_steps: nextSteps || undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve application');
      }

      showToast(result.message || 'Application approved successfully', 'success');
      setApproveModalOpen(false);
      setSelectedApplication(null);
      setNextSteps('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle deny application with reason
  const handleDeny = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'denied',
          denial_reason: denialReason || undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to deny application');
      }

      showToast(result.message || 'Application denied successfully', 'success');
      setDenyModalOpen(false);
      setSelectedApplication(null);
      setDenialReason('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error denying application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle enroll applicant
  const handleEnroll = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'enrolled' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enroll applicant');
      }

      showToast(result.message || 'Applicant enrolled successfully', 'success');
      setEnrollModalOpen(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error enrolling applicant:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle mark as completed
  const handleComplete = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark as completed');
      }

      showToast(result.message || 'Training marked as completed', 'success');
      setCompleteModalOpen(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error: any) {
      console.error('Error completing training:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate certificate
  const handleGenerateCertificate = async () => {
    if (!selectedApplication) return;

    try {
      setGenerateLoading(true);

      // Call generate API
      const response = await fetch('/api/training/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          include_signature: includeSignature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate certificate');
      }

      showToast(result.message || 'Certificate generated and issued successfully!', 'success');
      setCertifyModalOpen(false);
      setSelectedApplication(null);
      setIncludeSignature(false);
      setHasSignature(false);
      setSignatureLoading(false);
      fetchApplications();
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle preview certificate
  const handlePreviewCertificate = async () => {
    if (!selectedApplication || !selectedApplication.training_programs) return;

    try {
      // Call server-side preview API (supports signature loading)
      const response = await fetch('/api/training/certificates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          include_signature: includeSignature,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to generate preview');
      }

      // Get PDF blob from server
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the URL after opening
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error previewing certificate:', error);
      showToast(getErrorMessage(error), 'error');
    }
  };

  // Fetch signature status
  const fetchSignatureStatus = async () => {
    try {
      setSignatureLoading(true);
      const response = await fetch('/api/peso/signature');
      const result = await response.json();

      if (response.ok && result.success) {
        setHasSignature(!!result.signatureUrl);
      } else {
        setHasSignature(false);
      }
    } catch (error: any) {
      console.error('Error fetching signature status:', error);
      setHasSignature(false);
    } finally {
      setSignatureLoading(false);
    }
  };

  // Get unique programs for filter
  const uniquePrograms = Array.from(
    new Set(applications.map(a => a.training_programs?.title).filter(Boolean))
  );

  // Filter applications by program
  const filteredApplications = applications.filter(a => {
    if (programFilter === 'all') return true;
    return a.training_programs?.title === programFilter;
  });

  // Get badge variant and icon for status using centralized config
  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    return {
      variant: statusConfig.badgeVariant,
      icon: statusConfig.icon,
      label: statusConfig.label,
    };
  };

  // Multi-select handlers
  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedApplications);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApplications(newSet);
  };

  const handleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length && filteredApplications.length > 0) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedApplications(new Set());
  };

  // Get selected applications
  const getSelectedApplications = () => {
    return filteredApplications.filter(a => selectedApplications.has(a.id));
  };

  // Helper functions to get eligible applications for each bulk action
  const getEligibleForReview = () => {
    return getSelectedApplications().filter(a => a.status === 'pending');
  };

  const getEligibleForApprove = () => {
    return getSelectedApplications().filter(a => a.status === 'under_review');
  };

  const getEligibleForDeny = () => {
    return getSelectedApplications().filter(a => ['pending', 'under_review'].includes(a.status));
  };

  const getEligibleForEnroll = () => {
    return getSelectedApplications().filter(a => a.status === 'approved');
  };

  // Smart validation for bulk actions (DYNAMIC - allows mixed statuses)
  // SAFETY: Bulk actions are disabled when "All Programs" is selected to prevent
  // cross-program operations and capacity validation issues
  // NEW: Shows buttons if ANY selected apps are eligible (not ALL)
  const canBulkReview = () => {
    if (programFilter === 'all') return false; // Prevent cross-program bulk actions
    return getEligibleForReview().length > 0; // Show if ANY are eligible
  };

  const canBulkApprove = () => {
    if (programFilter === 'all') return false; // Prevent cross-program bulk actions
    return getEligibleForApprove().length > 0; // Show if ANY are eligible
  };

  const canBulkDeny = () => {
    if (programFilter === 'all') return false; // Prevent cross-program bulk actions
    return getEligibleForDeny().length > 0; // Show if ANY are eligible
  };

  const canBulkEnroll = () => {
    if (programFilter === 'all') return false; // Prevent cross-program bulk actions
    return getEligibleForEnroll().length > 0; // Show if ANY are eligible
  };

  // Bulk operation handlers
  const handleBulkReview = async () => {
    // Filter only eligible applications (status: pending)
    const eligible = getEligibleForReview();
    const eligibleIds = eligible.map(a => a.id);

    // Confirmation for large selections
    if (eligible.length > 10) {
      const confirmed = window.confirm(
        `You are about to mark ${eligible.length} pending applications as under review. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      setBulkActionLoading(true);

      const results = await Promise.all(
        eligibleIds.map(id =>
          fetch(`/api/training/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'under_review' }),
          })
        )
      );

      const succeeded = results.filter(r => r.ok).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        showToast(`Marked ${succeeded} of ${eligible.length} applications as under review`, 'success');
      }
      if (failed > 0) {
        showToast(`Failed to update ${failed} applications`, 'error');
      }

      setBulkReviewModalOpen(false);
      setSelectedApplications(new Set());
      fetchApplications();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showToast('Failed to update applications', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    // Filter only eligible applications (status: under_review)
    const eligible = getEligibleForApprove();
    const eligibleIds = eligible.map(a => a.id);

    if (eligibleIds.length === 0) {
      showToast('No eligible applications to approve', 'error');
      return;
    }

    // Confirmation for large selections
    if (eligible.length > 10) {
      const confirmed = window.confirm(
        `You are about to approve ${eligible.length} applications under review. This action cannot be undone. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      setBulkActionLoading(true);

      // Send status update without optional next_steps field (API will use default message)
      const results = await Promise.all(
        eligibleIds.map(id =>
          fetch(`/api/training/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'approved',
            }),
          })
        )
      );

      const succeeded = results.filter(r => r.ok).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        showToast(`Approved ${succeeded} of ${eligible.length} applications`, 'success');
      }
      if (failed > 0) {
        showToast(`Failed to approve ${failed} applications`, 'error');
      }

      setBulkApproveModalOpen(false);
      setSelectedApplications(new Set());
      fetchApplications();
    } catch (error) {
      console.error('Error bulk approving:', error);
      showToast('Failed to approve applications', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeny = async () => {
    // Filter only eligible applications (status: pending or under_review)
    const eligible = getEligibleForDeny();
    const eligibleIds = eligible.map(a => a.id);

    if (eligibleIds.length === 0) {
      showToast('No eligible applications to deny', 'error');
      return;
    }

    // Confirmation for large selections
    if (eligible.length > 10) {
      const confirmed = window.confirm(
        `You are about to deny ${eligible.length} applications. This action cannot be undone. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      setBulkActionLoading(true);

      // Send status update without optional denial_reason field (API will use default message)
      const results = await Promise.all(
        eligibleIds.map(id =>
          fetch(`/api/training/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'denied',
            }),
          })
        )
      );

      const succeeded = results.filter(r => r.ok).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        showToast(`Denied ${succeeded} of ${eligible.length} applications`, 'success');
      }
      if (failed > 0) {
        showToast(`Failed to deny ${failed} applications`, 'error');
      }

      setBulkDenyModalOpen(false);
      setSelectedApplications(new Set());
      fetchApplications();
    } catch (error) {
      console.error('Error bulk denying:', error);
      showToast('Failed to deny applications', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkEnroll = async () => {
    // Filter only eligible applications (status: approved)
    const eligible = getEligibleForEnroll();
    const eligibleIds = eligible.map(a => a.id);

    if (eligibleIds.length === 0) {
      showToast('No eligible applications to enroll', 'error');
      return;
    }

    // Confirmation for large selections
    if (eligibleIds.length > 10) {
      const confirmed = window.confirm(
        `You are about to enroll ${eligibleIds.length} approved applicants. This action cannot be undone. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      setBulkActionLoading(true);

      const results = await Promise.all(
        eligibleIds.map(id =>
          fetch(`/api/training/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'enrolled' }),
          })
        )
      );

      const succeeded = results.filter(r => r.ok).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        showToast(`Enrolled ${succeeded} of ${eligibleIds.length} applicants`, 'success');
      }
      if (failed > 0) {
        showToast(`Failed to enroll ${failed} applicants`, 'error');
      }

      setBulkEnrollModalOpen(false);
      setSelectedApplications(new Set());
      fetchApplications();
    } catch (error) {
      console.error('Error bulk enrolling:', error);
      showToast('Failed to enroll applicants', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Calculate stats for filtered program
  const calculateProgramStats = useCallback((programTitle: string) => {
    const programApps = applications.filter(app =>
      app.training_programs?.title === programTitle
    );

    return {
      total: programApps.length,
      enrolled: programApps.filter(a => a.status === 'enrolled').length,
      inProgress: programApps.filter(a => a.status === 'in_progress').length,
      completed: programApps.filter(a => a.status === 'completed').length,
    };
  }, [applications]);

  // Handle Mark Attendance Click (Bulk Operation)
  const handleBulkAttendanceClick = async () => {
    if (programFilter === 'all') return;

    try {
      setLoadingBulkApps(true);
      const programId = applications.find(a =>
        a.training_programs?.title === programFilter
      )?.program_id;

      if (!programId) {
        showToast('Program not found', 'error');
        return;
      }

      // Fetch only enrolled applications (not yet attended)
      const response = await fetch(
        `/api/training/applications?program_id=${programId}&status=enrolled`
      );
      const result = await response.json();

      if (result.success) {
        setSelectedProgramForBulk({ id: programId, title: programFilter });
        setProgramApplicationsForBulk(result.data || []);
        setShowAttendanceModal(true);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to fetch applications', 'error');
    } finally {
      setLoadingBulkApps(false);
    }
  };

  // Handle Award Completion Click (Bulk Operation)
  const handleBulkCompletionClick = async () => {
    if (programFilter === 'all') return;

    try {
      setLoadingBulkApps(true);
      const programId = applications.find(a =>
        a.training_programs?.title === programFilter
      )?.program_id;

      if (!programId) {
        showToast('Program not found', 'error');
        return;
      }

      // Fetch in_progress applications
      const response = await fetch(
        `/api/training/applications?program_id=${programId}&status=in_progress`
      );
      const result = await response.json();

      if (result.success) {
        const program = applications.find(a =>
          a.training_programs?.title === programFilter
        )?.training_programs;

        setSelectedProgramForBulk({
          id: programId,
          title: programFilter,
          duration: program?.duration
        });
        setProgramApplicationsForBulk(result.data || []);
        setShowCompletionModal(true);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to fetch applications', 'error');
    } finally {
      setLoadingBulkApps(false);
    }
  };

  // Handle Issue Certificates Click (Bulk Operation)
  const handleBulkCertificateClick = async () => {
    if (programFilter === 'all') return;

    try {
      setLoadingBulkApps(true);
      const programId = applications.find(a =>
        a.training_programs?.title === programFilter
      )?.program_id;

      if (!programId) {
        showToast('Program not found', 'error');
        return;
      }

      // Fetch completed applications (not yet certified)
      const response = await fetch(
        `/api/training/applications?program_id=${programId}&status=completed`
      );
      const result = await response.json();

      if (result.success) {
        if (!result.data || result.data.length === 0) {
          showToast('No completed applications found for this program', 'info');
          return;
        }

        setSelectedProgramForBulk({ id: programId, title: programFilter });
        setProgramApplicationsForBulk(result.data || []);
        setShowBulkCertificateModal(true);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to fetch applications', 'error');
    } finally {
      setLoadingBulkApps(false);
    }
  };

  // Handle Mark Attendance Submit (Bulk Operation)
  const handleMarkAttendance = async (selectedIds: string[]) => {
    if (!selectedProgramForBulk) return;

    try {
      const response = await fetch('/api/training/applications/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgramForBulk.id,
          attended_ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'Attendance marked successfully', 'success');
        setShowAttendanceModal(false);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      showToast('Failed to mark attendance', 'error');
      throw error;
    }
  };

  // Handle Award Completion Submit (Bulk Operation)
  const handleAwardCompletion = async (completionData: any[]) => {
    try {
      const completions = completionData.map(data => ({
        application_id: data.applicantId,
        completion_status: data.completionStatus,
        training_hours_awarded: data.hoursAwarded,
        assessment_score: data.assessmentScore,
        completion_notes: data.notes,
      }));

      const response = await fetch('/api/training/applications/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completions }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'Completion awarded successfully', 'success');
        setShowCompletionModal(false);
        fetchApplications();
      } else {
        showToast(getErrorMessage(result.error), 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error awarding completion:', error);
      showToast('Failed to award completion', 'error');
      throw error;
    }
  };

  // Build columns dynamically - hide checkboxes when "All Programs" is selected
  const columns = useMemo(() => {
    const baseColumns = [
    {
      header: 'Full Name',
      accessor: 'full_name' as const,
      render: (value: string, row: TrainingApplication) => (
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={row.profiles?.profile_image_url}
            userName={value}
            size="sm"
            onClick={() => handleAvatarClick(row.profiles?.profile_image_url, value)}
            clickable
          />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Education',
      accessor: 'highest_education' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Applied Training',
      accessor: 'training_programs' as const,
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value?.title || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string) => {
        const statusConfig = getStatusBadge(value);
        return (
          <Badge
            variant={statusConfig.variant}
            icon={statusConfig.icon}
          >
            {statusConfig.label}
          </Badge>
        );
      }
    },
    {
      header: 'History',
      accessor: 'status_history' as const,
      render: (_: any, row: TrainingApplication) => (
        <Button
          variant="secondary"
          size="sm"
          icon={History}
          onClick={() => handleViewHistory(row)}
          disabled={!row.status_history || row.status_history.length === 0}
        >
          {row.status_history && row.status_history.length > 0
            ? `${row.status_history.length} changes`
            : 'No history'}
        </Button>
      )
    },
    {
      header: 'Actions',
      accessor: 'id' as const,
      render: (_: any, row: TrainingApplication) => {
        const menuItems = [
          {
            label: 'View Details',
            icon: Eye,
            onClick: () => handleView(row),
            variant: 'default' as const,
          },
          {
            label: 'View Status History',
            icon: History,
            onClick: () => handleViewHistory(row),
            variant: 'default' as const,
          },
        ];

        // Add status-specific actions
        if (row.status === 'pending') {
          menuItems.push(
            {
              label: 'Mark as Under Review',
              icon: Eye,
              onClick: () => {
                setSelectedApplication(row);
                setUnderReviewModalOpen(true);
              },
              variant: 'default' as const,
            },
            {
              label: 'Approve',
              icon: CheckCircle2,
              onClick: () => {
                setSelectedApplication(row);
                setApproveModalOpen(true);
              },
              variant: 'default' as const,
            },
            {
              label: 'Deny',
              icon: XCircle,
              onClick: () => {
                setSelectedApplication(row);
                setDenyModalOpen(true);
              },
              variant: 'default' as const,
            }
          );
        } else if (row.status === 'under_review') {
          menuItems.push(
            {
              label: 'Approve',
              icon: CheckCircle2,
              onClick: () => {
                setSelectedApplication(row);
                setApproveModalOpen(true);
              },
              variant: 'default' as const,
            },
            {
              label: 'Deny',
              icon: XCircle,
              onClick: () => {
                setSelectedApplication(row);
                setDenyModalOpen(true);
              },
              variant: 'default' as const,
            }
          );
        } else if (row.status === 'approved') {
          menuItems.push({
            label: 'Enroll',
            icon: UserCheck,
            onClick: () => {
              setSelectedApplication(row);
              setEnrollModalOpen(true);
            },
            variant: 'default' as const,
          });
        } else if (row.status === 'enrolled') {
          menuItems.push({
            label: 'Mark Attendance',
            icon: UserCheck,
            onClick: () => {
              // Individual operation - reuse bulk modal with single applicant
              setSelectedProgramForBulk({
                id: row.training_programs?.id || '',
                title: row.training_programs?.title || '',
              });
              setProgramApplicationsForBulk([row]);
              setShowAttendanceModal(true);
            },
            variant: 'default' as const,
            tooltip: 'Mark attendance and officially start training for this trainee',
          });
        } else if (row.status === 'in_progress') {
          menuItems.push({
            label: 'Award Completion',
            icon: Award,
            onClick: () => {
              // Individual operation - reuse bulk modal with single applicant
              setSelectedProgramForBulk({
                id: row.training_programs?.id || '',
                title: row.training_programs?.title || '',
                duration: row.training_programs?.duration || '0 hours',
              });
              setProgramApplicationsForBulk([row]);
              setShowCompletionModal(true);
            },
            variant: 'default' as const,
          });
        } else if (row.status === 'completed') {
          menuItems.push({
            label: 'Issue Certificate',
            icon: Award,
            onClick: () => {
              setSelectedApplication(row);
              setCertifyModalOpen(true);
              fetchSignatureStatus(); // Fetch signature status when modal opens
            },
            variant: 'default' as const,
          });
        }

        return <DropdownMenu items={menuItems} />;
      },
    },
    ];

    // Only show checkbox column when a specific program is selected (not "all")
    if (programFilter !== 'all') {
      return [
        {
          header: (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = selectedApplications.size > 0 && selectedApplications.size < filteredApplications.length;
                  }
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                title={selectedApplications.size === filteredApplications.length ? "Deselect All" : "Select All"}
              />
            </div>
          ),
          accessor: 'select' as const,
          render: (_: any, row: TrainingApplication) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedApplications.has(row.id)}
                onChange={() => handleToggleSelect(row.id)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
              />
            </div>
          )
        },
        ...baseColumns,
      ];
    }

    return baseColumns;
  }, [programFilter, selectedApplications, filteredApplications, handleSelectAll, handleToggleSelect]);

  return (
    <AdminLayout role="PESO" userName={user?.fullName || 'PESO Admin'} pageTitle="Training Applications" pageDescription="Manage and review training program applications">
      <Container size="xl">
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <RefreshButton onRefresh={fetchApplications} label="Refresh" showLastRefresh={true} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Row 1: Application Status */}
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => ['pending', 'under_review'].includes(a.status)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'approved').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Denied</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'denied').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Row 2: Training Progress */}
            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Enrolled</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'enrolled').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-teal-50 to-teal-100 border-l-4 border-teal-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Certified</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> : applications.filter(a => a.status === 'certified').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Program Filter */}
          {uniquePrograms.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filter by Program:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={programFilter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setProgramFilter('all')}
                >
                  All Programs ({applications.length})
                </Button>
                {uniquePrograms.map((program) => (
                  <Button
                    key={program}
                    variant={programFilter === program ? 'success' : 'secondary'}
                    size="sm"
                    onClick={() => setProgramFilter(program as string)}
                  >
                    {program} ({applications.filter(a => a.training_programs?.title === program).length})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Bulk Actions Banner - Shows when program is filtered */}
          {programFilter !== 'all' && (() => {
            const stats = calculateProgramStats(programFilter);
            const canMarkAttendance = stats.enrolled > 0; // Only enrolled (not yet attended)
            const canAwardCompletion = stats.inProgress > 0;
            const canIssueCertificates = stats.completed > 0;

            return (
              <Card variant="flat" className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{programFilter}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {stats.total} Total
                      </span>
                      {stats.enrolled > 0 && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-purple-600" />
                          {stats.enrolled} Enrolled
                        </span>
                      )}
                      {stats.inProgress > 0 && (
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4 text-teal-600" />
                          {stats.inProgress} In Progress
                        </span>
                      )}
                      {stats.completed > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-gray-600" />
                          {stats.completed} Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {canMarkAttendance && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={UserCheck}
                        onClick={handleBulkAttendanceClick}
                        disabled={loadingBulkApps}
                        className="whitespace-nowrap"
                        title="Mark attendance and officially start training for enrolled trainees"
                      >
                        Mark Attendance ({stats.enrolled})
                      </Button>
                    )}
                    {canAwardCompletion && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={Award}
                        onClick={handleBulkCompletionClick}
                        disabled={loadingBulkApps}
                        className="whitespace-nowrap"
                      >
                        Award Completion ({stats.inProgress})
                      </Button>
                    )}
                    {canIssueCertificates && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={FileCheck}
                        onClick={handleBulkCertificateClick}
                        disabled={loadingBulkApps}
                        className="whitespace-nowrap"
                      >
                        Issue Certificates ({stats.completed})
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ExternalLink}
                      onClick={() => window.open('/peso/programs', '_blank')}
                      className="whitespace-nowrap"
                    >
                      View Program
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Warning Banner - Bulk actions disabled when "All Programs" selected */}
          {selectedApplications.size > 0 && programFilter === 'all' && (
            <Card variant="flat" className="bg-amber-50 border-l-4 border-amber-500 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Bulk Actions Disabled</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Bulk operations are disabled when viewing all programs to prevent accidental cross-program actions
                    and capacity issues. Please select a specific program from the filter above to enable bulk operations.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Bulk Action Toolbar - Shows when applications are selected */}
          {selectedApplications.size > 0 && (
            <Card variant="flat" className="bg-blue-50 border-l-4 border-blue-500 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {canBulkReview() && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setBulkReviewModalOpen(true)}
                      disabled={bulkActionLoading}
                      className="whitespace-nowrap"
                    >
                      Mark as Under Review ({getEligibleForReview().length})
                    </Button>
                  )}
                  {canBulkApprove() && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => setBulkApproveModalOpen(true)}
                      disabled={bulkActionLoading}
                      className="whitespace-nowrap"
                    >
                      Approve All ({getEligibleForApprove().length})
                    </Button>
                  )}
                  {canBulkDeny() && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => setBulkDenyModalOpen(true)}
                      disabled={bulkActionLoading}
                      className="whitespace-nowrap"
                    >
                      Deny All ({getEligibleForDeny().length})
                    </Button>
                  )}
                  {canBulkEnroll() && (
                    <Button
                      variant="teal"
                      size="sm"
                      icon={UserCheck}
                      onClick={() => setBulkEnrollModalOpen(true)}
                      disabled={bulkActionLoading}
                      className="whitespace-nowrap"
                    >
                      Enroll All ({getEligibleForEnroll().length})
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearSelection}
                    disabled={bulkActionLoading}
                    className="whitespace-nowrap"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Applications Table */}
          <Card title="TRAINING APPLICATION LIST" headerColor="bg-[#D4F4DD]" variant="elevated" className="hover:shadow-xl transition-shadow">
            <EnhancedTable
              columns={columns}
              data={filteredApplications}
              searchable
              paginated
              pageSize={10}
              searchPlaceholder="Search by name, email, training, or status..."
            />
          </Card>
        </div>

        {/* View Details Modal */}
        <ModernModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Application Details"
          subtitle="View training application information"
          colorVariant="blue"
          icon={FileText}
          size="lg"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-medium">{selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900">{selectedApplication.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Highest Educational Attainment</label>
                    <p className="text-gray-900">{selectedApplication.highest_education}</p>
                  </div>
                </div>
              </div>

              {/* Training Program Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                  Applied Training Program
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedApplication.training_programs?.title || 'N/A'}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Duration: {selectedApplication.training_programs?.duration || 'N/A'}</span>
                    <span>Start Date: {selectedApplication.training_programs?.start_date
                      ? new Date(selectedApplication.training_programs.start_date).toLocaleDateString()
                      : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Image */}
              {selectedApplication.id_image_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-teal-600" />
                    Submitted ID
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedApplication.id_image_url}
                      alt="Applicant ID"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => window.open(selectedApplication.id_image_url, '_blank')}
                    >
                      Download ID
                    </Button>
                  </div>
                </div>
              )}

              {/* Application Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Application Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        {(() => {
                          const statusBadge = getStatusBadge(selectedApplication.status);
                          return (
                            <Badge
                              variant={statusBadge.variant as any}
                              icon={statusBadge.icon}
                            >
                              {statusBadge.label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submitted At</label>
                      <p className="text-gray-900">
                        {new Date(selectedApplication.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedApplication.reviewed_at && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">Reviewed At</label>
                        <p className="text-gray-900">
                          {new Date(selectedApplication.reviewed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Approve Confirmation Modal */}
        <ModernModal
          isOpen={approveModalOpen}
          onClose={() => {
            setApproveModalOpen(false);
            setSelectedApplication(null);
            setNextSteps('');
          }}
          title="Approve Application"
          subtitle="Set next steps for applicant"
          colorVariant="green"
          icon={CheckCircle2}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-700">
                  Approving application from{' '}
                  <span className="font-semibold">{selectedApplication.full_name}</span> for{' '}
                  <span className="font-semibold">{selectedApplication.training_programs?.title}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Steps (Optional)
                </label>
                <Textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="e.g., Please wait for enrollment confirmation email with training schedule and requirements..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the applicant's notification
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setApproveModalOpen(false);
                    setSelectedApplication(null);
                    setNextSteps('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  onClick={handleApprove}
                  loading={actionLoading}
                >
                  Approve Application
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Deny Confirmation Modal */}
        <ModernModal
          isOpen={denyModalOpen}
          onClose={() => {
            setDenyModalOpen(false);
            setSelectedApplication(null);
            setDenialReason('');
          }}
          title="Deny Application"
          subtitle="Provide reason for denial"
          colorVariant="red"
          icon={XCircle}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700">
                  Denying application from{' '}
                  <span className="font-semibold">{selectedApplication.full_name}</span> for{' '}
                  <span className="font-semibold">{selectedApplication.training_programs?.title}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Denial (Optional)
                </label>
                <Textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="e.g., Does not meet minimum educational requirements for this program..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the applicant's notification
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDenyModalOpen(false);
                    setSelectedApplication(null);
                    setDenialReason('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  onClick={handleDeny}
                  loading={actionLoading}
                >
                  Deny Application
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Mark as Under Review Modal */}
        <ModernModal
          isOpen={underReviewModalOpen}
          onClose={() => {
            setUnderReviewModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Mark as Under Review"
          subtitle="Update application status"
          colorVariant="blue"
          icon={Eye}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  Mark application from{' '}
                  <span className="font-semibold">{selectedApplication.full_name}</span> as{' '}
                  <span className="font-semibold text-blue-700">Under Review</span>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This indicates that the PESO office is currently reviewing the application.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUnderReviewModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Eye}
                  onClick={handleUnderReview}
                  loading={actionLoading}
                >
                  Mark as Under Review
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Enroll Applicant Modal */}
        <ModernModal
          isOpen={enrollModalOpen}
          onClose={() => {
            setEnrollModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Enroll Applicant"
          subtitle="Confirm enrollment in training program"
          colorVariant="purple"
          icon={UserCheck}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-gray-700">
                  Confirm enrollment of{' '}
                  <span className="font-semibold">{selectedApplication.full_name}</span> in{' '}
                  <span className="font-semibold">{selectedApplication.training_programs?.title}</span>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  The applicant will be officially enrolled in the training program.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnrollModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={UserCheck}
                  onClick={handleEnroll}
                  loading={actionLoading}
                >
                  Confirm Enrollment
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Mark as Completed Modal */}
        <ModernModal
          isOpen={completeModalOpen}
          onClose={() => {
            setCompleteModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Mark Training as Completed"
          subtitle="Confirm training completion"
          colorVariant="gray"
          icon={CheckCircle}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  Mark training as completed for{' '}
                  <span className="font-semibold">{selectedApplication.full_name}</span>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This indicates the applicant has successfully finished the training program.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCompleteModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  icon={CheckCircle}
                  onClick={handleComplete}
                  loading={actionLoading}
                >
                  Mark as Completed
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Issue Certificate Modal */}
        <ModernModal
          isOpen={certifyModalOpen}
          onClose={() => {
            setCertifyModalOpen(false);
            setSelectedApplication(null);
            setIncludeSignature(false);
          }}
          title="Generate Training Certificate"
          subtitle="Preview and customize before issuing"
          colorVariant="green"
          icon={Award}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              {/* Certificate Details */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  Certificate Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trainee:</span>
                    <span className="font-semibold text-gray-900">{selectedApplication.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Program:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[300px]" title={selectedApplication.training_programs?.title}>
                      {selectedApplication.training_programs?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">{selectedApplication.training_programs?.duration}</span>
                  </div>
                </div>
              </div>

              {/* Signature Option */}
              <div className={`${
                hasSignature ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
              } border rounded-lg p-4`}>
                <label className={`flex items-start gap-3 ${hasSignature ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={includeSignature}
                    onChange={(e) => setIncludeSignature(e.target.checked)}
                    disabled={!hasSignature || signatureLoading}
                    className={`mt-0.5 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                      hasSignature ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium block ${hasSignature ? 'text-gray-900' : 'text-amber-900'}`}>
                      Include digital signature
                    </span>
                    <p className={`text-xs mt-1 ${hasSignature ? 'text-gray-600' : 'text-amber-700'}`}>
                      {signatureLoading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 inline animate-spin" />
                          Checking signature status...
                        </span>
                      ) : hasSignature ? (
                        'Your signature will be embedded on the certificate'
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Upload signature in Settings first
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  icon={Eye}
                  onClick={handlePreviewCertificate}
                  className="w-full"
                >
                  Preview in New Tab
                </Button>
                <Button
                  variant="success"
                  icon={Award}
                  onClick={handleGenerateCertificate}
                  loading={generateLoading}
                  disabled={generateLoading}
                  className="w-full"
                >
                  {generateLoading ? 'Generating...' : 'Generate & Issue Certificate'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCertifyModalOpen(false);
                    setSelectedApplication(null);
                    setIncludeSignature(false);
                  }}
                  disabled={generateLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Status History Modal */}
        <ModernModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Application Status History"
          subtitle={selectedApplication ? `${selectedApplication.full_name} - ${selectedApplication.training_programs?.title || 'N/A'}` : ''}
          colorVariant="blue"
          icon={History}
          size="xl"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Timeline */}
              {selectedApplication.status_history && selectedApplication.status_history.length > 0 ? (
                <StatusTimeline
                  statusHistory={selectedApplication.status_history}
                  currentStatus={selectedApplication.status}
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No status history available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This application has not been processed yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </ModernModal>

        {/* Mark Attendance Modal (Bulk Operation) */}
        {selectedProgramForBulk && (
          <MarkAttendanceModal
            isOpen={showAttendanceModal}
            onClose={() => {
              setShowAttendanceModal(false);
              setSelectedProgramForBulk(null);
              setProgramApplicationsForBulk([]);
            }}
            program={{
              id: selectedProgramForBulk.id,
              title: selectedProgramForBulk.title,
            }}
            applications={programApplicationsForBulk}
            onSubmit={handleMarkAttendance}
          />
        )}

        {/* Award Completion Modal (Bulk Operation) */}
        {selectedProgramForBulk && (
          <AwardCompletionModal
            isOpen={showCompletionModal}
            onClose={() => {
              setShowCompletionModal(false);
              setSelectedProgramForBulk(null);
              setProgramApplicationsForBulk([]);
            }}
            program={{
              id: selectedProgramForBulk.id,
              title: selectedProgramForBulk.title,
              duration: selectedProgramForBulk.duration || 'N/A',
            }}
            applications={programApplicationsForBulk}
            onSubmit={handleAwardCompletion}
          />
        )}

        {/* Issue Certificates Modal (Bulk Operation) */}
        {selectedProgramForBulk && (
          <BulkCertificateModal
            isOpen={showBulkCertificateModal}
            onClose={() => {
              setShowBulkCertificateModal(false);
              setSelectedProgramForBulk(null);
              setProgramApplicationsForBulk([]);
            }}
            applications={programApplicationsForBulk}
            programTitle={selectedProgramForBulk.title}
            onComplete={() => {
              fetchApplications();
            }}
          />
        )}

        {/* Bulk Mark as Under Review Modal */}
        <ModernModal
          isOpen={bulkReviewModalOpen}
          onClose={() => setBulkReviewModalOpen(false)}
          title="Mark as Under Review"
          subtitle={`Update ${getEligibleForReview().length} eligible application${getEligibleForReview().length !== 1 ? 's' : ''}`}
          colorVariant="blue"
          icon={Eye}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-sm text-blue-800">
                Are you sure you want to mark <strong>{getEligibleForReview().length} application{getEligibleForReview().length !== 1 ? 's' : ''}</strong> as under review?
                {selectedApplications.size > getEligibleForReview().length && (
                  <span className="block mt-1 text-xs text-blue-700">
                    Note: Only pending applications will be affected.
                  </span>
                )}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Eligible Applicants (Pending):</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {getEligibleForReview().map(app => (
                  <li key={app.id} className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {app.full_name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setBulkReviewModalOpen(false)}
                className="flex-1"
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Eye}
                loading={bulkActionLoading}
                onClick={handleBulkReview}
                className="flex-1"
              >
                {bulkActionLoading ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </ModernModal>

        {/* Bulk Approve Modal */}
        <ModernModal
          isOpen={bulkApproveModalOpen}
          onClose={() => setBulkApproveModalOpen(false)}
          title="Approve Applications"
          subtitle={`Approve ${getEligibleForApprove().length} eligible application${getEligibleForApprove().length !== 1 ? 's' : ''}`}
          colorVariant="green"
          icon={CheckCircle}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <p className="text-sm text-green-800">
                Approve <strong>{getEligibleForApprove().length} application{getEligibleForApprove().length !== 1 ? 's' : ''}</strong> and notify applicants.
                {selectedApplications.size > getEligibleForApprove().length && (
                  <span className="block mt-1 text-xs text-green-700">
                    Note: Only applications under review will be approved.
                  </span>
                )}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Standard notification message will be sent:</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1 italic">
                "Your application has been approved. We will contact you soon with the next steps."
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Need a custom message? Update applications individually instead.
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Eligible Applicants (Under Review):</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {getEligibleForApprove().map(app => (
                  <li key={app.id} className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {app.full_name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setBulkApproveModalOpen(false)}
                className="flex-1"
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                icon={CheckCircle}
                loading={bulkActionLoading}
                onClick={() => handleBulkApprove()}
                className="flex-1"
              >
                {bulkActionLoading ? 'Approving...' : 'Approve All'}
              </Button>
            </div>
          </div>
        </ModernModal>

        {/* Bulk Deny Modal */}
        <ModernModal
          isOpen={bulkDenyModalOpen}
          onClose={() => setBulkDenyModalOpen(false)}
          title="Deny Applications"
          subtitle={`Deny ${getEligibleForDeny().length} eligible application${getEligibleForDeny().length !== 1 ? 's' : ''}`}
          colorVariant="red"
          icon={XCircle}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="text-sm text-red-800">
                Deny <strong>{getEligibleForDeny().length} application{getEligibleForDeny().length !== 1 ? 's' : ''}</strong> and notify applicants.
                {selectedApplications.size > getEligibleForDeny().length && (
                  <span className="block mt-1 text-xs text-red-700">
                    Note: Only pending or under review applications will be denied.
                  </span>
                )}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-800">
                <strong>Standard notification message will be sent:</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1 italic">
                "Your application was reviewed. Please check your application details for more information. We encourage you to apply again in the future."
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Need a specific denial reason? Update applications individually instead.
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Eligible Applicants (Pending/Under Review):</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {getEligibleForDeny().map(app => (
                  <li key={app.id} className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {app.full_name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setBulkDenyModalOpen(false)}
                className="flex-1"
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={XCircle}
                loading={bulkActionLoading}
                onClick={() => handleBulkDeny()}
                className="flex-1"
              >
                {bulkActionLoading ? 'Denying...' : 'Deny All'}
              </Button>
            </div>
          </div>
        </ModernModal>

        {/* Bulk Enroll Modal */}
        <ModernModal
          isOpen={bulkEnrollModalOpen}
          onClose={() => setBulkEnrollModalOpen(false)}
          title="Enroll Applicants"
          subtitle={`Enroll ${getEligibleForEnroll().length} eligible applicant${getEligibleForEnroll().length !== 1 ? 's' : ''}`}
          colorVariant="teal"
          icon={UserCheck}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-teal-50 border-l-4 border-teal-600 p-4 rounded">
              <p className="text-sm text-teal-800">
                Enroll <strong>{getEligibleForEnroll().length} applicant{getEligibleForEnroll().length !== 1 ? 's' : ''}</strong> in their selected training programs.
                {selectedApplications.size > getEligibleForEnroll().length && (
                  <span className="block mt-1 text-xs text-teal-700">
                    Note: Only approved applications will be enrolled.
                  </span>
                )}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Eligible Applicants (Approved):</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {getEligibleForEnroll().map(app => (
                  <li key={app.id} className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {app.full_name} - {app.training_programs?.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setBulkEnrollModalOpen(false)}
                className="flex-1"
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="teal"
                icon={UserCheck}
                loading={bulkActionLoading}
                onClick={handleBulkEnroll}
                className="flex-1"
              >
                {bulkActionLoading ? 'Enrolling...' : 'Enroll All'}
              </Button>
            </div>
          </div>
        </ModernModal>

      </Container>

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
