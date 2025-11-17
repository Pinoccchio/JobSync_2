import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/training/certificates/download
 *
 * Generate a signed URL for downloading a training certificate
 *
 * Request Body:
 * - certificate_url: string (required) - Storage file path (e.g., "user_id/CERT-2025-ASUNCION-ABC123.pdf")
 * - application_id: string (required) - Training application ID for verification
 *
 * Response:
 * - success: boolean
 * - signed_url: string (temporary download URL, expires in 60 seconds)
 * - error?: string
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

    // 2. Parse request body
    const body = await request.json();
    const { certificate_url, application_id } = body;

    if (!certificate_url || !application_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: certificate_url and application_id' },
        { status: 400 }
      );
    }

    // 3. Verify that the user owns this application (security check)
    const { data: application, error: fetchError } = await supabase
      .from('training_applications')
      .select('id, applicant_id, certificate_url, status')
      .eq('id', application_id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { success: false, error: 'Training application not found' },
        { status: 404 }
      );
    }

    // Only allow the applicant to download their own certificate
    if (application.applicant_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only download your own certificates' },
        { status: 403 }
      );
    }

    // Verify certificate exists and status is certified
    if (!application.certificate_url || application.status !== 'certified') {
      return NextResponse.json(
        { success: false, error: 'Certificate not available for this application' },
        { status: 404 }
      );
    }

    // Verify the certificate_url matches
    if (application.certificate_url !== certificate_url) {
      return NextResponse.json(
        { success: false, error: 'Certificate URL mismatch' },
        { status: 400 }
      );
    }

    // 4. Generate signed URL from Supabase Storage (60 seconds expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('certificates')
      .createSignedUrl(certificate_url, 60); // 60 seconds = 1 minute

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate certificate download URL' },
        { status: 500 }
      );
    }

    // 5. Return signed URL
    return NextResponse.json(
      {
        success: true,
        signed_url: signedUrlData.signedUrl,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/training/certificates/download:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
