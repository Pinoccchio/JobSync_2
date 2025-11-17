import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInitialStatusHistory } from '@/lib/utils/statusHistory';
import { createNotification, notifyJobCreator, notifyAdmins } from '@/lib/notifications';

/**
 * Application Management API Routes
 *
 * Endpoints:
 * - GET /api/applications - List applications (filtered by user/job/status)
 * - POST /api/applications - Submit application with web-based PDS
 *
 * Database Schema:
 * - applications table: id, job_id, applicant_id, applicant_profile_id, pds_id, status, rank, match_score, created_at
 * - applicant_profiles table: user_id, education, work_experience, eligibilities, skills, etc.
 */

/**
 * Extract applicant data from PDS (web-based forms) with fallback to applicant_profiles (OCR)
 * Prioritizes applicant_pds data since PDF upload feature was removed 2025-01-01
 */
function extractPDSData(pds: any, profile: any) {
  // Extract skills from PDS other_information or fallback to profile
  let skills: string[] = profile?.skills || [];
  if (pds?.other_information?.skills && Array.isArray(pds.other_information.skills)) {
    skills = pds.other_information.skills.map((s: any) => {
      if (typeof s === 'string') return s.trim();
      if (s && s.skillName) return String(s.skillName).trim();
      if (s && s.name) return String(s.name).trim();
      return '';
    }).filter((s: string) => s.length > 0);
  }

  // Extract eligibilities from PDS eligibility array or fallback to profile
  let eligibilities: any[] = profile?.eligibilities || [];
  if (pds?.eligibility && Array.isArray(pds.eligibility)) {
    eligibilities = pds.eligibility.map((e: any) => ({
      eligibilityTitle: e.careerService || e.eligibilityTitle || e.title || e.name || String(e)
    }));
  }

  // Calculate total years of experience from PDS work_experience
  let totalYears = profile?.total_years_experience || 0;
  if (pds?.work_experience && Array.isArray(pds.work_experience)) {
    // Calculate using same logic as ranking API
    totalYears = pds.work_experience.reduce((total: number, work: any) => {
      const fromDateStr = work.periodOfService?.from || work.from;
      const toDateStr = work.periodOfService?.to || work.to;

      if (!fromDateStr || !toDateStr) return total;

      const from = new Date(fromDateStr);
      const to = toDateStr === 'Present' ? new Date() : new Date(toDateStr);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) return total;

      const years = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return total + Math.max(0, years);
    }, 0);
    totalYears = Math.round(totalYears * 10) / 10; // Round to 1 decimal place
  }

  // Extract highest educational attainment from PDS educational_background
  let education = profile?.highest_educational_attainment || 'Not specified';
  if (pds?.educational_background && Array.isArray(pds.educational_background)) {
    const levels: Record<string, number> = {
      'GRADUATE STUDIES': 5,
      'COLLEGE': 4,
      'VOCATIONAL': 3,
      'SECONDARY': 2,
      'ELEMENTARY': 1
    };

    const highest = pds.educational_background.reduce((max: any, current: any) => {
      const currentLevel = levels[current.level?.toUpperCase()] || 0;
      const maxLevel = max ? (levels[max.level?.toUpperCase()] || 0) : 0;
      return currentLevel > maxLevel ? current : max;
    }, null);

    if (highest) {
      education = highest.basicEducationDegreeCourse || highest.course || highest.level;
    }
  }

  return {
    skills,
    eligibilities,
    total_years_experience: totalYears,
    highest_educational_attainment: education,
  };
}

// GET /api/applications - List applications with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 1. Authenticate user
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
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Parse filters
    const jobId = searchParams.get('job_id');
    const applicantId = searchParams.get('applicant_id');
    const status = searchParams.get('status'); // pending, approved, denied

    // 4. Build query based on role
    let query = supabase
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        applicant_profile_id,
        pds_id,
        status,
        status_history,
        rank,
        match_score,
        education_score,
        experience_score,
        skills_score,
        eligibility_score,
        algorithm_used,
        ranking_reasoning,
        algorithm_details,
        reviewed_by,
        reviewed_at,
        notification_sent,
        created_at,
        updated_at,
        matched_skills_count,
        matched_eligibilities_count,
        jobs:job_id (
          id,
          title,
          description,
          degree_requirement,
          eligibilities,
          skills,
          years_of_experience,
          location,
          employment_type,
          status,
          created_at,
          profiles:created_by (
            id,
            full_name,
            role
          )
        ),
        applicant_profiles:applicant_profile_id (
          id,
          user_id,
          surname,
          first_name,
          middle_name,
          phone_number,
          mobile_number,
          education,
          work_experience,
          eligibilities,
          skills,
          total_years_experience,
          highest_educational_attainment,
          ocr_processed,
          profiles:user_id (
            email,
            profile_image_url
          )
        ),
        applicant_pds:pds_id (
          id,
          signature_url,
          signature_uploaded_at,
          educational_background,
          work_experience,
          eligibility,
          other_information
        )
      `)
      .order('created_at', { ascending: false });

    // 5. Apply role-based filtering
    if (profile.role === 'APPLICANT') {
      // Applicants can only see their own applications
      query = query.eq('applicant_id', user.id);
    } else if (profile.role === 'HR') {
      // HR can ONLY see applications for jobs they created
      // First, get job IDs created by this HR user
      const { data: hrJobs, error: hrJobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('created_by', user.id);

      if (hrJobsError) {
        console.error('Error fetching HR jobs:', hrJobsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch HR jobs' },
          { status: 500 }
        );
      }

      const hrJobIds = hrJobs?.map(job => job.id) || [];

      if (hrJobIds.length > 0) {
        // Filter applications to only jobs created by this HR
        query = query.in('job_id', hrJobIds);
      } else {
        // HR has no jobs, return empty array by using impossible condition
        query = query.eq('job_id', '00000000-0000-0000-0000-000000000000');
      }

      // Apply optional filters (only if job belongs to this HR)
      if (jobId && hrJobIds.includes(jobId)) {
        query = query.eq('job_id', jobId);
      }
      if (applicantId) {
        query = query.eq('applicant_id', applicantId);
      }
    } else if (profile.role === 'ADMIN') {
      // ADMIN can see ALL applications across all HRs
      // Apply optional filters
      if (jobId) {
        query = query.eq('job_id', jobId);
      }
      if (applicantId) {
        query = query.eq('applicant_id', applicantId);
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Invalid role' },
        { status: 403 }
      );
    }

    // 6. Apply status filter (available to all roles)
    if (status) {
      query = query.eq('status', status);
    }

    // 7. Execute query
    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 8. Process each application to extract PDS data
    const processedApplications = applications?.map((app: any) => {
      const pds = app.applicant_pds;
      const profile = app.applicant_profiles;

      // Extract data from PDS with fallback to profile
      const extracted = extractPDSData(pds, profile);

      return {
        ...app,
        // Add extracted fields for frontend consumption
        _extracted: extracted,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: processedApplications,
      count: processedApplications?.length || 0,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications - Submit job application
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
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Only applicants can submit applications
    if (profile.role !== 'APPLICANT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only applicants can submit applications' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { job_id, pds_id } = body;

    if (!job_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: job_id' },
        { status: 400 }
      );
    }

    if (!pds_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: pds_id - Please complete your PDS first' },
        { status: 400 }
      );
    }

    // 5. Verify job exists and is active
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // 6. Check for duplicate application (exclude withdrawn and denied applications)
    const { data: existingApplication, error: duplicateError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', job_id)
      .eq('applicant_id', user.id)
      .not('status', 'in', '(withdrawn,denied)')  // Allow reapplication after withdrawal or denial
      .maybeSingle();  // Returns null if no active application exists

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You already have an active application for this job' },
        { status: 400 }
      );
    }

    // 7. Check if applicant_profile exists, create if not
    let applicantProfileId: string;

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('applicant_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      applicantProfileId = existingProfile.id;
    } else {
      // Create basic applicant profile (will be populated later by OCR)
      const { data: newProfile, error: createProfileError } = await supabase
        .from('applicant_profiles')
        .insert({
          user_id: user.id,
          first_name: profile.full_name?.split(' ')[0] || '',
          surname: profile.full_name?.split(' ').slice(1).join(' ') || '',
          // Other fields will be populated by OCR later
          ocr_processed: false,
          ai_processed: false,
        })
        .select('id')
        .single();

      if (createProfileError || !newProfile) {
        console.error('Error creating applicant profile:', createProfileError);
        return NextResponse.json(
          { success: false, error: 'Failed to create applicant profile' },
          { status: 500 }
        );
      }

      applicantProfileId = newProfile.id;
    }

    // 8. Create application
    const currentTimestamp = new Date().toISOString();
    const insertData = {
      job_id,
      applicant_id: user.id,
      applicant_profile_id: applicantProfileId,
      pds_id,
      status: 'pending',
      notification_sent: false,
      // Initialize status_history with the initial "null → pending" transition
      status_history: createInitialStatusHistory('pending', currentTimestamp, user.id),
    };

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert(insertData)
      .select(`
        id,
        job_id,
        applicant_id,
        pds_id,
        status,
        created_at,
        jobs:job_id (
          id,
          title,
          description
        )
      `)
      .single();

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      return NextResponse.json(
        { success: false, error: applicationError.message },
        { status: 500 }
      );
    }

    // 9. Ranking will be triggered manually by HR via "Rank Applicants" button
    // No automatic ranking on submission - HR has full control

    // 10. Send notifications to all relevant parties
    try {
      // Notify applicant of successful submission
      await createNotification(profile.id, {
        type: 'application_status',
        title: 'Application Submitted Successfully',
        message: `Your application for "${job.title}" has been received and is under review.`,
        related_entity_type: 'application',
        related_entity_id: application.id,
        link_url: '/applicant/applications',
      });

      // Notify job creator (HR) of new application
      await notifyJobCreator(jobId, profile.full_name);

      // Notify ADMIN of new application for system monitoring
      await notifyAdmins({
        type: 'system',
        title: 'New Job Application Received',
        message: `${profile.full_name} applied for "${job.title}"`,
        related_entity_type: 'application',
        related_entity_id: application.id,
        link_url: '/hr/scanned-records',
      });
    } catch (notifError) {
      // Log error but don't fail the application submission
      console.error('Error sending notifications:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: application,
      message: `Application submitted successfully for ${job.title}`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Server error in POST /api/applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
