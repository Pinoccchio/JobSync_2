import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins, notifyHR, notifyJobApplicants } from '@/lib/notifications';

/**
 * Job Management API - Individual Job Operations
 *
 * Endpoints:
 * - GET /api/jobs/[id] - Get job details by ID
 * - PATCH /api/jobs/[id] - Update job (HR/ADMIN only)
 * - DELETE /api/jobs/[id] - Delete/archive job (HR/ADMIN only)
 */

// GET /api/jobs/[id] - Get single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        degree_requirement,
        eligibilities,
        skills,
        years_of_experience,
        min_years_experience,
        max_years_experience,
        experience,
        location,
        employment_type,
        remote,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching job:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });

  } catch (error) {
    console.error('Server error in GET /api/jobs/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // 1. Get current user
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

    // 3. Check if user is HR or ADMIN
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can update jobs' },
        { status: 403 }
      );
    }

    // 4. Get existing job to verify ownership (HR can only edit their own jobs, ADMIN can edit any)
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, created_by, title')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // HR can only edit their own jobs, ADMIN can edit any
    if (profile.role === 'HR' && existingJob.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only edit jobs you created' },
        { status: 403 }
      );
    }

    // 5. Prepare update data (only include fields that are provided)
    const updateData: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Description must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.degree_requirement !== undefined) {
      updateData.degree_requirement = body.degree_requirement;
    }

    if (body.eligibilities !== undefined) {
      if (!Array.isArray(body.eligibilities)) {
        return NextResponse.json(
          { success: false, error: 'Eligibilities must be an array' },
          { status: 400 }
        );
      }
      updateData.eligibilities = body.eligibilities;
    }

    if (body.skills !== undefined) {
      if (!Array.isArray(body.skills)) {
        return NextResponse.json(
          { success: false, error: 'Skills must be an array' },
          { status: 400 }
        );
      }
      updateData.skills = body.skills;
    }

    if (body.years_of_experience !== undefined) {
      if (typeof body.years_of_experience !== 'number' || body.years_of_experience < 0 || body.years_of_experience > 50) {
        return NextResponse.json(
          { success: false, error: 'Years of experience must be a number between 0 and 50' },
          { status: 400 }
        );
      }
      updateData.years_of_experience = body.years_of_experience;
    }

    if (body.location !== undefined) {
      updateData.location = body.location || null;
    }

    if (body.employment_type !== undefined) {
      updateData.employment_type = body.employment_type || null;
    }

    if (body.remote !== undefined) {
      updateData.remote = body.remote || false;
    }

    if (body.experience !== undefined) {
      updateData.experience = body.experience || null;

      // Map experience level string to min/max range and midpoint
      if (body.experience) {
        if (body.experience.includes('Entry Level')) {
          updateData.min_years_experience = 0;
          updateData.max_years_experience = 1;
          updateData.years_of_experience = 1;
        }
        else if (body.experience.includes('Junior')) {
          updateData.min_years_experience = 1;
          updateData.max_years_experience = 3;
          updateData.years_of_experience = 2;
        }
        else if (body.experience.includes('Mid-level')) {
          updateData.min_years_experience = 3;
          updateData.max_years_experience = 5;
          updateData.years_of_experience = 4;
        }
        else if (body.experience.includes('Senior')) {
          updateData.min_years_experience = 5;
          updateData.max_years_experience = 8;
          updateData.years_of_experience = 6;
        }
        else if (body.experience.includes('Lead')) {
          updateData.min_years_experience = 8;
          updateData.max_years_experience = 15;
          updateData.years_of_experience = 10;
        }
        else if (body.experience.includes('Expert')) {
          updateData.min_years_experience = 10;
          updateData.max_years_experience = 99;
          updateData.years_of_experience = 15;
        }
      }
    }

    if (body.status !== undefined) {
      if (!['active', 'hidden', 'archived'].includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status. Must be: active, hidden, or archived' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // 6. Update the job
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 7. Log activity
    try {
      // If status changed, log status change specifically
      if (body.status && body.status !== (existingJob as any).status) {
        await supabase.rpc('log_job_status_changed', {
          p_user_id: user.id,
          p_job_id: id,
          p_old_status: (existingJob as any).status,
          p_new_status: body.status,
          p_metadata: {
            job_title: updatedJob.title,
            action: body.status === 'hidden' ? 'hide' : body.status === 'active' ? 'unhide' : 'status_change',
          }
        });
      } else {
        // Log general update
        await supabase.rpc('log_job_updated', {
          p_user_id: user.id,
          p_job_id: id,
          p_metadata: {
            job_title: updatedJob.title,
            updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
            old_title: existingJob.title,
          }
        });
      }
    } catch (logError) {
      console.error('Error logging job update:', logError);
      // Don't fail the request if logging fails
    }

    // 8. Send notifications
    try {
      // Notify HR user (confirmation of their own action)
      await notifyHR(user.id, {
        type: 'system',
        title: 'Job Updated Successfully',
        message: `Your job posting "${updatedJob.title}" has been updated`,
        related_entity_type: 'job',
        related_entity_id: id,
        link_url: `/hr/job-management`,
      });

      // Notify all admins that HR updated a job
      await notifyAdmins({
        type: 'system',
        title: 'Job Updated',
        message: `HR user updated the job: "${updatedJob.title}"`,
        related_entity_type: 'job',
        related_entity_id: id,
        link_url: `/admin/user-management`,
      });

      // If job status changed to archived/hidden, notify applicants
      if (body.status && body.status !== 'active' && (existingJob as any).status === 'active') {
        await notifyJobApplicants(id, {
          type: 'system',
          title: `Job Posting ${body.status === 'archived' ? 'Closed' : 'Updated'}`,
          message: `The job "${updatedJob.title}" has been ${body.status === 'archived' ? 'closed' : 'temporarily hidden'}`,
          related_entity_type: 'job',
          related_entity_id: id,
        });
      }
    } catch (notifError) {
      console.error('Error sending job update notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    // 9. If job requirements changed, trigger re-ranking of applicants
    const requirementFields = ['degree_requirement', 'skills', 'eligibilities', 'years_of_experience'];
    const requirementsChanged = requirementFields.some(field => updateData.hasOwnProperty(field));

    if (requirementsChanged) {
      // Trigger re-ranking in background (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/${id}/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(error => {
        console.error('Background re-ranking failed:', error);
        // Don't fail the request if re-ranking fails
      });

      console.log(`Job requirements updated for "${updatedJob.title}". Triggered background re-ranking of applicants.`);
    }

    return NextResponse.json({
      success: true,
      data: updatedJob,
      message: requirementsChanged
        ? 'Job updated successfully. Applicants are being re-ranked in the background.'
        : 'Job updated successfully',
    });

  } catch (error) {
    console.error('Server error in PATCH /api/jobs/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Archive job (soft delete) or permanently delete
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

    // 1. Get current user
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

    // 3. Check if user is HR or ADMIN
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can delete jobs' },
        { status: 403 }
      );
    }

    // 4. Get existing job to verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, created_by, title, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // HR can only delete their own jobs, ADMIN can delete any
    if (profile.role === 'HR' && existingJob.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only delete jobs you created' },
        { status: 403 }
      );
    }

    // 5. Handle permanent deletion
    if (isPermanent) {
      // Safety check: Only allow permanent deletion of archived jobs
      if (existingJob.status !== 'archived') {
        return NextResponse.json(
          { success: false, error: 'Jobs must be archived before permanent deletion' },
          { status: 400 }
        );
      }

      // Count applications that will be deleted
      const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', id);

      // PERMANENT DELETE: Remove from database
      // This will CASCADE delete all applications due to FK constraint
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error permanently deleting job:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      // Log permanent deletion
      try {
        await supabase.rpc('log_job_deleted', {
          p_user_id: user.id,
          p_job_id: id,
          p_metadata: {
            job_title: existingJob.title,
            permanent: true,
            applications_deleted: applicationCount || 0,
            warning: 'PERMANENT DELETION - All data removed from database',
          }
        });
      } catch (logError) {
        console.error('Error logging permanent job deletion:', logError);
      }

      // Send notifications for permanent deletion
      try {
        // Notify HR user (confirmation)
        await notifyHR(user.id, {
          type: 'system',
          title: 'Job Permanently Deleted',
          message: `The job "${existingJob.title}" has been permanently deleted from the system`,
        });

        // Notify all admins
        await notifyAdmins({
          type: 'system',
          title: 'Job Permanently Deleted',
          message: `HR user permanently deleted the job: "${existingJob.title}" (${applicationCount || 0} applications removed)`,
        });
      } catch (notifError) {
        console.error('Error sending permanent deletion notifications:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: `Job "${existingJob.title}" permanently deleted`,
        deletedApplications: applicationCount || 0,
      });
    }

    // 6. Soft delete (default): Update status to 'archived'
    // This preserves all applications and data for historical records
    const { error: archiveError } = await supabase
      .from('jobs')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (archiveError) {
      console.error('Error archiving job:', archiveError);
      return NextResponse.json(
        { success: false, error: archiveError.message },
        { status: 500 }
      );
    }

    // Log archive operation (status change)
    try {
      await supabase.rpc('log_job_status_changed', {
        p_user_id: user.id,
        p_job_id: id,
        p_old_status: existingJob.status,
        p_new_status: 'archived',
        p_metadata: {
          job_title: existingJob.title,
          action: 'archive',
          reversible: true,
        }
      });
    } catch (logError) {
      console.error('Error logging job archive:', logError);
    }

    // Send notifications for archiving
    try {
      // Notify HR user (confirmation)
      await notifyHR(user.id, {
        type: 'system',
        title: 'Job Archived Successfully',
        message: `The job "${existingJob.title}" has been archived`,
        related_entity_type: 'job',
        related_entity_id: id,
        link_url: `/hr/job-management`,
      });

      // Notify all admins
      await notifyAdmins({
        type: 'system',
        title: 'Job Archived',
        message: `HR user archived the job: "${existingJob.title}"`,
        related_entity_type: 'job',
        related_entity_id: id,
        link_url: `/admin/user-management`,
      });

      // Notify applicants that the job is closed
      await notifyJobApplicants(id, {
        type: 'system',
        title: 'Job Posting Closed',
        message: `The job "${existingJob.title}" has been closed and is no longer accepting applications`,
        related_entity_type: 'job',
        related_entity_id: id,
      });
    } catch (notifError) {
      console.error('Error sending job archive notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: `Job "${existingJob.title}" archived successfully`,
    });

  } catch (error) {
    console.error('Server error in DELETE /api/jobs/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
