import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Training Completion Management API
 *
 * Endpoint:
 * - POST /api/training/applications/completion - Award completion status and hours to trainees
 *
 * Features:
 * - Bulk completion awards
 * - Individual customization per applicant
 * - Set completion status (passed/failed/pending)
 * - Award training hours
 * - Set assessment scores
 * - Auto-transition to completed/failed status
 * - Send notifications based on pass/fail
 * - Log activity
 */

// POST /api/training/applications/completion - Award completion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    // 3. Only PESO and ADMIN can award completion
    if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO officers can award completion' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { completions } = body;

    if (!Array.isArray(completions) || completions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: completions array' },
        { status: 400 }
      );
    }

    // Validate each completion entry
    for (const completion of completions) {
      if (!completion.application_id || !completion.completion_status) {
        return NextResponse.json(
          { success: false, error: 'Each completion must have application_id and completion_status' },
          { status: 400 }
        );
      }

      if (!['passed', 'failed', 'pending'].includes(completion.completion_status)) {
        return NextResponse.json(
          { success: false, error: 'completion_status must be passed, failed, or pending' },
          { status: 400 }
        );
      }

      if (completion.training_hours_awarded !== undefined) {
        if (typeof completion.training_hours_awarded !== 'number' ||
            completion.training_hours_awarded < 0 ||
            completion.training_hours_awarded > 720) {
          return NextResponse.json(
            { success: false, error: 'training_hours_awarded must be between 0 and 720' },
            { status: 400 }
          );
        }
      }

      if (completion.assessment_score !== undefined) {
        if (typeof completion.assessment_score !== 'number' ||
            completion.assessment_score < 0 ||
            completion.assessment_score > 100) {
          return NextResponse.json(
            { success: false, error: 'assessment_score must be between 0 and 100' },
            { status: 400 }
          );
        }
      }
    }

    // 5. Process each completion
    const currentTimestamp = new Date().toISOString();
    let completedCount = 0;
    let passedCount = 0;
    let failedCount = 0;
    const notifications = [];
    const errors = [];

    for (const completion of completions) {
      try {
        // Fetch the application
        const { data: app, error: fetchError } = await supabase
          .from('training_applications')
          .select(`
            id,
            applicant_id,
            program_id,
            full_name,
            status,
            status_history,
            training_programs!inner (
              id,
              title
            )
          `)
          .eq('id', completion.application_id)
          .single();

        if (fetchError || !app) {
          errors.push({ application_id: completion.application_id, error: 'Application not found' });
          continue;
        }

        // Verify application is in_progress
        if (app.status !== 'in_progress') {
          errors.push({
            application_id: completion.application_id,
            error: `Application must be in_progress status (current: ${app.status})`
          });
          continue;
        }

        // Determine new status based on completion_status
        let newStatus: string;
        if (completion.completion_status === 'passed') {
          newStatus = 'completed';
          passedCount++;
        } else if (completion.completion_status === 'failed') {
          newStatus = 'failed';
          failedCount++;
        } else {
          newStatus = 'in_progress'; // Keep in_progress if pending
        }

        // Update status history
        const updatedStatusHistory = [
          ...(app.status_history || []),
          {
            from: app.status,
            to: newStatus,
            changed_at: currentTimestamp,
            changed_by: user.id,
            notes: `Completion awarded: ${completion.completion_status}${
              completion.training_hours_awarded ? ` (${completion.training_hours_awarded} hours)` : ''
            }`
          }
        ];

        // Update the application
        const updateData: any = {
          status: newStatus,
          completion_status: completion.completion_status,
          training_completed_at: currentTimestamp,
          status_history: updatedStatusHistory,
        };

        if (completion.training_hours_awarded !== undefined) {
          updateData.training_hours_awarded = completion.training_hours_awarded;
        }

        if (completion.assessment_score !== undefined) {
          updateData.assessment_score = completion.assessment_score;
        }

        if (completion.completion_notes) {
          updateData.completion_notes = completion.completion_notes;
        }

        // Calculate attendance percentage if not set (100% if they made it to completion)
        if (!(app as any).attendance_percentage) {
          updateData.attendance_percentage = 100;
        }

        const { error: updateError } = await supabase
          .from('training_applications')
          .update(updateData)
          .eq('id', app.id);

        if (updateError) {
          errors.push({ application_id: completion.application_id, error: updateError.message });
          continue;
        }

        completedCount++;

        // Prepare notification based on pass/fail
        const programTitle = (app.training_programs as any)?.title || 'Training Program';

        if (completion.completion_status === 'passed') {
          notifications.push({
            user_id: app.applicant_id,
            type: 'training_status',
            title: 'Congratulations! Training Completed',
            message: `You have successfully completed "${programTitle}"${
              completion.training_hours_awarded
                ? ` and earned ${completion.training_hours_awarded} training hours`
                : ''
            }. Your certificate will be available soon.`,
            related_entity_type: 'training_application',
            related_entity_id: app.id,
            link_url: '/applicant/trainings',
            is_read: false,
          });
        } else if (completion.completion_status === 'failed') {
          notifications.push({
            user_id: app.applicant_id,
            type: 'training_status',
            title: 'Training Completed',
            message: `Your training "${programTitle}" has been completed. Please review your results and contact us for feedback.`,
            related_entity_type: 'training_application',
            related_entity_id: app.id,
            link_url: '/applicant/trainings',
            is_read: false,
          });
        } else {
          // Pending
          notifications.push({
            user_id: app.applicant_id,
            type: 'training_status',
            title: 'Training Completion Under Review',
            message: `Your completion status for "${programTitle}" is being reviewed. You will be notified once finalized.`,
            related_entity_type: 'training_application',
            related_entity_id: app.id,
            link_url: '/applicant/trainings',
            is_read: false,
          });
        }

      } catch (error: any) {
        errors.push({ application_id: completion.application_id, error: error.message });
      }
    }

    // 6. Send notifications in bulk
    if (notifications.length > 0) {
      try {
        await supabase
          .from('notifications')
          .insert(notifications);
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
        // Don't fail the request if notifications fail
      }
    }

    // 7. Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          user_role: profile.role,
          user_email: user.email || '',
          action: 'award_completion',
          entity_type: 'training_application',
          entity_id: completions[0]?.application_id || null,
          description: `Awarded completion to ${completedCount} trainee(s) (${passedCount} passed, ${failedCount} failed)`,
          metadata: {
            completed_count: completedCount,
            passed_count: passedCount,
            failed_count: failedCount,
            total_processed: completions.length,
            errors: errors.length > 0 ? errors : undefined,
          },
        });
    } catch (logError) {
      console.error('Error logging completion awards:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Completion awarded to ${completedCount} trainee(s)`,
      completed_count: completedCount,
      passed_count: passedCount,
      failed_count: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Server error in POST /api/training/applications/completion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
