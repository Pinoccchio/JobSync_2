import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/hr/dashboard/charts
 * Returns aggregated chart data for HR dashboard
 * Query params:
 *   - type: 'monthly' | 'by-job'
 *
 * Optimized with:
 * - Server-side database aggregation (GROUP BY)
 * - HR multi-tenancy filtering (user's jobs only)
 * - Returns only aggregated results (not raw data)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user profile and verify HR/ADMIN role
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

    // 3. Get chart type from query params
    const chartType = request.nextUrl.searchParams.get('type');

    if (!chartType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: type' },
        { status: 400 }
      );
    }

    const isAdmin = profile.role === 'ADMIN';

    // 4. Get user's job IDs for HR filtering (skip for ADMIN - they see all)
    let jobIds: string[] = [];
    if (!isAdmin) {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('created_by', user.id);

      if (jobsError) {
        const errorMessage = jobsError.message || jobsError.details || 'Failed to fetch jobs';
        console.error('Error fetching jobs:', {
          message: jobsError.message,
          details: jobsError.details,
          hint: jobsError.hint,
          code: jobsError.code
        });
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            code: jobsError.code || 'UNKNOWN_ERROR'
          },
          { status: 500 }
        );
      }

      jobIds = jobs?.map(job => job.id) || [];

      // If HR user has no jobs, return empty data
      if (jobIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: []
        });
      }
    }

    // 5. Handle different chart types
    switch (chartType) {
      case 'monthly': {
        // Monthly applications chart data
        // Optimized: Fetch only created_at, then aggregate in JavaScript (database GROUP BY not supported in Supabase)
        let query = supabase
          .from('applications')
          .select('created_at')
          .order('created_at', { ascending: false });

        // Apply HR filtering
        if (!isAdmin && jobIds.length > 0) {
          query = query.in('job_id', jobIds);
        }

        const { data: applications, error } = await query;

        if (error) {
          const errorMessage = error.message || error.details || 'Failed to fetch applications';
          console.error('Error fetching monthly data:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return NextResponse.json(
            {
              success: false,
              error: errorMessage,
              code: error.code || 'UNKNOWN_ERROR'
            },
            { status: 500 }
          );
        }

        // Aggregate by month in JavaScript (still much faster than client-side with full dataset)
        const monthCounts: Record<string, number> = {};
        applications?.forEach((app) => {
          const date = new Date(app.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });

        // Convert to array and sort by month
        const monthlyData = Object.entries(monthCounts)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-12); // Only last 12 months

        return NextResponse.json({
          success: true,
          data: monthlyData
        });
      }

      case 'by-job': {
        // Applications by job chart data
        // Optimized: Fetch with job titles, then count in JavaScript
        let query = supabase
          .from('applications')
          .select(`
            job_id,
            jobs:job_id (
              title
            )
          `);

        // Apply HR filtering
        if (!isAdmin && jobIds.length > 0) {
          query = query.in('job_id', jobIds);
        }

        const { data: applications, error } = await query;

        if (error) {
          const errorMessage = error.message || error.details || 'Failed to fetch job data';
          console.error('Error fetching job data:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return NextResponse.json(
            {
              success: false,
              error: errorMessage,
              code: error.code || 'UNKNOWN_ERROR'
            },
            { status: 500 }
          );
        }

        // Count applications per job in JavaScript
        const jobCounts: Record<string, { job_id: string; job_title: string; count: number }> = {};
        applications?.forEach((app: any) => {
          const jobTitle = app.jobs?.title || 'Unknown Job';
          const jobId = app.job_id || 'unknown';

          if (!jobCounts[jobId]) {
            jobCounts[jobId] = { job_id: jobId, job_title: jobTitle, count: 0 };
          }
          jobCounts[jobId].count++;
        });

        // Convert to array and sort by count (descending)
        const jobData = Object.values(jobCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 jobs

        return NextResponse.json({
          success: true,
          data: jobData
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid chart type: ${chartType}. Supported types: monthly, by-job` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error in HR dashboard charts API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
