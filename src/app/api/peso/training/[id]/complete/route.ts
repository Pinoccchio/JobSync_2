import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PESO Training Completion API
 *
 * POST /api/peso/training/[id]/complete - Award completion to training applicants
 */

interface CompletionData {
  applicantId: string;
  completionStatus: 'passed' | 'failed' | 'pending';
  hoursAwarded: number;
  notes: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: programId } = await params;
    const body = await request.json();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile - only PESO or ADMIN can award completion
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

    if (!['PESO', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO officers can award completion' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const { completion_data } = body;

    if (!Array.isArray(completion_data) || completion_data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request - completion_data must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each completion entry
    for (const entry of completion_data) {
      if (!entry.applicantId || !entry.completionStatus) {
        return NextResponse.json(
          { success: false, error: 'Invalid completion data - missing applicantId or completionStatus' },
          { status: 400 }
        );
      }

      if (!['passed', 'failed', 'pending'].includes(entry.completionStatus)) {
        return NextResponse.json(
          { success: false, error: 'Invalid completion_status - must be passed, failed, or pending' },
          { status: 400 }
        );
      }

      if (entry.hoursAwarded < 0 || entry.hoursAwarded > 720) {
        return NextResponse.json(
          { success: false, error: 'Invalid hours_awarded - must be between 0 and 720' },
          { status: 400 }
        );
      }
    }

    // 4. Get training program
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id, title, status')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    let updateCount = 0;
    const notificationPromises: Promise<any>[] = [];

    // 5. Update each applicant's completion status
    for (const entry of completion_data) {
      const { applicantId, completionStatus, hoursAwarded, notes } = entry;

      // Fetch existing application to get current status and history
      const { data: existingApp, error: fetchError } = await supabase
        .from('training_applications')
        .select('status, status_history')
        .eq('id', applicantId)
        .eq('program_id', programId)
        .single();

      if (fetchError || !existingApp) {
        console.error(`Error fetching applicant ${applicantId}:`, fetchError);
        continue;
      }

      // Determine new status
      const newStatus = completionStatus === 'passed' ? 'completed' :
                        completionStatus === 'failed' ? 'failed' : 'in_progress';

      // Build status history entry
      const currentHistory = existingApp.status_history || [];
      const newHistoryEntry = {
        from: existingApp.status,
        to: newStatus,
        changed_at: now,
        changed_by: user.id,
      };
      const updatedHistory = [...currentHistory, newHistoryEntry];

      // Update the training application with status history
      const { error: updateError, data: updatedApp } = await supabase
        .from('training_applications')
        .update({
          completion_status: completionStatus,
          training_hours_awarded: hoursAwarded,
          completion_notes: notes || null,
          status: newStatus,
          status_history: updatedHistory,
          training_completed_at: completionStatus !== 'pending' ? now : null,
          updated_at: now,
        })
        .eq('id', applicantId)
        .eq('program_id', programId)
        .select('applicant_id, full_name')
        .single();

      if (updateError) {
        console.error(`Error updating applicant ${applicantId}:`, updateError);
        continue;
      }

      if (updatedApp) {
        updateCount++;

        // Create notification for this applicant
        const notificationMessage =
          completionStatus === 'passed'
            ? `Congratulations! You have successfully completed the training "${program.title}" and earned ${hoursAwarded} hours.`
            : completionStatus === 'failed'
            ? `Your training completion for "${program.title}" has been marked as failed. ${notes ? `Reason: ${notes}` : ''}`
            : `Your training completion for "${program.title}" is pending review.`;

        notificationPromises.push(
          Promise.resolve(supabase.from('notifications').insert({
            user_id: updatedApp.applicant_id,
            type: 'training_status',
            title: completionStatus === 'passed'
              ? 'Training Completed'
              : completionStatus === 'failed'
              ? 'Training Failed'
              : 'Training Completion Pending',
            message: notificationMessage,
            link_url: '/applicant/trainings',
            related_entity_type: 'training_application',
            related_entity_id: applicantId,
          }).then())
        );
      }
    }

    // 6. Send all notifications
    await Promise.all(notificationPromises);

    // 7. Check if all applicants are completed/failed to update program status
    const { data: allApplications } = await supabase
      .from('training_applications')
      .select('id, status, completion_status')
      .eq('program_id', programId)
      .in('status', ['enrolled', 'in_progress', 'completed', 'failed']);

    if (allApplications && allApplications.length > 0) {
      const allCompleted = allApplications.every(app =>
        app.completion_status !== null &&
        app.completion_status !== 'pending' &&
        ['completed', 'failed'].includes(app.status)
      );

      if (allCompleted && program.status !== 'completed') {
        await supabase
          .from('training_programs')
          .update({ status: 'completed', updated_at: now })
          .eq('id', programId);
      }
    }

    // 8. Log activity
    const passedCount = completion_data.filter(d => d.completionStatus === 'passed').length;
    const failedCount = completion_data.filter(d => d.completionStatus === 'failed').length;
    const pendingCount = completion_data.filter(d => d.completionStatus === 'pending').length;

    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_event_category: 'training',
      p_event_type: 'completion_awarded',
      p_details: `Awarded completion for ${updateCount} applicants in training: ${program.title} (${passedCount} passed, ${failedCount} failed, ${pendingCount} pending)`,
      p_status: 'success',
      p_metadata: {
        program_id: programId,
        updated_count: updateCount,
        passed_count: passedCount,
        failed_count: failedCount,
        pending_count: pendingCount,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully awarded completion for ${updateCount} applicant(s)`,
      data: {
        updated_count: updateCount,
        passed_count: passedCount,
        failed_count: failedCount,
        pending_count: pendingCount,
      },
    });

  } catch (error: any) {
    console.error('Server error in POST /api/peso/training/[id]/complete:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
