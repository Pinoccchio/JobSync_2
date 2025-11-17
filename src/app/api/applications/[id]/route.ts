import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appendStatusHistory } from '@/lib/utils/statusHistory';
import { notifyAdmins } from '@/lib/notifications';

/**
 * Application Management API - Individual Application Operations
 *
 * Endpoints:
 * - GET /api/applications/[id] - Get application details
 * - PATCH /api/applications/[id] - Update application status (approve/deny)
 * - DELETE /api/applications/[id] - Delete application (admin only)
 */

// GET /api/applications/[id] - Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Fetch application (including status_history)
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (*),
        applicant_profiles:applicant_profile_id (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 4. Check authorization (applicant can only view their own, HR/Admin can view all)
    if (profile.role === 'APPLICANT' && application.applicant_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own applications' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Authorization check
    // HR/ADMIN can update any status
    // APPLICANT can only withdraw their own pending/under_review applications
    const { status } = body;

    if (profile.role === 'APPLICANT') {
      // Applicants can only withdraw their own applications
      if (status !== 'withdrawn') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Applicants can only withdraw applications' },
          { status: 403 }
        );
      }
    } else if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can update applications' },
        { status: 403 }
      );
    }

    // 4. Validate status
    const validStatuses = [
      'pending',
      'under_review',
      'shortlisted',
      'interviewed',
      'approved',
      'denied',
      'hired',
      'archived',
      'withdrawn'
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 5. Validate required fields for specific statuses
    if (status === 'denied' && !body.denial_reason) {
      return NextResponse.json(
        { success: false, error: 'Denial reason is required when denying an application' },
        { status: 400 }
      );
    }

    // 6. Get existing application (including status_history)
    const { data: existingApplication, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        applicant_id,
        job_id,
        status,
        status_history,
        jobs:job_id (
          title
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 7. Additional authorization check for applicants
    if (profile.role === 'APPLICANT' && existingApplication.applicant_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only withdraw your own applications' },
        { status: 403 }
      );
    }

    // 8. Validate withdrawal conditions
    if (status === 'withdrawn') {
      if (!['pending', 'under_review'].includes(existingApplication.status)) {
        return NextResponse.json(
          { success: false, error: 'Can only withdraw pending or under review applications' },
          { status: 400 }
        );
      }
    }

    // 9. Build update object with new fields
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Track status history - append new entry
    const currentHistory = existingApplication.status_history || [];
    const updatedHistory = appendStatusHistory(
      currentHistory,
      existingApplication.status,  // from status
      status,                       // to status
      user.id                       // changed_by
    );
    updateData.status_history = updatedHistory;

    // Add reviewed_by and reviewed_at for HR/Admin actions
    if (profile.role === 'HR' || profile.role === 'ADMIN') {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    // Add withdrawn tracking for applicant withdrawals
    if (status === 'withdrawn') {
      updateData.withdrawn_at = new Date().toISOString();
      updateData.withdrawn_by = user.id;

      // Clear ranking data when application is withdrawn
      // Withdrawn applications should not display ranks or scores
      updateData.rank = null;
      updateData.match_score = null;
      updateData.education_score = null;
      updateData.experience_score = null;
      updateData.skills_score = null;
      updateData.eligibility_score = null;
      updateData.algorithm_used = null;
      updateData.ranking_reasoning = null;
      updateData.algorithm_details = null;
    }

    // Add optional fields from request body
    if (body.denial_reason) updateData.denial_reason = body.denial_reason;
    if (body.hr_notes) updateData.hr_notes = body.hr_notes;
    if (body.interview_date) updateData.interview_date = body.interview_date;
    if (body.next_steps) updateData.next_steps = body.next_steps;

    // 10. Update application
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        jobs:job_id (*),
        applicant_profiles:applicant_profile_id (*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 11. Create descriptive notification for applicant
    const jobTitle = (existingApplication.jobs as any)?.title || 'the position';
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'under_review':
        notificationTitle = 'Application Under Review';
        notificationMessage = `Your application for ${jobTitle} is now being reviewed by ${profile.full_name} (${profile.role}).`;
        break;

      case 'shortlisted':
        notificationTitle = 'You\'ve Been Shortlisted! 🎉';
        notificationMessage = `Great news! You've been shortlisted for ${jobTitle} by ${profile.full_name} (${profile.role}). We'll contact you soon regarding the next steps.`;
        break;

      case 'interviewed':
        notificationTitle = 'Interview Scheduled';
        if (body.interview_date) {
          const interviewDate = new Date(body.interview_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          notificationMessage = `Your interview for ${jobTitle} has been scheduled for ${interviewDate} by ${profile.full_name} (${profile.role}). ${body.next_steps || 'Please check your email for more details.'}`;
        } else {
          notificationMessage = `Your interview for ${jobTitle} has been scheduled by ${profile.full_name} (${profile.role}). Please check your application for details.`;
        }
        break;

      case 'approved':
        notificationTitle = 'Application Approved! ✅';
        notificationMessage = `Congratulations! Your application for ${jobTitle} has been approved by ${profile.full_name} (${profile.role}). ${body.next_steps || 'We will contact you soon with the next steps.'}`;
        break;

      case 'denied':
        notificationTitle = 'Application Update';
        const denialReason = body.denial_reason || 'Please check your application for more information';
        notificationMessage = `Your application for ${jobTitle} was reviewed by ${profile.full_name} (${profile.role}). ${denialReason} We encourage you to apply for other positions.`;
        break;

      case 'hired':
        notificationTitle = 'Welcome to the Team! 🎉';
        notificationMessage = `Congratulations! You've been hired for ${jobTitle} by ${profile.full_name} (${profile.role}). Welcome to the Municipality of Asuncion team! ${body.next_steps || 'HR will contact you with onboarding details.'}`;
        break;

      case 'pending':
        notificationTitle = 'Application Status Updated';
        notificationMessage = `Your application for ${jobTitle} status has been updated to pending review by ${profile.full_name} (${profile.role}).`;
        break;

      case 'archived':
        notificationTitle = 'Application Archived';
        notificationMessage = `Your application for ${jobTitle} has been archived by ${profile.full_name} (${profile.role}).`;
        break;

      case 'withdrawn':
        // No notification needed for withdrawn (user initiated)
        break;

      default:
        notificationTitle = 'Application Status Updated';
        notificationMessage = `Your application status for ${jobTitle} has been updated.`;
    }

    // Only send notification if not withdrawn (user already knows they withdrew)
    if (status !== 'withdrawn' && notificationTitle) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: existingApplication.applicant_id,
          type: 'application_status',
          title: notificationTitle,
          message: notificationMessage,
          related_entity_type: 'application',
          related_entity_id: id,
          link_url: `/applicant/applications`,
          is_read: false,
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // 11.5. Notify ADMIN of critical status changes for system monitoring
    const criticalStatuses = ['hired', 'denied', 'withdrawn'];
    if (criticalStatuses.includes(status)) {
      try {
        const statusLabels: Record<string, string> = {
          hired: 'Hired',
          denied: 'Denied',
          withdrawn: 'Withdrawn',
        };

        await notifyAdmins({
          type: 'system',
          title: `Application ${statusLabels[status]}`,
          message: `Application for "${jobTitle}" has been ${status} (Applicant: ${(existingApplication as any).full_name || 'Unknown'})`,
          related_entity_type: 'application',
          related_entity_id: id,
          link_url: '/hr/scanned-records',
        });
      } catch (adminNotifError) {
        console.error('Error sending ADMIN notification:', adminNotifError);
        // Don't fail the request if notification fails
      }
    }

    // 12. Mark notification as sent
    await supabase
      .from('applications')
      .update({ notification_sent: true })
      .eq('id', id);

    // 13. Return success response with status-specific message
    const successMessage = status === 'withdrawn'
      ? 'Application withdrawn successfully'
      : status === 'denied'
      ? 'Application denied successfully'
      : status === 'approved'
      ? 'Application approved successfully'
      : status === 'hired'
      ? 'Applicant marked as hired'
      : status === 'shortlisted'
      ? 'Applicant shortlisted successfully'
      : status === 'interviewed'
      ? 'Interview scheduled successfully'
      : `Application status updated to ${status}`;

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: successMessage,
    });

  } catch (error: any) {
    console.error('Server error in PATCH /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete application (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Only ADMIN can delete applications
    if (profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only admins can delete applications' },
        { status: 403 }
      );
    }

    // 4. Delete application from database
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting application:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
