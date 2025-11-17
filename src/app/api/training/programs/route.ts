import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyPESO, notifyAdmins } from '@/lib/notifications';

/**
 * Training Programs Management API Routes
 *
 * Endpoints:
 * - GET /api/training/programs - List all training programs
 * - POST /api/training/programs - Create new training program (PESO only)
 *
 * Database Schema:
 * - training_programs table: id, title, description, duration, schedule, capacity, enrolled_count,
 *   location, start_date, end_date, skills_covered, icon, status, created_by, created_at, updated_at
 */

// GET /api/training/programs - List training programs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Optional filters
    const status = searchParams.get('status'); // active, completed, cancelled

    // Get current user and their role for multi-tenancy filtering
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('training_programs')
      .select(`
        id,
        title,
        description,
        duration,
        schedule,
        capacity,
        enrolled_count,
        location,
        start_date,
        end_date,
        skills_covered,
        icon,
        status,
        created_by,
        created_at,
        updated_at,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering (multi-tenancy)
    if (profile.role === 'PESO') {
      // PESO users can only see programs they created
      query = query.eq('created_by', user.id);
    } else if (profile.role === 'APPLICANT') {
      // Applicants can view all active programs (public)
      // No created_by filter needed, but status filter will be applied below
    }
    // ADMIN can see all programs (no additional filter)

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!status) {
      // Default to active programs only
      query = query.eq('status', 'active');
    }

    // Execute query
    const { data: programs, error } = await query;

    if (error) {
      console.error('Error fetching training programs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: programs,
      count: programs?.length || 0,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/training/programs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/training/programs - Create training program
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
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Only PESO and ADMIN can create training programs
    if (profile.role !== 'PESO' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO and Admin can create training programs' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { title, description, duration, capacity, start_date, schedule, location, skills_covered, icon } = body;

    if (!title || !description || !duration || !capacity || !start_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, duration, capacity, start_date' },
        { status: 400 }
      );
    }

    // 5. Validate capacity is a positive number
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be a positive number' },
        { status: 400 }
      );
    }

    // 6. Create training program
    const { data: program, error: createError } = await supabase
      .from('training_programs')
      .insert({
        title,
        description,
        duration,
        schedule: schedule || null,
        capacity: capacityNum,
        enrolled_count: 0,
        location: location || null,
        start_date,
        end_date: body.end_date || null,
        skills_covered: skills_covered || [],
        icon: icon || 'GraduationCap',
        status: 'active',
        created_by: user.id,
      })
      .select(`
        id,
        title,
        description,
        duration,
        schedule,
        capacity,
        enrolled_count,
        location,
        start_date,
        end_date,
        skills_covered,
        icon,
        status,
        created_by,
        created_at,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating training program:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    // 7. Log activity
    try {
      await supabase.rpc('log_training_program_created', {
        p_peso_id: user.id,
        p_program_id: program.id,
        p_program_title: program.title,
        p_metadata: {
          duration: program.duration,
          capacity: program.capacity,
          start_date: program.start_date,
          skills_count: program.skills_covered?.length || 0,
        }
      });
    } catch (logError) {
      console.error('Error logging training program creation:', logError);
      // Don't fail the request if logging fails
    }

    // 8. Send notifications
    try {
      // Notify PESO user (confirmation of their own action) - LIKE HR!
      await notifyPESO(user.id, {
        type: 'system',
        title: 'Training Program Created Successfully',
        message: `Your training program "${program.title}" has been published`,
        related_entity_type: 'training_application',
        related_entity_id: program.id,
        link_url: `/peso/programs`,
      });

      // Notify all admins that PESO created a program
      await notifyAdmins({
        type: 'system',
        title: 'New Training Program Published',
        message: `PESO published a new training program: "${program.title}"`,
        related_entity_type: 'training_application',
        related_entity_id: program.id,
        link_url: `/admin/user-management`,
      });
    } catch (notifError) {
      console.error('Error sending program creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        data: program,
        message: 'Training program created successfully',
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/training/programs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
