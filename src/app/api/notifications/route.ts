import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Notifications API - Fetch and Manage User Notifications
 *
 * Endpoints:
 * - GET /api/notifications - Get user's notifications
 *   Query params:
 *   - unread=true - Only unread notifications
 *   - limit=50 - Number of notifications to fetch (default: 50)
 *   - type=application_status - Filter by notification type
 * - DELETE /api/notifications - Clear all notifications for user
 */

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');

    // 3. Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // 4. Execute query
    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 5. Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount || 0,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Clear all notifications for user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Delete all notifications for this user
    const { error: deleteError, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting notifications:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // 3. Log activity
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase.rpc('log_activity', {
          p_user_id: user.id,
          p_event_type: 'NOTIFICATIONS_CLEARED',
          p_event_category: 'notification',
          p_details: `Cleared ${count || 0} notification(s)`,
          p_metadata: {
            count: count || 0,
            user_role: profile.role,
          }
        });
      }
    } catch (logError) {
      console.error('Error logging notification clear:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `${count || 0} notification(s) cleared successfully`,
      count: count || 0,
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
