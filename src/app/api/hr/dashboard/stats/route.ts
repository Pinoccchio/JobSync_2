import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/hr/dashboard/stats
 * Returns dashboard statistics filtered to current HR user's jobs only
 * Ensures multi-tenancy: HR users only see stats for jobs they created
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile and verify HR role
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

    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: HR or ADMIN role required' },
        { status: 403 }
      );
    }

    // For ADMIN, show all stats (system-wide)
    // For HR, show only stats for jobs they created
    const isAdmin = profile.role === 'ADMIN';

    // Get jobs for this HR user (or all jobs if ADMIN)
    let jobsQuery = supabase
      .from('jobs')
      .select('id, status');

    if (!isAdmin) {
      // HR: Filter to only jobs they created
      jobsQuery = jobsQuery.eq('created_by', user.id);
    }

    const { data: jobs, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    const jobIds = jobs?.map(job => job.id) || [];

    // If HR user has no jobs, return zero stats
    if (!isAdmin && jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalScanned: 0,
          pendingReview: 0,
          inProgress: 0,
          approvedHired: 0,
          deniedWithdrawn: 0,
          archived: 0,
          activeJobs: 0,
        }
      });
    }

    // Build applications query
    let applicationsQuery = supabase
      .from('applications')
      .select('status');

    if (!isAdmin && jobIds.length > 0) {
      // HR: Filter to applications for their jobs only
      applicationsQuery = applicationsQuery.in('job_id', jobIds);
    }

    const { data: applications, error: appsError } = await applicationsQuery;

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalScanned = applications?.length || 0;
    const pendingReview = applications?.filter(app =>
      app.status === 'pending' || app.status === 'under_review'
    ).length || 0;
    const inProgress = applications?.filter(app =>
      app.status === 'shortlisted' || app.status === 'interviewed'
    ).length || 0;
    const approvedHired = applications?.filter(app =>
      app.status === 'approved' || app.status === 'hired'
    ).length || 0;
    const deniedWithdrawn = applications?.filter(app =>
      app.status === 'denied' || app.status === 'withdrawn'
    ).length || 0;
    const archived = applications?.filter(app =>
      app.status === 'archived'
    ).length || 0;

    // Count active jobs
    const activeJobs = jobs?.filter(job => job.status === 'active').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalScanned,
        pendingReview,
        inProgress,
        approvedHired,
        deniedWithdrawn,
        archived,
        activeJobs,
      }
    });

  } catch (error: any) {
    console.error('Error in HR dashboard stats API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
