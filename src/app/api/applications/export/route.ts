import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

/**
 * Applications Export API - Download applications list as XLSX
 *
 * GET /api/applications/export - Export all applications to Excel
 * Query params:
 * - job_id: Filter by specific job (optional)
 * - status: Filter by status (pending/approved/denied) (optional)
 *
 * Returns: Excel file with all application data
 */

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

    // 3. Only HR and ADMIN can export applications
    if (profile.role !== 'HR' && profile.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only HR and Admin can export applications' },
        { status: 403 }
      );
    }

    // 4. Parse filters
    const jobId = searchParams.get('job_id');
    const status = searchParams.get('status');

    // 5. Build query
    let query = supabase
      .from('applications')
      .select(`
        id,
        job_id,
        applicant_id,
        status,
        rank,
        match_score,
        created_at,
        jobs:job_id (
          title,
          location
        ),
        applicant_profiles:applicant_profile_id (
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
          profiles:user_id (
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // 6. Execute query
    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 7. Format data for Excel
    const excelData = applications.map((app: any) => {
      const profile = app.applicant_profiles;
      const fullName = `${profile?.first_name || ''} ${profile?.middle_name || ''} ${profile?.surname || ''}`.trim();

      // Format education
      const education = Array.isArray(profile?.education)
        ? profile.education.map((edu: any) =>
            `${edu.level || ''} - ${edu.nameOfSchool || ''} (${edu.periodOfAttendance?.from || ''} - ${edu.periodOfAttendance?.to || ''})`
          ).join('; ')
        : 'N/A';

      // Format eligibilities
      const eligibilities = Array.isArray(profile?.eligibilities)
        ? profile.eligibilities.map((elig: any) => {
            if (typeof elig === 'string') return elig;
            return elig?.eligibilityTitle || elig?.name || String(elig);
          }).join(', ')
        : 'N/A';

      // Format skills
      const skills = Array.isArray(profile?.skills)
        ? profile.skills.join(', ')
        : 'N/A';

      return {
        'Application ID': app.id,
        'Applicant Name': fullName || 'Unknown',
        'Email': profile?.profiles?.email || 'N/A',
        'Phone': profile?.phone_number || profile?.mobile_number || 'N/A',
        'Applied Position': app.jobs?.title || 'Unknown',
        'Location': app.jobs?.location || 'N/A',
        'Status': app.status,
        'Rank': app.rank || 'N/A',
        'Match Score': app.match_score ? `${app.match_score}%` : 'N/A',
        'Highest Educational Attainment': profile?.highest_educational_attainment || 'N/A',
        'Educational Background': education,
        'Eligibilities': eligibilities,
        'Skills': skills,
        'Total Years of Experience': profile?.total_years_experience || 0,
        'Applied Date': new Date(app.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      };
    });

    // 8. Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 30 }, // Application ID
      { wch: 25 }, // Applicant Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Applied Position
      { wch: 20 }, // Location
      { wch: 12 }, // Status
      { wch: 8 },  // Rank
      { wch: 12 }, // Match Score
      { wch: 30 }, // Highest Educational Attainment
      { wch: 50 }, // Educational Background
      { wch: 40 }, // Eligibilities
      { wch: 40 }, // Skills
      { wch: 20 }, // Total Years of Experience
      { wch: 20 }, // Applied Date
    ];
    worksheet['!cols'] = columnWidths;

    // 9. Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 10. Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `JobSync_Applications_${timestamp}.xlsx`;

    // 11. Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Server error in GET /api/applications/export:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
