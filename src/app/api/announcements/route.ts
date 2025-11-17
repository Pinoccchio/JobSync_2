import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins, notifyHR, notifyAllApplicants } from '@/lib/notifications';

/**
 * Announcements Management API Routes
 *
 * Endpoints:
 * - GET /api/announcements - List all active announcements
 * - POST /api/announcements - Create new announcement (HR/ADMIN only)
 *
 * Database Schema:
 * - announcements table: id, title, description, category, image_url, status, created_by, published_at, created_at
 */

// GET /api/announcements - List announcements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Optional filters
    const status = searchParams.get('status'); // active, archived
    const category = searchParams.get('category'); // general, job_opening, training, notice

    // Build query
    let query = supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        category,
        image_url,
        status,
        created_by,
        published_at,
        created_at,
        updated_at,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    // Apply HR isolation: HR users can only see their own announcements
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // HR users can only see announcements they created
      if (profile?.role === 'HR') {
        query = query.eq('created_by', user.id);
      }
      // ADMIN can see all announcements (no additional filter)
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else if (!status) {
      // Default to active announcements only if no status specified
      query = query.eq('status', 'active');
    }
    // If status === 'all', don't filter by status (fetch all)

    if (category) {
      query = query.eq('category', category);
    }

    // Execute query
    const { data: announcements, error } = await query;

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcements,
      count: announcements?.length || 0,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/announcements:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create announcement
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

    // 3. Only HR and ADMIN can create announcements
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can create announcements' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { title, description, category, image_url } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description' },
        { status: 400 }
      );
    }

    // 5. Validate category if provided
    const validCategories = ['general', 'job_opening', 'training', 'notice'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // 6. Create announcement
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        title,
        description,
        category: category || 'general',
        image_url: image_url || null,
        created_by: user.id,
        status: 'active',
        published_at: new Date().toISOString(),
      })
      .select(`
        id,
        title,
        description,
        category,
        image_url,
        status,
        created_by,
        published_at,
        created_at,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating announcement:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    // 7. Log activity
    try {
      await supabase.rpc('log_announcement_created', {
        p_hr_id: user.id,
        p_announcement_id: announcement.id,
        p_announcement_title: announcement.title,
        p_category: announcement.category,
        p_metadata: {
          has_image: !!announcement.image_url,
          description_length: announcement.description.length,
        }
      });
    } catch (logError) {
      console.error('Error logging announcement creation:', logError);
      // Don't fail the request if logging fails
    }

    // 8. Send notifications
    try {
      // Notify HR user (confirmation of their own action)
      await notifyHR(user.id, {
        type: 'announcement',
        title: 'Announcement Published Successfully',
        message: `Your announcement "${announcement.title}" has been published`,
        related_entity_type: 'announcement',
        related_entity_id: announcement.id,
        link_url: `/hr/announcements`,
      });

      // Notify all admins that HR created an announcement
      await notifyAdmins({
        type: 'announcement',
        title: 'New Announcement Published',
        message: `HR user published a new announcement: "${announcement.title}"`,
        related_entity_type: 'announcement',
        related_entity_id: announcement.id,
        link_url: `/admin/user-management`,
      });

      // Notify all applicants about the new announcement
      await notifyAllApplicants({
        type: 'announcement',
        title: 'New Announcement Posted',
        message: announcement.title,
        related_entity_type: 'announcement',
        related_entity_id: announcement.id,
        link_url: `/applicant/announcements`,
      });
    } catch (notifError) {
      console.error('Error sending announcement creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/announcements:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
