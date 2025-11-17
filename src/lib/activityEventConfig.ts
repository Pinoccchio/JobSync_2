import {
  UserPlus, UserCheck, UserX, Trash2, UserCog, LogIn, LogOut,
  Briefcase, FileText, Megaphone, AlertCircle, CheckCircle2,
  Upload, Download, Shield, Bell, Settings, Database, Activity,
  Key, Lock, Unlock, Eye, EyeOff, Mail, MessageSquare, File,
  FileCheck, FileX, Clock, Calendar, type LucideIcon
} from 'lucide-react';

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type BadgeVariant =
  | 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending'
  | 'created' | 'activated' | 'deactivated' | 'deleted' | 'updated'
  | 'approved' | 'denied' | 'failed'
  | 'login' | 'logout'
  | 'system' | 'upload' | 'security' | 'notification';

export type EventCategory =
  | 'auth'
  | 'user_management'
  | 'application'
  | 'job'
  | 'training'
  | 'system';

export interface EventConfig {
  icon: LucideIcon;
  badgeVariant: BadgeVariant;
  severity: EventSeverity;
  label: string;
  description: string;
  category: EventCategory;
  rowColor?: string; // Tailwind class for table row background
  gradientColor?: string; // For icon backgrounds
}

/**
 * Centralized configuration for all activity event types
 * Maps event_type to visual properties (icon, color, severity, etc.)
 */
export const ACTIVITY_EVENT_CONFIG: Record<string, EventConfig> = {
  // ========================================
  // AUTH EVENTS
  // ========================================
  'login': {
    icon: LogIn,
    badgeVariant: 'login',
    severity: 'info',
    label: 'Login',
    description: 'User logged into the system',
    category: 'auth',
    rowColor: 'bg-cyan-50/30 hover:bg-cyan-50/50',
    gradientColor: 'from-cyan-500 to-cyan-600',
  },
  'logout': {
    icon: LogOut,
    badgeVariant: 'logout',
    severity: 'info',
    label: 'Logout',
    description: 'User logged out of the system',
    category: 'auth',
    rowColor: 'bg-gray-50 hover:bg-gray-100',
    gradientColor: 'from-gray-500 to-gray-600',
  },
  'login_failed': {
    icon: AlertCircle,
    badgeVariant: 'failed',
    severity: 'medium',
    label: 'Login Failed',
    description: 'Failed login attempt',
    category: 'auth',
    rowColor: 'bg-red-50/30 hover:bg-red-50/50',
    gradientColor: 'from-red-500 to-red-600',
  },
  'password_reset': {
    icon: Key,
    badgeVariant: 'security',
    severity: 'medium',
    label: 'Password Reset',
    description: 'User reset their password',
    category: 'auth',
    rowColor: 'bg-yellow-50/30 hover:bg-yellow-50/50',
    gradientColor: 'from-yellow-500 to-yellow-600',
  },

  // ========================================
  // USER MANAGEMENT EVENTS
  // ========================================
  'USER_CREATED': {
    icon: UserPlus,
    badgeVariant: 'created',
    severity: 'low',
    label: 'User Created',
    description: 'New user account was created',
    category: 'user_management',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'admin_create_user': {
    icon: UserPlus,
    badgeVariant: 'created',
    severity: 'low',
    label: 'Admin Created User',
    description: 'Admin created a new user account',
    category: 'user_management',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'USER_ACTIVATED': {
    icon: UserCheck,
    badgeVariant: 'activated',
    severity: 'low',
    label: 'User Activated',
    description: 'User account was activated',
    category: 'user_management',
    rowColor: 'bg-blue-50/30 hover:bg-blue-50/50',
    gradientColor: 'from-blue-500 to-blue-600',
  },
  'admin_activate_user': {
    icon: UserCheck,
    badgeVariant: 'activated',
    severity: 'low',
    label: 'User Activated',
    description: 'Admin activated a user account',
    category: 'user_management',
    rowColor: 'bg-blue-50/30 hover:bg-blue-50/50',
    gradientColor: 'from-blue-500 to-blue-600',
  },
  'USER_DEACTIVATED': {
    icon: UserX,
    badgeVariant: 'deactivated',
    severity: 'medium',
    label: 'User Deactivated',
    description: 'User account was deactivated',
    category: 'user_management',
    rowColor: 'bg-amber-50/30 hover:bg-amber-50/50',
    gradientColor: 'from-amber-500 to-amber-600',
  },
  'admin_deactivate_user': {
    icon: UserX,
    badgeVariant: 'deactivated',
    severity: 'medium',
    label: 'User Deactivated',
    description: 'Admin deactivated a user account',
    category: 'user_management',
    rowColor: 'bg-amber-50/30 hover:bg-amber-50/50',
    gradientColor: 'from-amber-500 to-amber-600',
  },
  'USER_DELETED': {
    icon: Trash2,
    badgeVariant: 'deleted',
    severity: 'high',
    label: 'User Deleted',
    description: 'User account was permanently deleted',
    category: 'user_management',
    rowColor: 'bg-red-50/30 hover:bg-red-50/50',
    gradientColor: 'from-red-500 to-red-600',
  },
  'admin_delete_user': {
    icon: Trash2,
    badgeVariant: 'deleted',
    severity: 'high',
    label: 'User Deleted',
    description: 'Admin deleted a user account',
    category: 'user_management',
    rowColor: 'bg-red-50/30 hover:bg-red-50/50',
    gradientColor: 'from-red-500 to-red-600',
  },
  'USER_PROFILE_UPDATED': {
    icon: UserCog,
    badgeVariant: 'updated',
    severity: 'low',
    label: 'Profile Updated',
    description: 'User profile information was updated',
    category: 'user_management',
    rowColor: 'bg-indigo-50/30 hover:bg-indigo-50/50',
    gradientColor: 'from-indigo-500 to-indigo-600',
  },
  'profile_update': {
    icon: UserCog,
    badgeVariant: 'updated',
    severity: 'low',
    label: 'Profile Updated',
    description: 'User updated their profile',
    category: 'user_management',
    rowColor: 'bg-indigo-50/30 hover:bg-indigo-50/50',
    gradientColor: 'from-indigo-500 to-indigo-600',
  },

  // ========================================
  // JOB EVENTS
  // ========================================
  'JOB_CREATED': {
    icon: Briefcase,
    badgeVariant: 'created',
    severity: 'low',
    label: 'Job Created',
    description: 'New job posting was created',
    category: 'job',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'job_created': {
    icon: Briefcase,
    badgeVariant: 'created',
    severity: 'low',
    label: 'Job Created',
    description: 'New job posting was created',
    category: 'job',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'job_updated': {
    icon: Briefcase,
    badgeVariant: 'updated',
    severity: 'low',
    label: 'Job Updated',
    description: 'Job posting was updated',
    category: 'job',
    rowColor: 'bg-indigo-50/30 hover:bg-indigo-50/50',
    gradientColor: 'from-indigo-500 to-indigo-600',
  },
  'job_deleted': {
    icon: Trash2,
    badgeVariant: 'deleted',
    severity: 'medium',
    label: 'Job Deleted',
    description: 'Job posting was deleted',
    category: 'job',
    rowColor: 'bg-red-50/30 hover:bg-red-50/50',
    gradientColor: 'from-red-500 to-red-600',
  },

  // ========================================
  // APPLICATION EVENTS
  // ========================================
  'application_submitted': {
    icon: FileText,
    badgeVariant: 'created',
    severity: 'info',
    label: 'Application Submitted',
    description: 'New job application was submitted',
    category: 'application',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'application_approve': {
    icon: CheckCircle2,
    badgeVariant: 'approved',
    severity: 'low',
    label: 'Application Approved',
    description: 'Job application was approved',
    category: 'application',
    rowColor: 'bg-green-50/30 hover:bg-green-50/50',
    gradientColor: 'from-green-500 to-green-600',
  },
  'application_reject': {
    icon: AlertCircle,
    badgeVariant: 'denied',
    severity: 'low',
    label: 'Application Denied',
    description: 'Job application was denied',
    category: 'application',
    rowColor: 'bg-rose-50/30 hover:bg-rose-50/50',
    gradientColor: 'from-rose-500 to-rose-600',
  },

  // ========================================
  // TRAINING EVENTS
  // ========================================
  'training_application_submitted': {
    icon: FileCheck,
    badgeVariant: 'created',
    severity: 'info',
    label: 'Training Application',
    description: 'New training application submitted',
    category: 'training',
    rowColor: 'bg-emerald-50/30 hover:bg-emerald-50/50',
    gradientColor: 'from-emerald-500 to-emerald-600',
  },
  'training_approve': {
    icon: CheckCircle2,
    badgeVariant: 'approved',
    severity: 'low',
    label: 'Training Approved',
    description: 'Training application was approved',
    category: 'training',
    rowColor: 'bg-green-50/30 hover:bg-green-50/50',
    gradientColor: 'from-green-500 to-green-600',
  },
  'training_reject': {
    icon: FileX,
    badgeVariant: 'denied',
    severity: 'low',
    label: 'Training Denied',
    description: 'Training application was denied',
    category: 'training',
    rowColor: 'bg-rose-50/30 hover:bg-rose-50/50',
    gradientColor: 'from-rose-500 to-rose-600',
  },

  // ========================================
  // SYSTEM EVENTS
  // ========================================
  'ANNOUNCEMENT_CREATED': {
    icon: Megaphone,
    badgeVariant: 'system',
    severity: 'info',
    label: 'Announcement Created',
    description: 'New announcement was posted',
    category: 'system',
    rowColor: 'bg-purple-50/30 hover:bg-purple-50/50',
    gradientColor: 'from-purple-500 to-purple-600',
  },
  'announcement_created': {
    icon: Megaphone,
    badgeVariant: 'system',
    severity: 'info',
    label: 'Announcement Created',
    description: 'New announcement was posted',
    category: 'system',
    rowColor: 'bg-purple-50/30 hover:bg-purple-50/50',
    gradientColor: 'from-purple-500 to-purple-600',
  },
  'FILE_UPLOAD_FAILED': {
    icon: AlertCircle,
    badgeVariant: 'failed',
    severity: 'medium',
    label: 'File Upload Failed',
    description: 'File upload operation failed',
    category: 'system',
    rowColor: 'bg-red-50/30 hover:bg-red-50/50',
    gradientColor: 'from-red-500 to-red-600',
  },
  'file_upload': {
    icon: Upload,
    badgeVariant: 'upload',
    severity: 'info',
    label: 'File Uploaded',
    description: 'File was successfully uploaded',
    category: 'system',
    rowColor: 'bg-teal-50/30 hover:bg-teal-50/50',
    gradientColor: 'from-teal-500 to-teal-600',
  },
  'file_download': {
    icon: Download,
    badgeVariant: 'system',
    severity: 'info',
    label: 'File Downloaded',
    description: 'File was downloaded',
    category: 'system',
    rowColor: 'bg-purple-50/30 hover:bg-purple-50/50',
    gradientColor: 'from-purple-500 to-purple-600',
  },
  'SYSTEM_CONFIGURATION_UPDATED': {
    icon: Settings,
    badgeVariant: 'system',
    severity: 'medium',
    label: 'System Configuration',
    description: 'System configuration was updated',
    category: 'system',
    rowColor: 'bg-purple-50/30 hover:bg-purple-50/50',
    gradientColor: 'from-purple-500 to-purple-600',
  },
  'database_backup': {
    icon: Database,
    badgeVariant: 'system',
    severity: 'low',
    label: 'Database Backup',
    description: 'Database backup was created',
    category: 'system',
    rowColor: 'bg-purple-50/30 hover:bg-purple-50/50',
    gradientColor: 'from-purple-500 to-purple-600',
  },
  'notification_sent': {
    icon: Bell,
    badgeVariant: 'notification',
    severity: 'info',
    label: 'Notification Sent',
    description: 'Notification was sent to user',
    category: 'system',
    rowColor: 'bg-pink-50/30 hover:bg-pink-50/50',
    gradientColor: 'from-pink-500 to-pink-600',
  },
};

/**
 * Get event configuration for a specific event type
 * Returns default config if event type not found
 */
export function getEventConfig(eventType: string): EventConfig {
  // Try exact match first
  if (ACTIVITY_EVENT_CONFIG[eventType]) {
    return ACTIVITY_EVENT_CONFIG[eventType];
  }

  // Try case-insensitive match
  const lowerEventType = eventType.toLowerCase();
  const found = Object.keys(ACTIVITY_EVENT_CONFIG).find(
    key => key.toLowerCase() === lowerEventType
  );

  if (found) {
    return ACTIVITY_EVENT_CONFIG[found];
  }

  // Return default configuration
  return {
    icon: Activity,
    badgeVariant: 'default',
    severity: 'info',
    label: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'System activity event',
    category: 'system',
    rowColor: 'bg-gray-50 hover:bg-gray-100',
    gradientColor: 'from-gray-500 to-gray-600',
  };
}

/**
 * Get all event types for a specific category
 */
export function getEventsByCategory(category: EventCategory): Array<[string, EventConfig]> {
  return Object.entries(ACTIVITY_EVENT_CONFIG).filter(
    ([_, config]) => config.category === category
  );
}

/**
 * Get all event types by severity
 */
export function getEventsBySeverity(severity: EventSeverity): Array<[string, EventConfig]> {
  return Object.entries(ACTIVITY_EVENT_CONFIG).filter(
    ([_, config]) => config.severity === severity
  );
}

/**
 * Format event type for display
 */
export function formatEventType(eventType: string): string {
  const config = getEventConfig(eventType);
  return config.label;
}

/**
 * Get severity color class for background/border
 */
export function getSeverityColor(severity: EventSeverity): string {
  const colors = {
    info: 'bg-blue-100 border-blue-300 text-blue-800',
    low: 'bg-green-100 border-green-300 text-green-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    critical: 'bg-red-100 border-red-300 text-red-800',
  };
  return colors[severity];
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: EventCategory): LucideIcon {
  const icons: Record<EventCategory, LucideIcon> = {
    auth: Shield,
    user_management: UserCog,
    application: FileText,
    job: Briefcase,
    training: FileCheck,
    system: Settings,
  };
  return icons[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    auth: 'from-cyan-500 to-cyan-600',
    user_management: 'from-emerald-500 to-emerald-600',
    application: 'from-blue-500 to-blue-600',
    job: 'from-indigo-500 to-indigo-600',
    training: 'from-teal-500 to-teal-600',
    system: 'from-purple-500 to-purple-600',
  };
  return colors[category];
}
