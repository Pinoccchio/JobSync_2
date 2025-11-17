import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, updateUserProfile, deleteUser } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/auth';
import { ActivityLogger } from '@/lib/supabase/activityLogger';
import { extractFilePathFromStorageUrl, deleteFileFromStorage } from '@/lib/utils/storage';
import type { UpdateUserRequest, User, ApiResponse } from '@/types/users';

/**
 * PATCH /api/admin/users/[id]
 * Update user profile (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateUserRequest = await request.json();

    // Validate at least one field to update
    if (!body.full_name && !body.phone && !body.status) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['active', 'inactive'].includes(body.status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid status. Must be active or inactive' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // BUSINESS RULE 1: Cannot deactivate ANY ADMIN account (including yourself)
    // This prevents admins from accidentally locking themselves out
    // Admin accounts should only be deactivated through direct database access for security
    if (body.status === 'inactive' && targetUser.role === 'ADMIN') {
      const isSelf = userId === user.id;
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: isSelf
            ? 'Cannot deactivate your own admin account. This would lock you out of the system.'
            : 'Cannot deactivate another admin account. Admin accounts require special handling.'
        },
        { status: 403 }
      );
    }

    // BUSINESS RULE 2: Cannot change role for ADMIN accounts
    // This protects against role changes to/from ADMIN
    // Note: UpdateUserRequest doesn't include role, but adding this for future-proofing
    const bodyAny = body as any;
    if (bodyAny.role && targetUser.role === 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot change role for admin accounts' },
        { status: 403 }
      );
    }

    // Extract reason from body (used only for logging, not for profile update)
    const { reason, ...profileUpdates } = body;

    // Update user profile (without reason field)
    const result = await updateUserProfile(userId, profileUpdates);

    // Log activity using specialized functions
    if (body.status === 'inactive') {
      // Deactivation
      await ActivityLogger.adminDeactivateUser(
        user.id,
        userId,
        body.reason || undefined
      );
    } else if (body.status === 'active') {
      // Activation
      await ActivityLogger.adminActivateUser(
        user.id,
        userId,
        body.reason || undefined
      );
    } else {
      // Other updates (name, phone) - use generic logging
      const changes = [];
      if (body.full_name) changes.push(`name to "${body.full_name}"`);
      if (body.phone) changes.push(`phone to "${body.phone}"`);

      await supabaseAdmin.rpc('log_activity', {
        p_user_id: user.id,
        p_event_type: 'Update User',
        p_event_category: 'user_management',
        p_details: `Updated ${targetUser.full_name} (${targetUser.email}): ${changes.join(', ')}`,
        p_status: 'success',
        p_metadata: { updated_user_id: userId, changes: body },
      });
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      message: 'User updated successfully',
      data: result.user as User,
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error);

    // Log failed attempt
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          await supabaseAdmin.rpc('log_activity', {
            p_user_id: user.id,
            p_event_type: 'Update User',
            p_event_category: 'user_management',
            p_details: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            p_status: 'failed',
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Hard delete user (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get user info before deletion (for logging and validation)
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, role, profile_image_url')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // BUSINESS RULE 1: Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // BUSINESS RULE 2: Prevent deleting other ADMIN accounts
    // Admins are equal peers - no admin can delete another admin
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot delete another admin account. Admins can only be removed by themselves or through direct database access.' },
        { status: 403 }
      );
    }

    // Delete profile image from storage (if exists)
    if (targetUser.profile_image_url) {
      const filePath = extractFilePathFromStorageUrl(targetUser.profile_image_url, 'profiles');
      if (filePath) {
        await deleteFileFromStorage(supabaseAdmin, 'profiles', filePath);
      }
    }

    // Delete user (cascades to profile)
    await deleteUser(userId);

    // Log activity using specialized function (audit trail preserved even after deletion)
    await ActivityLogger.adminDeleteUser(
      user.id,
      userId,
      'hard_delete', // deletion type
      `Deleted ${targetUser.role} account: ${targetUser.full_name} (${targetUser.email})`
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);

    // Log failed attempt
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          await supabaseAdmin.rpc('log_activity', {
            p_user_id: user.id,
            p_event_type: 'Delete User',
            p_event_category: 'user_management',
            p_details: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            p_status: 'failed',
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
