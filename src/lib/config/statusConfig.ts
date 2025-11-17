import { CheckCircle, Clock, XCircle, Eye, Star, Calendar, Briefcase, Archive, AlertCircle, UserCheck, Play, Award, Ban } from 'lucide-react';

/**
 * Centralized Status Configuration
 *
 * Single source of truth for all application status colors, labels, and icons.
 * Used across job applications and training applications.
 */

export type JobStatus =
  | 'pending'
  | 'under_review'
  | 'shortlisted'
  | 'interviewed'
  | 'approved'
  | 'denied'
  | 'hired'
  | 'archived'
  | 'withdrawn';

export type TrainingStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'denied'
  | 'enrolled'
  | 'in_progress'
  | 'completed'
  | 'certified'
  | 'withdrawn'
  | 'failed'
  | 'archived';

export type ApplicationStatus = JobStatus | TrainingStatus;

export interface StatusConfig {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeVariant: 'success' | 'danger' | 'warning' | 'secondary' | 'primary' | 'teal';
  // Legacy support for ApplicationStatusBadge.tsx
  legacyColor?: string;
}

/**
 * Unified Status Configuration
 *
 * Color Scheme:
 * - Yellow: Pending, Certified
 * - Blue: Under Review, Enrolled
 * - Green: Approved
 * - Red: Denied, Failed
 * - Orange: Shortlisted
 * - Purple: Interviewed
 * - Teal: Hired, In Progress
 * - Gray: Completed, Archived, Withdrawn
 */
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Common statuses (both job and training)
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-600',
    badgeVariant: 'warning',
    legacyColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-600',
    badgeVariant: 'primary',
    legacyColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-600',
    badgeVariant: 'success',
    legacyColor: 'bg-green-100 text-green-800 border-green-200',
  },
  denied: {
    label: 'Denied',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600',
    badgeVariant: 'danger',
    legacyColor: 'bg-red-100 text-red-800 border-red-200',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-600',
    badgeVariant: 'secondary',
    legacyColor: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-500',
    badgeVariant: 'secondary',
    legacyColor: 'bg-gray-100 text-gray-800 border-gray-200',
  },

  // Job-specific statuses
  shortlisted: {
    label: 'Shortlisted',
    icon: Star,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-600',
    badgeVariant: 'warning',
    legacyColor: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  interviewed: {
    label: 'Interviewed',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-600',
    badgeVariant: 'primary',
    legacyColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  hired: {
    label: 'Hired',
    icon: Briefcase,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-600',
    badgeVariant: 'teal',
    legacyColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },

  // Training-specific statuses
  enrolled: {
    label: 'Enrolled',
    icon: UserCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-600',
    badgeVariant: 'primary',
    legacyColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-600',
    badgeVariant: 'teal',
    legacyColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-600',
    badgeVariant: 'secondary',
    legacyColor: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  certified: {
    label: 'Certified',
    icon: Award,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-600',
    badgeVariant: 'warning',
    legacyColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  failed: {
    label: 'Failed',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600',
    badgeVariant: 'danger',
    legacyColor: 'bg-red-100 text-red-800 border-red-200',
  },
};

/**
 * Get status configuration by status key
 *
 * @param status - The status key (e.g., 'pending', 'approved', etc.)
 * @returns StatusConfig object with label, colors, icon, etc.
 */
export const getStatusConfig = (status: string): StatusConfig => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
};

/**
 * Get all training-specific statuses
 */
export const getTrainingStatuses = (): TrainingStatus[] => {
  return [
    'pending',
    'under_review',
    'approved',
    'denied',
    'enrolled',
    'in_progress',
    'completed',
    'certified',
    'withdrawn',
    'failed',
    'archived',
  ];
};

/**
 * Get all job-specific statuses
 */
export const getJobStatuses = (): JobStatus[] => {
  return [
    'pending',
    'under_review',
    'shortlisted',
    'interviewed',
    'approved',
    'denied',
    'hired',
    'archived',
    'withdrawn',
  ];
};

/**
 * Check if a status is a training status
 */
export const isTrainingStatus = (status: string): boolean => {
  return getTrainingStatuses().includes(status as TrainingStatus);
};

/**
 * Check if a status is a job status
 */
export const isJobStatus = (status: string): boolean => {
  return getJobStatuses().includes(status as JobStatus);
};
