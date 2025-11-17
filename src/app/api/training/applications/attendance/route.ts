import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Training Attendance Management API
 *
 * Endpoint:
 * - POST /api/training/applications/attendance - Mark attendance for enrolled trainees
 *
 * Features:
 * - Bulk attendance marking
 * - Auto-transition to in_progress status
 * - Set attendance timestamps
 * - Calculate attendance percentage
 * - Send notifications to attendees
 * - Log activity
 */

// POST /api/training/applications/attendance - Mark attendance
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

    // 3. Only PESO and ADMIN can mark attendance
    if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO officers can mark attendance' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { program_id, attended_ids } = body;

    if (!program_id || !Array.isArray(attended_ids)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: program_id and attended_ids array' },
        { status: 400 }
      );
    }

    // 5. Verify program exists
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id, title')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    // 6. Get all enrolled applications for this program
    const { data: enrolledApps, error: fetchError } = await supabase
      .from('training_applications')
      .select('id, applicant_id, full_name, status, status_history')
      .eq('program_id', program_id)
      .in('status', ['enrolled', 'in_progress']);

    if (fetchError) {
      console.error('Error fetching enrolled applications:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!enrolledApps || enrolledApps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No enrolled applicants found for this program' },
        { status: 400 }
      );
    }

    // 7. Mark attendance for selected applications
    const currentTimestamp = new Date().toISOString();
    let markedCount = 0;
    const notifications = [];

    for (const app of enrolledApps) {
      if (attended_ids.includes(app.id)) {
        // Update to in_progress status with attendance timestamp
        const updatedStatusHistory = [
          ...(app.status_history || []),
          {
            from: app.status,
            to: 'in_progress',
            changed_at: currentTimestamp,
            changed_by: user.id,
            notes: 'Attendance marked'
          }
        ];

        const { error: updateError } = await supabase
          .from('training_applications')
          .update({
            status: 'in_progress',
            attendance_marked_at: currentTimestamp, // Always update to latest attendance marking
            training_started_at: app.training_started_at || currentTimestamp, // Keep first timestamp, set if null
            status_history: updatedStatusHistory,
          })
          .eq('id', app.id);

        if (updateError) {
          console.error(`Error marking attendance for application ${app.id}:`, updateError);
          continue; // Skip this one but continue with others
        }

        markedCount++;

        // Prepare notification for attendee
        notifications.push({
          user_id: app.applicant_id,
          type: 'training_attendance',
          title: 'Attendance Recorded',
          message: `Your attendance for "${program.title}" has been recorded. Keep up the good work!`,
          related_entity_type: 'training_application',
          related_entity_id: app.id,
          link_url: '/applicant/trainings',
          is_read: false,
        });
      }
    }

    // 8. Send notifications in bulk
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

    // 9. Log activity
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          user_role: profile.role,
          user_email: user.email || '',
          action: 'mark_attendance',
          entity_type: 'training_program',
          entity_id: program_id,
          description: `Marked attendance for ${markedCount} trainees in "${program.title}"`,
          metadata: {
            program_id,
            program_title: program.title,
            attended_count: markedCount,
            total_enrolled: enrolledApps.length,
          },
        });
    } catch (logError) {
      console.error('Error logging attendance marking:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${markedCount} trainee(s)`,
      marked_count: markedCount,
      total_enrolled: enrolledApps.length,
    });

  } catch (error: any) {
    console.error('Server error in POST /api/training/applications/attendance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
