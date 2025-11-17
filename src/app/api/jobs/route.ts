import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins, notifyHR } from '@/lib/notifications';

/**
 * Job Management API Routes
 *
 * Endpoints:
 * - GET /api/jobs - List all jobs (with filters)
 * - POST /api/jobs - Create new job posting (HR/ADMIN only)
 *
 * Database Schema:
 * - jobs table: id, title, description, degree_requirement, eligibilities[],
 *   skills[], years_of_experience, location, employment_type, status,
 *   created_by, created_at, updated_at
 */

// GET /api/jobs - List jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Optional filters
    const status = searchParams.get('status'); // active, hidden, archived
    const createdBy = searchParams.get('created_by'); // filter by creator
    const search = searchParams.get('search'); // search in title/description

    // Start query
    let query = supabase
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
        updated_at,
        profiles:created_by (
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    // Apply HR isolation: HR users can only see their own jobs
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // HR users can only see jobs they created
      if (profile?.role === 'HR') {
        query = query.eq('created_by', user.id);
      }
      // ADMIN can see all jobs (no additional filter)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobs,
      count: jobs?.length || 0,
    });

  } catch (error) {
    console.error('Server error in GET /api/jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create new job posting
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // 1. Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, status')
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
        { success: false, error: 'Forbidden - Only HR and Admin can create jobs' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const {
      title,
      description,
      degree_requirement,
      eligibilities = [],
      skills = [],
      years_of_experience = 0,
      location,
      employment_type,
      remote = false,
      experience = null,
    } = body;

    if (!title || !description || !degree_requirement) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, degree_requirement' },
        { status: 400 }
      );
    }

    // 5. Validate data types
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Description must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(eligibilities)) {
      return NextResponse.json(
        { success: false, error: 'Eligibilities must be an array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { success: false, error: 'Skills must be an array' },
        { status: 400 }
      );
    }

    if (typeof years_of_experience !== 'number' || years_of_experience < 0 || years_of_experience > 50) {
      return NextResponse.json(
        { success: false, error: 'Years of experience must be a number between 0 and 50' },
        { status: 400 }
      );
    }

    // Map experience level string to min/max range and midpoint
    let minYears = 0;
    let maxYears = 1;
    let experienceYears = years_of_experience;

    if (experience) {
      if (experience.includes('Entry Level')) {
        minYears = 0;
        maxYears = 1;
        experienceYears = 1;
      }
      else if (experience.includes('Junior')) {
        minYears = 1;
        maxYears = 3;
        experienceYears = 2;
      }
      else if (experience.includes('Mid-level')) {
        minYears = 3;
        maxYears = 5;
        experienceYears = 4;
      }
      else if (experience.includes('Senior')) {
        minYears = 5;
        maxYears = 8;
        experienceYears = 6;
      }
      else if (experience.includes('Lead')) {
        minYears = 8;
        maxYears = 15;
        experienceYears = 10;
      }
      else if (experience.includes('Expert')) {
        minYears = 10;
        maxYears = 99;
        experienceYears = 15;
      }
    }

    // 6. Insert job into database
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: title.trim(),
        description: description.trim(),
        degree_requirement,
        eligibilities,
        skills,
        years_of_experience: experienceYears,
        min_years_experience: minYears,
        max_years_experience: maxYears,
        experience: experience || null,
        location: location || null,
        employment_type: employment_type || null,
        remote: remote || false,
        status: 'active', // New jobs are active by default
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating job:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // 7. Log activity
    try {
      await supabase.rpc('log_job_created', {
        p_user_id: user.id,
        p_job_id: job.id,
        p_metadata: {
          job_title: job.title,
          degree_requirement: job.degree_requirement,
          skills: job.skills,
          eligibilities: job.eligibilities,
          years_of_experience: job.years_of_experience,
          location: job.location,
          employment_type: job.employment_type,
        }
      });
    } catch (logError) {
      console.error('Error logging job creation:', logError);
      // Don't fail the request if logging fails
    }

    // 8. Send notifications
    try {
      // Notify HR user (confirmation of their own action)
      await notifyHR(user.id, {
        type: 'system',
        title: 'Job Posted Successfully',
        message: `Your job posting "${job.title}" has been created and is now active`,
        related_entity_type: 'job',
        related_entity_id: job.id,
        link_url: `/hr/job-management`,
      });

      // Notify all admins that HR created a job
      await notifyAdmins({
        type: 'system',
        title: 'New Job Posted',
        message: `HR user ${profile.role === 'HR' ? 'created' : 'posted'} a new job: "${job.title}"`,
        related_entity_type: 'job',
        related_entity_id: job.id,
        link_url: `/admin/user-management`,
      });
    } catch (notifError) {
      console.error('Error sending job creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Server error in POST /api/jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
