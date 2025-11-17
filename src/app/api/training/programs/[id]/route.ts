import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyPESO, notifyProgramApplicants, notifyAdmins } from '@/lib/notifications';

/**
 * Training Program Management API - Individual Program Operations
 *
 * Endpoints:
 * - GET /api/training/programs/[id] - Get program details
 * - PUT /api/training/programs/[id] - Update program (PESO/ADMIN only)
 * - DELETE /api/training/programs/[id] - Delete program (PESO/ADMIN only)
 */

// GET /api/training/programs/[id] - Get single training program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch training program
    const { data: program, error } = await supabase
      .from('training_programs')
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training program not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/training/programs/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/training/programs/[id] - Update training program
export async function PUT(
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
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Only PESO and ADMIN can update training programs
    if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO and Admin can update training programs' },
        { status: 403 }
      );
    }

    // 4. Get existing program
    const { data: existingProgram, error: fetchError } = await supabase
      .from('training_programs')
      .select('id, created_by, title, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training program not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 5. Check ownership (PESO can only update their own, ADMIN can update any)
    if (profile.role === 'PESO' && existingProgram.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only update your own training programs' },
        { status: 403 }
      );
    }

    // 6. Validate required fields
    const { title, description, duration, capacity, start_date, status, schedule, location, skills_covered, icon, end_date } = body;

    if (!title || !description || !duration || !capacity || !start_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, duration, capacity, start_date' },
        { status: 400 }
      );
    }

    // 7. Validate capacity
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be a positive number' },
        { status: 400 }
      );
    }

    // 8. Validate status if provided
    const validStatuses = ['active', 'upcoming', 'completed', 'cancelled', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 9. Build update object
    const updateData: any = {
      title,
      description,
      duration,
      schedule: schedule || null,
      capacity: capacityNum,
      location: location || null,
      start_date,
      end_date: end_date || null,
      skills_covered: skills_covered || [],
      icon: icon || 'GraduationCap',
      updated_at: new Date().toISOString(),
    };

    // Add status if provided
    if (status) {
      updateData.status = status;
    }

    // 10. Update program
    const { data: updatedProgram, error: updateError } = await supabase
      .from('training_programs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating training program:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 11. Log activity
    try {
      await supabase.rpc('log_training_program_updated', {
        p_user_id: user.id,
        p_program_id: id,
        p_metadata: {
          program_title: updatedProgram.title,
          old_title: existingProgram.title,
          status: updatedProgram.status,
          old_status: existingProgram.status,
        }
      });
    } catch (logError) {
      console.error('Error logging training program update:', logError);
      // Don't fail the request if logging fails
    }

    // 12. Send notifications
    try {
      // Notify PESO user (confirmation)
      await notifyPESO(user.id, {
        type: 'system',
        title: 'Training Program Updated Successfully',
        message: `Your training program "${updatedProgram.title}" has been updated`,
        related_entity_type: 'training_application',
        related_entity_id: id,
        link_url: `/peso/programs`,
      });

      // If program status changed or title changed, notify enrolled applicants
      if (existingProgram.status !== updatedProgram.status || existingProgram.title !== updatedProgram.title) {
        await notifyProgramApplicants(id, {
          type: 'system',
          title: 'Training Program Updated',
          message: `The training program "${updatedProgram.title}" has been updated. Please check the details.`,
          related_entity_type: 'training_application',
          related_entity_id: id,
          link_url: `/applicant/trainings`,
        });
      }
    } catch (notifError) {
      console.error('Error sending program update notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: updatedProgram,
      message: 'Training program updated successfully',
    });

  } catch (error: any) {
    console.error('Server error in PUT /api/training/programs/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/training/programs/[id] - Delete training program
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

    // 3. Only PESO and ADMIN can delete training programs
    if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO and Admin can delete training programs' },
        { status: 403 }
      );
    }

    // 4. Get existing program
    const { data: existingProgram, error: fetchError } = await supabase
      .from('training_programs')
      .select('id, created_by, title, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training program not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 5. Check ownership (PESO can only delete their own, ADMIN can delete any)
    if (profile.role === 'PESO' && existingProgram.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only delete your own training programs' },
        { status: 403 }
      );
    }

    // 6. Delete program
    const { error: deleteError } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting training program:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // 7. Log activity
    try {
      await supabase.rpc('log_training_program_deleted', {
        p_user_id: user.id,
        p_program_id: id,
        p_metadata: {
          program_title: existingProgram.title,
          status: existingProgram.status,
        }
      });
    } catch (logError) {
      console.error('Error logging training program deletion:', logError);
      // Don't fail the request if logging fails
    }

    // 8. Send notifications
    try {
      // Notify PESO user (confirmation)
      await notifyPESO(user.id, {
        type: 'system',
        title: 'Training Program Deleted',
        message: `Training program "${existingProgram.title}" has been deleted`,
        link_url: `/peso/programs`,
      });

      // Notify ADMIN of training program deletion for system monitoring
      await notifyAdmins({
        type: 'system',
        title: 'Training Program Deleted',
        message: `PESO officer deleted the training program: "${existingProgram.title}"`,
        link_url: '/peso/programs',
      });

      // Notify all enrolled applicants that program was cancelled
      await notifyProgramApplicants(id, {
        type: 'system',
        title: 'Training Program Cancelled',
        message: `The training program "${existingProgram.title}" has been cancelled`,
        link_url: `/applicant/trainings`,
      });
    } catch (notifError) {
      console.error('Error sending program deletion notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: `Training program "${existingProgram.title}" deleted successfully`,
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/training/programs/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
