import { supabase } from './auth';

/**
 * Activity Logger
 *
 * Centralized utility for logging user activities to the activity_logs table.
 * All logs are automatically tracked with user context, timestamp, and metadata.
 */

export type EventCategory = 'auth' | 'user_management' | 'application' | 'job' | 'training' | 'system';
export type EventStatus = 'success' | 'failed';

export interface ActivityLogParams {
  eventType: string;
  eventCategory: EventCategory;
  details: string;
  metadata?: Record<string, any>;
  status?: EventStatus;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Log an activity to the database
 *
 * @example
 * // Log successful login
 * await logActivity({
 *   eventType: 'login',
 *   eventCategory: 'auth',
 *   details: 'User logged in successfully',
 *   status: 'success'
 * });
 *
 * // Log user creation
 * await logActivity({
 *   eventType: 'user_created',
 *   eventCategory: 'user_management',
 *   details: `Created new user account: ${email}`,
 *   metadata: { role: 'HR', email }
 * });
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    // Get current user session if not provided
    let userId = params.userId;
    let userEmail = params.userEmail;
    let userRole = params.userRole;

    if (!userId || !userEmail || !userRole) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile for complete data
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          userId = userId || profile.id;
          userEmail = userEmail || profile.email;
          userRole = userRole || profile.role;
        }
      }
    }

    // Insert activity log
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId || null,
        event_type: params.eventType,
        event_category: params.eventCategory,
        user_email: userEmail || null,
        user_role: userRole || null,
        details: params.details,
        status: params.status || 'success',
        metadata: params.metadata || null,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log activity:', error);
    } else {
      console.log(`✅ Activity logged: ${params.eventType}`);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not break the app
  }
}

/**
 * Enhanced activity loggers using database functions
 * These call PostgreSQL functions directly for better performance and consistency
 */

export const ActivityLogger = {
  // ============ AUTH EVENTS ============
  login: (email: string, userId: string, role: string) =>
    logActivity({
      eventType: 'login',
      eventCategory: 'auth',
      details: `User logged in: ${email}`,
      userId,
      userEmail: email,
      userRole: role,
      metadata: { action: 'login' }
    }),

  logout: (email: string, userId: string, role: string) =>
    logActivity({
      eventType: 'logout',
      eventCategory: 'auth',
      details: `User logged out: ${email}`,
      userId,
      userEmail: email,
      userRole: role,
      metadata: { action: 'logout' }
    }),

  loginFailed: (email: string, reason?: string) =>
    logActivity({
      eventType: 'login_failed',
      eventCategory: 'auth',
      details: `Failed login attempt: ${email}${reason ? ` - ${reason}` : ''}`,
      status: 'failed',
      userEmail: email,
      metadata: { reason }
    }),

  // ============ USER MANAGEMENT (Admin Functions) ============
  adminCreateUser: async (adminId: string, createdUserId: string, createdUserEmail: string, createdUserRole: string) => {
    const { error } = await supabase.rpc('log_admin_create_user', {
      p_admin_id: adminId,
      p_created_user_id: createdUserId,
      p_created_user_email: createdUserEmail,
      p_created_user_role: createdUserRole
    });
    if (error) console.error('Failed to log admin create user:', error);
  },

  adminDeactivateUser: async (adminId: string, targetUserId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_admin_deactivate_user', {
      p_admin_id: adminId,
      p_target_user_id: targetUserId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log admin deactivate user:', error);
  },

  adminActivateUser: async (adminId: string, targetUserId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_admin_activate_user', {
      p_admin_id: adminId,
      p_target_user_id: targetUserId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log admin activate user:', error);
  },

  adminChangeRole: async (adminId: string, targetUserId: string, oldRole: string, newRole: string, reason?: string) => {
    const { error } = await supabase.rpc('log_admin_change_role', {
      p_admin_id: adminId,
      p_target_user_id: targetUserId,
      p_old_role: oldRole,
      p_new_role: newRole,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log admin change role:', error);
  },

  adminDeleteUser: async (adminId: string, targetUserId: string, deletionType: string, reason?: string) => {
    const { error } = await supabase.rpc('log_admin_delete_user', {
      p_admin_id: adminId,
      p_target_user_id: targetUserId,
      p_deletion_type: deletionType,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log admin delete user:', error);
  },

  // ============ APPLICATION EVENTS ============
  applicationSubmitted: async (applicantId: string, jobId: string, applicationId: string, pdsFileName: string) => {
    const { error } = await supabase.rpc('log_application_submitted', {
      p_applicant_id: applicantId,
      p_job_id: jobId,
      p_application_id: applicationId,
      p_pds_file_name: pdsFileName
    });
    if (error) console.error('Failed to log application submitted:', error);
  },

  applicationApproved: async (hrId: string, applicationId: string, score: number, rank: number) => {
    const { error } = await supabase.rpc('log_application_approved', {
      p_hr_id: hrId,
      p_application_id: applicationId,
      p_score: score,
      p_rank: rank
    });
    if (error) console.error('Failed to log application approved:', error);
  },

  applicationDenied: async (hrId: string, applicationId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_application_denied', {
      p_hr_id: hrId,
      p_application_id: applicationId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log application denied:', error);
  },

  // ============ JOB MANAGEMENT ============
  jobCreated: async (hrId: string, jobId: string, jobTitle: string) => {
    const { error } = await supabase.rpc('log_job_created', {
      p_hr_id: hrId,
      p_job_id: jobId,
      p_job_title: jobTitle
    });
    if (error) console.error('Failed to log job created:', error);
  },

  jobUpdated: async (hrId: string, jobId: string, changesMade: string) => {
    const { error } = await supabase.rpc('log_job_updated', {
      p_hr_id: hrId,
      p_job_id: jobId,
      p_changes_made: changesMade
    });
    if (error) console.error('Failed to log job updated:', error);
  },

  jobDeleted: async (hrId: string, jobId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_job_deleted', {
      p_hr_id: hrId,
      p_job_id: jobId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log job deleted:', error);
  },

  jobStatusChanged: async (hrId: string, jobId: string, oldStatus: string, newStatus: string) => {
    const { error } = await supabase.rpc('log_job_status_changed', {
      p_hr_id: hrId,
      p_job_id: jobId,
      p_old_status: oldStatus,
      p_new_status: newStatus
    });
    if (error) console.error('Failed to log job status changed:', error);
  },

  // ============ TRAINING PROGRAMS ============
  trainingCreated: async (pesoId: string, programId: string, programTitle: string) => {
    const { error } = await supabase.rpc('log_training_created', {
      p_peso_id: pesoId,
      p_program_id: programId,
      p_program_title: programTitle
    });
    if (error) console.error('Failed to log training created:', error);
  },

  trainingUpdated: async (pesoId: string, programId: string, changesMade: string) => {
    const { error } = await supabase.rpc('log_training_updated', {
      p_peso_id: pesoId,
      p_program_id: programId,
      p_changes_made: changesMade
    });
    if (error) console.error('Failed to log training updated:', error);
  },

  trainingDeleted: async (pesoId: string, programId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_training_deleted', {
      p_peso_id: pesoId,
      p_program_id: programId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log training deleted:', error);
  },

  trainingApplicationSubmitted: async (applicantId: string, programId: string, trainingApplicationId: string) => {
    const { error } = await supabase.rpc('log_training_application_submitted', {
      p_applicant_id: applicantId,
      p_program_id: programId,
      p_training_application_id: trainingApplicationId
    });
    if (error) console.error('Failed to log training application submitted:', error);
  },

  trainingApplicationApproved: async (pesoId: string, trainingApplicationId: string) => {
    const { error } = await supabase.rpc('log_training_application_approved', {
      p_peso_id: pesoId,
      p_training_application_id: trainingApplicationId
    });
    if (error) console.error('Failed to log training application approved:', error);
  },

  trainingApplicationDenied: async (pesoId: string, trainingApplicationId: string, reason?: string) => {
    const { error } = await supabase.rpc('log_training_application_denied', {
      p_peso_id: pesoId,
      p_training_application_id: trainingApplicationId,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log training application denied:', error);
  },

  // ============ SYSTEM EVENTS ============
  ocrProcessing: async (applicantId: string, pdsFileName: string, success: boolean, confidenceScore?: number) => {
    const { error } = await supabase.rpc('log_ocr_processing', {
      p_applicant_id: applicantId,
      p_pds_file_name: pdsFileName,
      p_success: success,
      p_confidence_score: confidenceScore || null
    });
    if (error) console.error('Failed to log OCR processing:', error);
  },

  aiRanking: async (applicationId: string, algorithmUsed: string, matchScore: number, rank: number) => {
    const { error } = await supabase.rpc('log_ai_ranking', {
      p_application_id: applicationId,
      p_algorithm_used: algorithmUsed,
      p_match_score: matchScore,
      p_rank: rank
    });
    if (error) console.error('Failed to log AI ranking:', error);
  },

  emailNotificationSent: async (userId: string, notificationType: string, notificationTitle: string, success: boolean) => {
    const { error } = await supabase.rpc('log_email_notification_sent', {
      p_user_id: userId,
      p_notification_type: notificationType,
      p_notification_title: notificationTitle,
      p_success: success
    });
    if (error) console.error('Failed to log email notification sent:', error);
  },

  announcementCreated: async (hrId: string, announcementId: string, announcementTitle: string, category: string) => {
    const { error } = await supabase.rpc('log_announcement_created', {
      p_hr_id: hrId,
      p_announcement_id: announcementId,
      p_announcement_title: announcementTitle,
      p_category: category
    });
    if (error) console.error('Failed to log announcement created:', error);
  },

  fileUpload: async (userId: string, bucketName: string, filePath: string, fileSize: number, fileType: string) => {
    const { error } = await supabase.rpc('log_file_upload', {
      p_user_id: userId,
      p_bucket_name: bucketName,
      p_file_path: filePath,
      p_file_size: fileSize,
      p_file_type: fileType
    });
    if (error) console.error('Failed to log file upload:', error);
  },

  fileDeletion: async (userId: string, bucketName: string, filePath: string, reason?: string) => {
    const { error } = await supabase.rpc('log_file_deletion', {
      p_user_id: userId,
      p_bucket_name: bucketName,
      p_file_path: filePath,
      p_reason: reason || null
    });
    if (error) console.error('Failed to log file deletion:', error);
  },

  // Generic system event
  systemEvent: (description: string, metadata?: Record<string, any>) =>
    logActivity({
      eventType: 'system_event',
      eventCategory: 'system',
      details: description,
      metadata
    }),
};
