import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCertificatePDF, generateCertificateId } from '@/lib/certificates/certificateGenerator';
import type { GenerateCertificateRequest, GenerateCertificateResponse, CertificateData } from '@/types/certificate.types';

/**
 * POST /api/training/certificates/generate
 *
 * Generate training certificate PDF and upload to storage
 *
 * Request Body:
 * - application_id: string (required) - Training application ID
 * - notes: string (optional) - Additional notes to include on certificate
 * - include_qr_code: boolean (optional) - Whether to include QR code for verification
 * - include_signature: boolean (optional) - Whether to include PESO officer signature
 *
 * Response:
 * - success: boolean
 * - certificate_id: string
 * - certificate_url: string (file path in storage)
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' } as GenerateCertificateResponse,
        { status: 401 }
      );
    }

    // 2. Get user profile and check authorization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, signature_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' } as GenerateCertificateResponse,
        { status: 404 }
      );
    }

    // Only PESO and ADMIN can generate certificates
    if (!['PESO', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only PESO and Admin can generate certificates',
        } as GenerateCertificateResponse,
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body: GenerateCertificateRequest = await request.json();
    const { application_id, notes, include_qr_code, include_signature } = body;

    if (!application_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: application_id' } as GenerateCertificateResponse,
        { status: 400 }
      );
    }

    // 4. Fetch training application with program data (JOIN)
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
        status,
        status_history,
        training_completed_at,
        assessment_score,
        attendance_percentage,
        certificate_url,
        certificate_issued_at,
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
          { success: false, error: 'Training application not found' } as GenerateCertificateResponse,
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: fetchError.message } as GenerateCertificateResponse,
        { status: 500 }
      );
    }

    // 5. Validate application status
    if (application.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot generate certificate. Application status is "${application.status}". Must be "completed".`,
        } as GenerateCertificateResponse,
        { status: 400 }
      );
    }

    // 6. Check if certificate already exists
    if (application.certificate_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate already exists for this application. Delete the existing certificate first to regenerate.',
          certificate_url: application.certificate_url,
        } as any,
        { status: 409 }
      );
    }

    // 7. Generate unique certificate ID
    const certificateId = generateCertificateId();

    // 8. Prepare certificate data
    const program = application.training_programs as any;

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Training program data not found' } as GenerateCertificateResponse,
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
        description: program.description,
        duration: program.duration,
        start_date: program.start_date,
        end_date: program.end_date,
        skills_covered: program.skills_covered,
        location: program.location,
      },
      completion: {
        completed_at: application.training_completed_at,
        assessment_score: application.assessment_score,
        attendance_percentage: application.attendance_percentage,
      },
      certification: {
        certificate_id: certificateId,
        issued_at: new Date().toISOString(),
        issued_by: {
          name: profile.full_name,
          title: 'PESO Officer',
          ...(include_signature && profile.signature_url ? { signature_url: profile.signature_url } : {}),
        },
      },
      notes: notes || undefined,
    };

    // 9. Generate PDF
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await generateCertificatePDF(certificateData);
    } catch (pdfError: any) {
      console.error('Error generating PDF:', pdfError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate certificate PDF' } as GenerateCertificateResponse,
        { status: 500 }
      );
    }

    // 10. Upload to Supabase Storage (certificates bucket)
    const fileName = `${certificateId}.pdf`;
    const filePath = `${application.applicant_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Error uploading certificate to storage:', uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to upload certificate: ${uploadError.message}` } as GenerateCertificateResponse,
        { status: 500 }
      );
    }

    // 11. Update training_applications table with status_history tracking
    // First, get current status and status_history
    const currentStatus = application.status;
    const currentHistory = application.status_history || [];

    // Create new status history entry
    const newHistoryEntry = {
      from: currentStatus,
      to: 'certified',
      changed_at: certificateData.certification.issued_at,
      changed_by: user.id,
    };

    // Append to existing history
    const updatedHistory = [...currentHistory, newHistoryEntry];

    // Update application with new status and history
    const { error: updateError } = await supabase
      .from('training_applications')
      .update({
        status: 'certified',
        status_history: updatedHistory,
        certificate_url: filePath,
        certificate_issued_at: certificateData.certification.issued_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    if (updateError) {
      console.error('Error updating training application:', updateError);
      // Try to clean up uploaded file
      await supabase.storage.from('certificates').remove([filePath]);
      return NextResponse.json(
        { success: false, error: `Failed to update application: ${updateError.message}` } as GenerateCertificateResponse,
        { status: 500 }
      );
    }

    // 12. Create notification for applicant
    try {
      await supabase.from('notifications').insert({
        user_id: application.applicant_id,
        type: 'training_status',
        title: 'Certificate Issued!',
        message: `Your certificate for "${program.title}" has been issued by ${profile.full_name} (${profile.role}). You can now download it from your trainings page.`,
        related_entity_type: 'training_application',
        related_entity_id: application_id,
        link_url: '/applicant/trainings',
        is_read: false,
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }

    // 13. Log activity
    try {
      await supabase.rpc('log_training_certificate_issued', {
        p_user_id: user.id,
        p_application_id: application_id,
        p_certificate_id: certificateId,
        p_metadata: {
          program_title: program.title,
          applicant_name: application.full_name,
          issuer_name: profile.full_name,
        },
      });
    } catch (logError) {
      console.error('Error logging certificate issuance:', logError);
      // Don't fail the request if logging fails
    }

    // 14. Return success response
    return NextResponse.json(
      {
        success: true,
        certificate_id: certificateId,
        certificate_url: filePath,
        message: `Certificate ${certificateId} generated successfully for ${application.full_name}`,
      } as GenerateCertificateResponse,
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/training/certificates/generate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' } as GenerateCertificateResponse,
      { status: 500 }
    );
  }
}
