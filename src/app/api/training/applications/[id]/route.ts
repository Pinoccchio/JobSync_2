import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getViewableUrl } from '@/lib/supabase/storage';

/**
 * Training Application Management API - Individual Application Operations
 *
 * Endpoints:
 * - GET /api/training/applications/[id] - Get application details
 * - PATCH /api/training/applications/[id] - Update application status (approve/deny)
 */

// GET /api/training/applications/[id] - Get single training application
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

    // 3. Fetch application
    const { data: application, error } = await supabase
      .from('training_applications')
      .select(`
        *,
        training_programs:program_id (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 4. Check authorization (applicant can only view their own, PESO/Admin can view all)
    if (profile.role === 'APPLICANT' && application.applicant_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only view your own applications' },
        { status: 403 }
      );
    }

    // 5. Generate signed URL for ID image if it exists
    if (application.id_image_url) {
      try {
        const signedUrl = await getViewableUrl('id-images', application.id_image_url, 3600);
        application.id_image_url = signedUrl;
      } catch (error) {
        console.error(`Failed to generate signed URL for application ${id}:`, error);
        // Keep original path if signing fails
      }
    }

    return NextResponse.json({
      success: true,
      data: application,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/training/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/training/applications/[id] - Update application status
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

    // 3. Validate status
    const { status, next_steps, denial_reason } = body;

    // 4. Authorization checks based on role
    if (profile.role === 'APPLICANT') {
      // Applicants can only withdraw their own applications

      // Get the application to check ownership
      const { data: application, error: appError } = await supabase
        .from('training_applications')
        .select('applicant_id, status')
        .eq('id', id)
        .single();

      if (appError || !application) {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      // Check if applicant owns this application
      if (application.applicant_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - You can only withdraw your own applications' },
          { status: 403 }
        );
      }

      // Applicants can only withdraw
      if (status !== 'withdrawn') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Applicants can only withdraw applications' },
          { status: 403 }
        );
      }

      // Can only withdraw if training hasn't started yet
      // Allow: pending, under_review, approved, enrolled
      // Block: in_progress, completed, certified (training started/finished)
      if (!['pending', 'under_review', 'approved', 'enrolled'].includes(application.status)) {
        return NextResponse.json(
          { success: false, error: `Cannot withdraw application with status: ${application.status}. You can only withdraw before training starts.` },
          { status: 400 }
        );
      }
    } else if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      // Only PESO, ADMIN, and APPLICANT (for withdrawal) can update applications
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO and Admin can update training applications' },
        { status: 403 }
      );
    }

    const validStatuses = [
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
      'archived'
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Get existing application
    const { data: existingApplication, error: fetchError } = await supabase
      .from('training_applications')
      .select(`
        id,
        applicant_id,
        program_id,
        full_name,
        status,
        status_history,
        training_programs:program_id (
          title,
          capacity,
          enrolled_count
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 6. Check if program is full (if changing to enrolled status)
    // These statuses count towards enrollment: approved, enrolled, in_progress
    if (['approved', 'enrolled', 'in_progress'].includes(status)) {
      const currentlyEnrolled = ['approved', 'enrolled', 'in_progress'].includes(existingApplication.status);

      // Only check capacity if transitioning FROM a non-enrolled status TO an enrolled status
      if (!currentlyEnrolled && existingApplication.training_programs) {
        const program = existingApplication.training_programs as any;
        if (program.enrolled_count >= program.capacity) {
          const actionVerb = status === 'approved' ? 'approve' : status === 'enrolled' ? 'enroll' : 'start training for';
          return NextResponse.json(
            {
              success: false,
              error: `Cannot ${actionVerb} - "${program.title}" is at full capacity (${program.enrolled_count}/${program.capacity})`
            },
            { status: 400 }
          );
        }
      }
    }

    // 7. Build status history entry
    const currentHistory = existingApplication.status_history || [];
    const newHistoryEntry = {
      from: existingApplication.status,
      to: status,
      changed_at: new Date().toISOString(),
      changed_by: user.id,
    };
    const updatedHistory = [...currentHistory, newHistoryEntry];

    // 8. Build update object
    const updateData: any = {
      status,
      status_history: updatedHistory,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields
    if (next_steps) updateData.next_steps = next_steps;
    if (denial_reason) updateData.denial_reason = denial_reason;

    // Add timestamp fields based on status
    if (status === 'enrolled') updateData.enrollment_confirmed_at = new Date().toISOString();
    if (status === 'in_progress') updateData.training_started_at = new Date().toISOString();
    if (status === 'completed') updateData.training_completed_at = new Date().toISOString();
    if (status === 'certified') updateData.certificate_issued_at = new Date().toISOString();

    // 9. Update application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('training_applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        training_programs:program_id (*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating training application:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // NOTE: enrolled_count is automatically managed by the database trigger
    // 'update_training_enrolled_count_trigger' which increments/decrements the count
    // when application status changes to/from 'approved', 'enrolled', or 'in_progress'.
    // DO NOT manually update enrolled_count here to avoid double counting.

    // 8. Create notifications with user-friendly messages
    const program = updatedApplication.training_programs as any;

    // Generate status-specific notification title and message
    let notificationTitle = 'Training Application Status Updated';
    let notificationMessage = '';

    switch (status) {
      case 'pending':
        notificationTitle = 'Training Application Pending Review';
        notificationMessage = `Your application for "${program?.title}" is pending review by ${profile.full_name} (${profile.role}).`;
        break;
      case 'under_review':
        notificationTitle = 'Training Application Under Review';
        notificationMessage = `Your application for "${program?.title}" is currently under review by ${profile.full_name} (${profile.role}). We will notify you once a decision has been made.`;
        break;
      case 'approved':
        notificationTitle = 'Training Application Approved!';
        notificationMessage = `Congratulations! Your application for "${program?.title}" has been approved by ${profile.full_name} (${profile.role}). ${body.next_steps || 'We will contact you soon with the next steps.'}`;
        break;
      case 'denied':
        notificationTitle = 'Training Application Update';
        const denialReason = body.denial_reason || 'Please check your application details for more information';
        notificationMessage = `Your application for "${program?.title}" was reviewed by ${profile.full_name} (${profile.role}). ${denialReason} We encourage you to apply again in the future.`;
        break;
      case 'enrolled':
        notificationTitle = 'Enrollment Confirmed!';
        notificationMessage = `Your enrollment for "${program?.title}" has been confirmed by ${profile.full_name} (${profile.role}). Welcome to the program!`;
        break;
      case 'in_progress':
        notificationTitle = 'Training Program Started';
        notificationMessage = `Your training for "${program?.title}" has officially started. Good luck with your learning journey!`;
        break;
      case 'completed':
        notificationTitle = 'Training Program Completed!';
        notificationMessage = `Congratulations! You have successfully completed the "${program?.title}" training program. Reviewed by ${profile.full_name} (${profile.role}).`;
        break;
      case 'certified':
        notificationTitle = 'Certificate Issued!';
        notificationMessage = `Your certificate for "${program?.title}" has been issued by ${profile.full_name} (${profile.role}). You can now download it from your trainings page.`;
        break;
      case 'withdrawn':
        notificationTitle = 'Training Application Withdrawn';
        notificationMessage = `Your application for "${program?.title}" has been withdrawn. You may reapply in the future.`;
        break;
      case 'failed':
        notificationTitle = 'Training Program Status Update';
        notificationMessage = `Your status for "${program?.title}" has been updated. Please contact ${profile.full_name} (${profile.role}) for more information.`;
        break;
      case 'archived':
        notificationTitle = 'Training Application Archived';
        notificationMessage = `Your application for "${program?.title}" has been archived by ${profile.full_name} (${profile.role}).`;
        break;
      default:
        notificationTitle = 'Training Application Status Updated';
        notificationMessage = `Your application status for "${program?.title}" has been updated by ${profile.full_name} (${profile.role}). Please check your application details for more information.`;
    }

    // Generate user-friendly action verb for PESO notification
    let actionVerb = '';
    switch (status) {
      case 'pending':
        actionVerb = 'marked as pending review';
        break;
      case 'under_review':
        actionVerb = 'marked as under review';
        break;
      case 'approved':
        actionVerb = 'approved';
        break;
      case 'denied':
        actionVerb = 'denied';
        break;
      case 'enrolled':
        actionVerb = 'confirmed enrollment for';
        break;
      case 'in_progress':
        actionVerb = 'started training for';
        break;
      case 'completed':
        actionVerb = 'marked as completed for';
        break;
      case 'certified':
        actionVerb = 'issued certificate for';
        break;
      case 'withdrawn':
        actionVerb = 'processed withdrawal for';
        break;
      case 'failed':
        actionVerb = 'marked as failed for';
        break;
      case 'archived':
        actionVerb = 'archived';
        break;
      default:
        actionVerb = `updated (${status})`;
    }

    // Notify PESO user (confirmation of their own action)
    const { error: pesoNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'training_status',
        title: 'Application Review Submitted',
        message: `You ${actionVerb} ${existingApplication.full_name}'s application for ${program?.title}`,
        related_entity_type: 'training_application',
        related_entity_id: id,
        link_url: `/peso/applications`,
        is_read: false,
      });

    if (pesoNotificationError) {
      console.error('Error creating PESO notification:', pesoNotificationError);
    }

    // Notify applicant - Direct insert (matches HR pattern)
    const { error: applicantNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: existingApplication.applicant_id,
        type: 'training_status',
        title: notificationTitle,
        message: notificationMessage,
        related_entity_type: 'training_application',
        related_entity_id: id,
        link_url: `/applicant/trainings`,
        is_read: false,
      });

    if (applicantNotificationError) {
      console.error('Error creating applicant notification:', applicantNotificationError);
      // Don't fail the request if notifications fail
    }

    // 11. Mark notification as sent
    await supabase
      .from('training_applications')
      .update({ notification_sent: true })
      .eq('id', id);

    // 12. Log activity
    try {
      await supabase.rpc('log_training_application_status_changed', {
        p_user_id: user.id,
        p_application_id: id,
        p_old_status: existingApplication.status,
        p_new_status: status,
        p_metadata: {
          program_title: program?.title,
          applicant_name: existingApplication.full_name,
          reviewer_name: profile.full_name,
        }
      });
    } catch (logError) {
      console.error('Error logging status change:', logError);
      // Don't fail the request if logging fails
    }

    // Generate user-friendly success message for API response
    let successMessage = '';
    switch (status) {
      case 'pending':
        successMessage = 'Application marked as pending successfully';
        break;
      case 'under_review':
        successMessage = 'Application marked as under review successfully';
        break;
      case 'approved':
        successMessage = 'Training application approved successfully';
        break;
      case 'denied':
        successMessage = 'Training application denied';
        break;
      case 'enrolled':
        successMessage = 'Enrollment confirmed successfully';
        break;
      case 'in_progress':
        successMessage = 'Training started successfully';
        break;
      case 'completed':
        successMessage = 'Training marked as completed successfully';
        break;
      case 'certified':
        successMessage = 'Certificate issued successfully';
        break;
      case 'withdrawn':
        successMessage = 'Application withdrawn successfully';
        break;
      case 'failed':
        successMessage = 'Application marked as failed';
        break;
      case 'archived':
        successMessage = 'Application archived successfully';
        break;
      default:
        successMessage = 'Training application status updated successfully';
    }

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: successMessage,
    });

  } catch (error: any) {
    console.error('Server error in PATCH /api/training/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
