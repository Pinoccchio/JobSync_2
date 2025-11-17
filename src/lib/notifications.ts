import { createClient } from '@/lib/supabase/server';

/**
 * Notification Helper Functions
 * Centralized functions for creating notifications across the application
 */

export type NotificationType = 'application_status' | 'training_status' | 'announcement' | 'system';
export type RelatedEntityType = 'application' | 'training_application' | 'announcement' | 'job';

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  related_entity_type?: RelatedEntityType;
  related_entity_id?: string;
  link_url?: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(userId: string, notification: NotificationData) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        related_entity_type: notification.related_entity_type || null,
        related_entity_id: notification.related_entity_id || null,
        link_url: notification.link_url || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Notify all admins about an action
 */
export async function notifyAdmins(notification: NotificationData) {
  try {
    const supabase = await createClient();

    // Get all admin users
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
      .eq('status', 'active');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      return [];
    }

    if (!admins || admins.length === 0) {
      console.warn('No active admins found to notify');
      return [];
    }

    // Create notification for each admin
    const notifications = await Promise.all(
      admins.map((admin) => createNotification(admin.id, notification))
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Failed to notify admins:', error);
    return [];
  }
}

/**
 * Notify HR user (confirmation of their own action)
 */
export async function notifyHR(hrUserId: string, notification: NotificationData) {
  return await createNotification(hrUserId, notification);
}

/**
 * Notify PESO user (confirmation of their own action)
 */
export async function notifyPESO(pesoUserId: string, notification: NotificationData) {
  return await createNotification(pesoUserId, notification);
}

/**
 * Notify the creator of a job when someone applies
 */
export async function notifyJobCreator(jobId: string, applicantName: string) {
  try {
    const supabase = await createClient();

    // Get job details and creator
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Error fetching job:', jobError);
      return null;
    }

    // Create notification for job creator
    return await createNotification(job.created_by, {
      type: 'system',
      title: 'New Application Received',
      message: `${applicantName} applied for "${job.title}"`,
      related_entity_type: 'job',
      related_entity_id: job.id,
      link_url: `/hr/ranked-records?job=${job.id}`,
    });
  } catch (error) {
    console.error('Failed to notify job creator:', error);
    return null;
  }
}

/**
 * Notify all applicants of a specific job
 */
export async function notifyJobApplicants(jobId: string, notification: NotificationData) {
  try {
    const supabase = await createClient();

    // Get all applicants for this job
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('applicant_id')
      .eq('job_id', jobId);

    if (appError) {
      console.error('Error fetching applicants:', appError);
      return [];
    }

    if (!applications || applications.length === 0) {
      return [];
    }

    // Get unique applicant IDs
    const applicantIds = [...new Set(applications.map((app) => app.applicant_id))];

    // Create notification for each applicant
    const notifications = await Promise.all(
      applicantIds.map((applicantId) => createNotification(applicantId, notification))
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Failed to notify job applicants:', error);
    return [];
  }
}

/**
 * Bulk create notifications for multiple users
 */
export async function notifyUsers(userIds: string[], notification: NotificationData) {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) => createNotification(userId, notification))
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Failed to notify users:', error);
    return [];
  }
}

/**
 * Notify all applicants enrolled in a training program
 */
export async function notifyProgramApplicants(programId: string, notification: NotificationData) {
  try {
    const supabase = await createClient();

    // Get all applicants for this program
    const { data: applications, error: appError } = await supabase
      .from('training_applications')
      .select('applicant_id')
      .eq('program_id', programId);

    if (appError) {
      console.error('Error fetching program applicants:', appError);
      return [];
    }

    if (!applications || applications.length === 0) {
      return [];
    }

    // Get unique applicant IDs
    const applicantIds = [...new Set(applications.map((app) => app.applicant_id))];

    // Create notification for each applicant
    const notifications = await Promise.all(
      applicantIds.map((applicantId) => createNotification(applicantId, notification))
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Failed to notify program applicants:', error);
    return [];
  }
}

/**
 * Notify all applicants in the system
 * Used for system-wide announcements and general notifications
 */
export async function notifyAllApplicants(notification: NotificationData) {
  try {
    const supabase = await createClient();

    // Get all active applicants
    const { data: applicants, error: applicantError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'APPLICANT')
      .eq('status', 'active');

    if (applicantError) {
      console.error('Error fetching applicants:', applicantError);
      return [];
    }

    if (!applicants || applicants.length === 0) {
      console.warn('No active applicants found to notify');
      return [];
    }

    // Create notification for each applicant
    const notifications = await Promise.all(
      applicants.map((applicant) => createNotification(applicant.id, notification))
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error('Failed to notify all applicants:', error);
    return [];
  }
}
