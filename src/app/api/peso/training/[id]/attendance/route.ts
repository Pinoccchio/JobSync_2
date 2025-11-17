import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PESO Training Attendance API
 *
 * POST /api/peso/training/[id]/attendance - Mark attendance for training applicants
 */

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

    // 2. Get user profile - only PESO or ADMIN can mark attendance
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
        { success: false, error: 'Forbidden - Only PESO officers can mark attendance' },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const { applicant_ids } = body;

    if (!Array.isArray(applicant_ids)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request - applicant_ids must be an array' },
        { status: 400 }
      );
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

    // 5. Get all applications for this program (approved or enrolled)
    const { data: applications, error: appsError } = await supabase
      .from('training_applications')
      .select('id, applicant_id, full_name, status, attendance_marked_at')
      .eq('program_id', programId)
      .in('status', ['approved', 'enrolled', 'in_progress']);

    if (appsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No approved or enrolled applicants found' },
        { status: 400 }
      );
    }

    // 6. Mark selected applicants as attended
    const now = new Date().toISOString();
    const attendedIds = new Set(applicant_ids);

    // Update attended applicants
    if (applicant_ids.length > 0) {
      // First, update attendance_marked_at for all selected applicants
      const { error: updateError } = await supabase
        .from('training_applications')
        .update({
          attendance_marked_at: now, // Always update to latest attendance marking
          updated_at: now
        })
        .in('id', applicant_ids)
        .eq('program_id', programId);

      if (updateError) {
        console.error('Error updating attended applicants:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to mark attendance' },
          { status: 500 }
        );
      }

      // Then, set training_started_at only for those who don't have it yet (first time)
      const { error: startError } = await supabase
        .from('training_applications')
        .update({
          training_started_at: now, // Only set for first-time attendance
        })
        .in('id', applicant_ids)
        .eq('program_id', programId)
        .is('training_started_at', null); // Only update if null

      if (startError) {
        console.error('Error setting training_started_at:', startError);
        // Don't fail the request, this is a secondary operation
      }
    }

    // 7. Automatically transition training program to 'ongoing' if it was 'scheduled'
    if (program.status === 'scheduled' && applicant_ids.length > 0) {
      await supabase
        .from('training_programs')
        .update({ status: 'ongoing', updated_at: now })
        .eq('id', programId);
    }

    // 8. Calculate attendance percentage for each applicant
    const totalSessions = 1; // For now, each attendance marking is one session
    const attendancePercentage = 100; // They attended this session

    // Update attendance percentage for attended applicants
    if (applicant_ids.length > 0) {
      await supabase
        .from('training_applications')
        .update({
          attendance_percentage: attendancePercentage,
        })
        .in('id', applicant_ids)
        .eq('program_id', programId);
    }

    // 9. Create notifications for attended applicants
    const attendedApps = applications.filter(app => attendedIds.has(app.id));

    for (const app of attendedApps) {
      await supabase.from('notifications').insert({
        user_id: app.applicant_id,
        type: 'training_status',
        title: 'Attendance Marked',
        message: `Your attendance for "${program.title}" has been recorded.`,
        link_url: '/applicant/trainings',
        related_entity_type: 'training_application',
        related_entity_id: app.id,
      });
    }

    // 10. Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_event_category: 'training',
      p_event_type: 'attendance_marked',
      p_details: `Marked attendance for ${applicant_ids.length} applicants in training: ${program.title}`,
      p_status: 'success',
      p_metadata: {
        program_id: programId,
        attended_count: applicant_ids.length,
        total_count: applications.length,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully marked attendance for ${applicant_ids.length} applicant(s)`,
      data: {
        attended_count: applicant_ids.length,
        total_count: applications.length,
        program_status: applicant_ids.length > 0 ? 'ongoing' : program.status,
      },
    });

  } catch (error: any) {
    console.error('Server error in POST /api/peso/training/[id]/attendance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
