import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCertificatePDF, generateCertificateId } from '@/lib/certificates/certificateGenerator';
import type { CertificateData } from '@/types/certificate.types';

/**
 * POST /api/training/certificates/preview
 *
 * Generate training certificate PDF preview (NOT saved to database/storage)
 * Supports signature loading from private bucket via service role
 *
 * Request Body:
 * - application_id: string (required) - Training application ID
 * - notes: string (optional) - Additional notes to include on certificate
 * - include_signature: boolean (optional) - Whether to include PESO officer signature
 *
 * Response:
 * - PDF blob (application/pdf)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 2. Get user profile with signature
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, signature_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Only PESO and ADMIN can generate certificate previews
    if (!['PESO', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Only PESO and Admin can preview certificates' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const { application_id, notes, include_signature } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: application_id' },
        { status: 400 }
      );
    }

    // 4. Fetch training application with program data
    const { data: application, error: fetchError } = await supabase
      .from('training_applications')
      .select(`
        id,
        applicant_id,
        full_name,
        email,
        phone,
        address,
        highest_education,
        training_programs:program_id (
          id,
          title,
          description,
          duration,
          start_date,
          end_date,
          skills_covered,
          location
        )
      `)
      .eq('id', application_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Training application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 5. Prepare certificate data
    const program = application.training_programs as any;

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Training program data not found' },
        { status: 500 }
      );
    }

    const certificateData: CertificateData = {
      trainee: {
        full_name: application.full_name,
        email: application.email,
        phone: application.phone,
        address: application.address,
        highest_education: application.highest_education,
      },
      program: {
        title: program.title,
        description: program.description || '',
        duration: program.duration,
        start_date: program.start_date,
        end_date: program.end_date,
        skills_covered: program.skills_covered,
        location: program.location,
      },
      completion: {
        completed_at: new Date().toISOString(), // Use current date for preview
        assessment_score: null,
        attendance_percentage: null,
      },
      certification: {
        certificate_id: 'PREVIEW-' + generateCertificateId().split('-').pop(),
        issued_at: new Date().toISOString(),
        issued_by: {
          name: profile.full_name,
          title: 'PESO Officer',
          // Include signature if requested and available
          ...(include_signature && profile.signature_url ? { signature_url: profile.signature_url } : {}),
        },
      },
      notes: notes || undefined,
    };

    // 6. Generate PDF (server-side with signature support)
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await generateCertificatePDF(certificateData);
    } catch (pdfError: any) {
      console.error('Error generating preview PDF:', pdfError);
      return NextResponse.json(
        { success: false, error: `Failed to generate certificate preview: ${pdfError.message}` },
        { status: 500 }
      );
    }

    // 7. Return PDF as blob
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificate-preview-${application.full_name.replace(/\s+/g, '-')}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    console.error('Certificate preview generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
