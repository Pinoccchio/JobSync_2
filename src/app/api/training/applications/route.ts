import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getViewableUrl } from '@/lib/supabase/storage';
import { createInitialStatusHistory } from '@/lib/utils/statusHistory';
import { createNotification, notifyAdmins } from '@/lib/notifications';

/**
 * Training Applications Management API Routes
 *
 * Endpoints:
 * - GET /api/training/applications - List training applications
 * - POST /api/training/applications - Submit training application
 *
 * Database Schema:
 * - training_applications table: id, program_id, applicant_id, full_name, email, phone, address,
 *   highest_education, id_image_url, id_image_name, status, reviewed_by, reviewed_at,
 *   notification_sent, submitted_at, created_at, updated_at
 */

// GET /api/training/applications - List training applications
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

    // 3. Parse filters
    const programId = searchParams.get('program_id');
    const status = searchParams.get('status'); // pending, approved, denied

    // 4. Build query based on role
    let query = supabase
      .from('training_applications')
      .select(`
        *,
        training_programs!inner (
          id,
          title,
          duration,
          start_date,
          description,
          location,
          created_at,
          profiles:created_by (
            id,
            full_name,
            role
          )
        ),
        profiles:applicant_id (
          profile_image_url
        )
      `)
      .order('submitted_at', { ascending: false});

    // Role-based filtering
    if (profile.role === 'APPLICANT') {
      // Applicants can only see their own applications
      query = query.eq('applicant_id', user.id);
      console.log('📊 [API] Filtering for APPLICANT:', {
        applicant_id: user.id,
        email: user.email,
      });
    } else if (profile.role === 'PESO') {
      // PESO can only see applications for programs they created
      const { data: pesoPrograms } = await supabase
        .from('training_programs')
        .select('id')
        .eq('created_by', user.id);

      const pesoProgramIds = pesoPrograms?.map(p => p.id) || [];

      if (pesoProgramIds.length > 0) {
        query = query.in('program_id', pesoProgramIds);
        console.log('📊 [API] Filtering for PESO:', {
          peso_user_id: user.id,
          program_count: pesoProgramIds.length,
        });
      } else {
        // PESO has no programs, return empty result
        query = query.eq('program_id', '00000000-0000-0000-0000-000000000000');
        console.log('📊 [API] PESO has no programs, returning empty');
      }
    }
    // ADMIN can see all applications (no additional filter)

    // Apply program filter
    if (programId) {
      query = query.eq('program_id', programId);
      console.log('📊 [API] Program filter applied:', programId);
    }

    // Apply status filter (supports single or comma-separated values)
    if (status && status !== 'all') {
      // Check if comma-separated (multiple statuses)
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        query = query.in('status', statusArray);
        console.log('📊 [API] Status filter (multiple):', statusArray);
      } else {
        // Single status
        query = query.eq('status', status);
        console.log('📊 [API] Status filter (single):', status);
      }
    } else {
      console.log('📊 [API] No status filter - fetching ALL statuses');
    }

    // Execute query
    console.log('📊 [API] Executing training applications query...');
    let { data: applications, error } = await query;

    console.log('📊 [API] Query Results:', {
      success: !error,
      count: applications?.length || 0,
      error: error?.message,
    });

    if (error) {
      console.error('Error fetching training applications:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Debug: Check for missing training_programs relationships
    if (applications && applications.length > 0) {
      const missingPrograms = applications.filter(app => !app.training_programs);
      if (missingPrograms.length > 0) {
        console.warn(`⚠️ ${missingPrograms.length} applications missing training_programs relationship`);

        // Fallback: Fetch programs separately
        const programIds = [...new Set(applications.map(app => app.program_id).filter(Boolean))];
        if (programIds.length > 0) {
          const { data: programs } = await supabase
            .from('training_programs')
            .select(`
              id,
              title,
              duration,
              start_date,
              description,
              location,
              created_at,
              profiles:created_by (
                id,
                full_name,
                role
              )
            `)
            .in('id', programIds);

          if (programs) {
            const programMap = new Map(programs.map(p => [p.id, p]));

            // Enrich applications with program data
            applications = applications.map(app => ({
              ...app,
              training_programs: app.training_programs || programMap.get(app.program_id) || null
            }));

            console.log(`✅ Enriched ${missingPrograms.length} applications with program data`);
          }
        }
      }
    }

    // Generate signed URLs for ID images
    const applicationsWithSignedUrls = await Promise.all(
      (applications || []).map(async (app) => {
        if (app.id_image_url) {
          try {
            // Generate a signed URL that expires in 1 hour
            const signedUrl = await getViewableUrl('id-images', app.id_image_url, 3600);
            return { ...app, id_image_url: signedUrl };
          } catch (error) {
            console.error(`Failed to generate signed URL for application ${app.id}:`, error);
            // Return app with original path if signing fails
            return app;
          }
        }
        return app;
      })
    );

    // Log final applications being returned
    console.log('📊 [API] Final Applications to Return:', applicationsWithSignedUrls.length);
    applicationsWithSignedUrls.forEach((app, index) => {
      console.log(`📊 [API] Application ${index + 1}:`, {
        id: app.id,
        status: app.status,
        program_id: app.program_id,
        program_title: app.training_programs?.title || 'MISSING PROGRAM',
        applicant_id: app.applicant_id,
        certificate_url: app.certificate_url ? 'Present' : 'None',
        completion_status: app.completion_status,
      });
    });

    // Specifically highlight certified applications
    const certifiedApps = applicationsWithSignedUrls.filter(app => app.status === 'certified');
    if (certifiedApps.length > 0) {
      console.log('🎓 [API] Certified Applications Being Returned:', certifiedApps.length);
      certifiedApps.forEach(app => {
        console.log('🎓 [API] Certified App:', {
          id: app.id,
          program: app.training_programs?.title,
          certificate: app.certificate_url ? 'Yes' : 'No',
        });
      });
    } else {
      console.log('⚠️ [API] NO certified applications found in results');
    }

    return NextResponse.json({
      success: true,
      data: applicationsWithSignedUrls,
      count: applicationsWithSignedUrls?.length || 0,
    });

  } catch (error: any) {
    console.error('Server error in GET /api/training/applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/training/applications - Submit training application
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
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Only APPLICANT can submit training applications
    if (profile.role !== 'APPLICANT') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only applicants can submit training applications' },
        { status: 403 }
      );
    }

    // 4. Validate required fields
    const { program_id, full_name, email, phone, address, highest_education, id_image_url, id_image_name } = body;

    if (!program_id || !full_name || !email || !phone || !address || !highest_education || !id_image_url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: program_id, full_name, email, phone, address, highest_education, id_image_url' },
        { status: 400 }
      );
    }

    // 5. Check if program exists and is active
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id, title, status, capacity, enrolled_count')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { success: false, error: 'Training program not found' },
        { status: 404 }
      );
    }

    if (program.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This training program is no longer accepting applications' },
        { status: 400 }
      );
    }

    // 6. Check if program is full
    if (program.enrolled_count >= program.capacity) {
      return NextResponse.json(
        { success: false, error: 'This training program is full' },
        { status: 400 }
      );
    }

    // 7. Check for duplicate application (exclude withdrawn and denied applications)
    const { data: existingApplication } = await supabase
      .from('training_applications')
      .select('id, status')
      .eq('program_id', program_id)
      .eq('applicant_id', user.id)
      .not('status', 'in', '(withdrawn,denied)')  // Allow reapplication after withdrawal or denial
      .maybeSingle();  // Returns null if no active application exists

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You already have an active application for this training program' },
        { status: 400 }
      );
    }

    // 8. Create application
    const currentTimestamp = new Date().toISOString();
    const { data: application, error: createError } = await supabase
      .from('training_applications')
      .insert({
        program_id,
        applicant_id: user.id,
        full_name,
        email,
        phone: phone.replace(/\s/g, ''), // Strip all spaces to ensure clean storage
        address,
        highest_education,
        id_image_url,
        id_image_name: id_image_name || 'id-image.jpg',
        status: 'pending',
        submitted_at: currentTimestamp,
        // Initialize status_history with the initial "null → pending" transition
        status_history: createInitialStatusHistory('pending', currentTimestamp, user.id),
      })
      .select(`
        *,
        training_programs:program_id (
          id,
          title,
          duration,
          start_date
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating training application:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    // 9. Log activity
    try {
      await supabase.rpc('log_training_application_submitted', {
        p_applicant_id: user.id,
        p_application_id: application.id,
        p_program_id: program_id,
        p_metadata: {
          program_title: program.title,
          applicant_name: full_name,
          submitted_at: application.submitted_at,
        }
      });
    } catch (logError) {
      console.error('Error logging training application:', logError);
      // Don't fail the request if logging fails
    }

    // 10. Send notifications to all relevant parties
    try {
      // Notify applicant of successful submission
      await createNotification(user.id, {
        type: 'training_status',
        title: 'Training Application Submitted',
        message: `Your application for "${program.title}" has been received and will be reviewed soon.`,
        related_entity_type: 'training_application',
        related_entity_id: application.id,
        link_url: '/applicant/trainings',
      });

      // Notify PESO officer who created the program
      if (program.created_by) {
        await createNotification(program.created_by, {
          type: 'training_status',
          title: 'New Training Application',
          message: `${full_name} applied for "${program.title}"`,
          related_entity_type: 'training_application',
          related_entity_id: application.id,
          link_url: '/peso/applications',
        });
      }

      // Notify ADMIN of new training application for system monitoring
      await notifyAdmins({
        type: 'system',
        title: 'New Training Application',
        message: `${full_name} applied for "${program.title}"`,
        related_entity_type: 'training_application',
        related_entity_id: application.id,
        link_url: '/peso/applications',
      });
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        data: application,
        message: 'Training application submitted successfully',
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/training/applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
