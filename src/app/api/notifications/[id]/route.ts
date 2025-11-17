import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Notification Management API - Individual Notification Operations
 *
 * Endpoints:
 * - PATCH /api/notifications/[id] - Mark notification as read/unread
 * - DELETE /api/notifications/[id] - Delete single notification
 */

// PATCH /api/notifications/[id] - Mark notification as read/unread
export async function PATCH(
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

    // 2. Parse request body
    const body = await request.json();
    const { is_read } = body;

    if (typeof is_read !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request - is_read must be a boolean' },
        { status: 400 }
      );
    }

    // 3. Verify notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Notification not found or does not belong to you' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 4. Update notification
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read,
        read_at: is_read ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: `Notification marked as ${is_read ? 'read' : 'unread'}`,
    });

  } catch (error: any) {
    console.error('Server error in PATCH /api/notifications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete single notification
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

    // 2. Verify notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Notification not found or does not belong to you' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 3. Delete notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
