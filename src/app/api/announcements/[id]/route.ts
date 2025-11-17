import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notifyAdmins, notifyHR } from '@/lib/notifications';
import { extractFilePathFromStorageUrl, deleteFileFromStorage } from '@/lib/utils/storage';

/**
 * Announcement Management API - Individual Announcement Operations
 *
 * Endpoints:
 * - GET /api/announcements/[id] - Get announcement details
 * - PUT /api/announcements/[id] - Update announcement (HR/ADMIN only)
 * - DELETE /api/announcements/[id] - Delete announcement (soft delete by setting status='archived')
 */

// GET /api/announcements/[id] - Get single announcement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
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
          { success: false, error: 'Announcement not found' },
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
      data: announcement,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] - Update announcement
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

    // 3. Only HR and ADMIN can update announcements
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can update announcements' },
        { status: 403 }
      );
    }

    // 4. Get existing announcement
    const { data: existingAnnouncement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, created_by, title, status, category')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Announcement not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 5. Check ownership (HR can only update their own, ADMIN can update any)
    if (profile.role === 'HR' && existingAnnouncement.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only update your own announcements' },
        { status: 403 }
      );
    }

    // 6. Validate required fields
    const { title, description, category, image_url, status } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description' },
        { status: 400 }
      );
    }

    // 7. Validate category if provided
    const validCategories = ['general', 'job_opening', 'training', 'notice'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // 7b. Validate status if provided
    const validStatuses = ['active', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // 8. Build update object
    const updateData: any = {
      title,
      description,
      category: category || existingAnnouncement.category,
      image_url: image_url || null,
      updated_at: new Date().toISOString(),
    };

    // Add status to update if provided
    if (status) {
      updateData.status = status;
    }

    // 9. Update announcement
    const { data: updatedAnnouncement, error: updateError } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (updateError) {
      console.error('Error updating announcement:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 9. Log activity
    try {
      await supabase.rpc('log_announcement_updated', {
        p_user_id: user.id,
        p_announcement_id: id,
        p_metadata: {
          announcement_title: updatedAnnouncement.title,
          old_title: existingAnnouncement.title,
          category: updatedAnnouncement.category,
          old_category: existingAnnouncement.category,
          has_image: !!updatedAnnouncement.image_url,
        }
      });
    } catch (logError) {
      console.error('Error logging announcement update:', logError);
      // Don't fail the request if logging fails
    }

    // 10. Send notifications
    try {
      // Notify HR user (confirmation)
      await notifyHR(user.id, {
        type: 'announcement',
        title: 'Announcement Updated Successfully',
        message: `Your announcement "${updatedAnnouncement.title}" has been updated`,
        related_entity_type: 'announcement',
        related_entity_id: id,
        link_url: `/hr/announcements`,
      });

      // Notify all admins
      await notifyAdmins({
        type: 'announcement',
        title: 'Announcement Updated',
        message: `HR user updated the announcement: "${updatedAnnouncement.title}"`,
        related_entity_type: 'announcement',
        related_entity_id: id,
        link_url: `/admin/user-management`,
      });
    } catch (notifError) {
      console.error('Error sending announcement update notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: updatedAnnouncement,
      message: 'Announcement updated successfully',
    });

  } catch (error: any) {
    console.error('Server error in PUT /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Archive or permanently delete announcement
// Query params: ?permanent=true for hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if this is a permanent delete request
    const searchParams = request.nextUrl.searchParams;
    const isPermanent = searchParams.get('permanent') === 'true';

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

    // 3. Only HR and ADMIN can delete announcements
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can delete announcements' },
        { status: 403 }
      );
    }

    // 4. Get existing announcement (including image_url for cleanup)
    const { data: existingAnnouncement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, created_by, title, status, image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Announcement not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 5. Check ownership (HR can only delete their own, ADMIN can delete any)
    if (profile.role === 'HR' && existingAnnouncement.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only delete your own announcements' },
        { status: 403 }
      );
    }

    // 6. Handle permanent deletion
    if (isPermanent) {
      // Safety check: Only allow permanent deletion of archived announcements
      if (existingAnnouncement.status !== 'archived') {
        return NextResponse.json(
          { success: false, error: 'Announcements must be archived before permanent deletion' },
          { status: 400 }
        );
      }

      // 6a. Delete associated image from storage (if exists)
      if (existingAnnouncement.image_url) {
        const filePath = extractFilePathFromStorageUrl(existingAnnouncement.image_url, 'announcements');
        if (filePath) {
          const adminClient = createAdminClient();
          await deleteFileFromStorage(adminClient, 'announcements', filePath);
        }
      }

      // 6b. PERMANENT DELETE: Remove announcement from database
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error permanently deleting announcement:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      // Log permanent deletion
      try {
        await supabase.rpc('log_announcement_status_changed', {
          p_user_id: user.id,
          p_announcement_id: id,
          p_old_status: existingAnnouncement.status,
          p_new_status: 'deleted_permanently',
          p_metadata: {
            announcement_title: existingAnnouncement.title,
            permanent: true,
            warning: 'PERMANENT DELETION - All data removed from database',
          }
        });
      } catch (logError) {
        console.error('Error logging permanent announcement deletion:', logError);
      }

      // Send notifications for permanent deletion
      try {
        // Notify HR user (confirmation)
        await notifyHR(user.id, {
          type: 'announcement',
          title: 'Announcement Permanently Deleted',
          message: `The announcement "${existingAnnouncement.title}" has been permanently deleted from the system`,
        });

        // Notify all admins
        await notifyAdmins({
          type: 'announcement',
          title: 'Announcement Permanently Deleted',
          message: `HR user permanently deleted the announcement: "${existingAnnouncement.title}"`,
        });
      } catch (notifError) {
        console.error('Error sending permanent deletion notifications:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: `Announcement "${existingAnnouncement.title}" permanently deleted`,
      });
    }

    // 7. Soft delete (default): Set status to 'archived'
    const { error: archiveError } = await supabase
      .from('announcements')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (archiveError) {
      console.error('Error archiving announcement:', archiveError);
      return NextResponse.json(
        { success: false, error: archiveError.message },
        { status: 500 }
      );
    }

    // Log archive operation
    try {
      await supabase.rpc('log_announcement_status_changed', {
        p_user_id: user.id,
        p_announcement_id: id,
        p_old_status: existingAnnouncement.status,
        p_new_status: 'archived',
        p_metadata: {
          announcement_title: existingAnnouncement.title,
          action: 'archive',
          reversible: true,
        }
      });
    } catch (logError) {
      console.error('Error logging announcement archive:', logError);
    }

    // Send notifications for archiving
    try {
      // Notify HR user (confirmation)
      await notifyHR(user.id, {
        type: 'announcement',
        title: 'Announcement Archived Successfully',
        message: `The announcement "${existingAnnouncement.title}" has been archived`,
        related_entity_type: 'announcement',
        related_entity_id: id,
        link_url: `/hr/announcements`,
      });

      // Notify all admins
      await notifyAdmins({
        type: 'announcement',
        title: 'Announcement Archived',
        message: `HR user archived the announcement: "${existingAnnouncement.title}"`,
        related_entity_type: 'announcement',
        related_entity_id: id,
        link_url: `/admin/user-management`,
      });
    } catch (notifError) {
      console.error('Error sending archive notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: `Announcement "${existingAnnouncement.title}" archived successfully`,
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
