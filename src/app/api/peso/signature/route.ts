import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/peso/signature
 *
 * Upload PESO officer's digital signature
 *
 * Request: multipart/form-data with 'signature' file
 * Response: { success: boolean, filePath: string, uploadedAt: string }
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

    // 2. Get user profile and verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Only PESO and ADMIN can upload signatures
    if (!['PESO', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only PESO and Admin can upload signatures',
        },
        { status: 403 }
      );
    }

    // 3. Parse form data
    const formData = await request.formData();
    const signatureFile = formData.get('signature') as File;

    if (!signatureFile) {
      return NextResponse.json(
        { success: false, error: 'No signature file provided' },
        { status: 400 }
      );
    }

    // 4. Validate file
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(signatureFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PNG and JPEG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 500KB)
    if (signatureFile.size > 512000) {
      return NextResponse.json(
        { success: false, error: 'Signature file too large (max 500KB)' },
        { status: 400 }
      );
    }

    // 5. Delete existing signature if any
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('signature_url')
      .eq('id', user.id)
      .single();

    if (existingProfile?.signature_url) {
      // Try to delete existing file
      await supabase.storage
        .from('officer-signatures')
        .remove([existingProfile.signature_url]);
    }

    // 6. Upload new signature to Supabase Storage
    const timestamp = Date.now();
    const fileName = `signature-${timestamp}.png`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('officer-signatures')
      .upload(filePath, signatureFile, {
        contentType: signatureFile.type,
        upsert: false, // Don't overwrite
      });

    if (uploadError) {
      console.error('Error uploading signature to storage:', uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to upload signature: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 7. Update profiles table with signature URL
    const uploadedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        signature_url: filePath,
        updated_at: uploadedAt,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);

      // Try to clean up uploaded file
      await supabase.storage
        .from('officer-signatures')
        .remove([filePath]);

      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 8. Return success
    return NextResponse.json(
      {
        success: true,
        filePath: filePath,
        uploadedAt: uploadedAt,
        message: 'Signature uploaded successfully',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Server error in POST /api/peso/signature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/peso/signature
 *
 * Retrieve current PESO officer's signature
 *
 * Response: { success: boolean, signatureUrl: string (signed URL) }
 */
export async function GET() {
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

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, signature_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Check if signature exists
    if (!profile.signature_url) {
      return NextResponse.json(
        { success: true, signatureUrl: null },
        { status: 200 }
      );
    }

    // 4. Generate signed URL (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('officer-signatures')
      .createSignedUrl(profile.signature_url, 3600); // 1 hour

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve signature' },
        { status: 500 }
      );
    }

    // 5. Return signed URL
    return NextResponse.json(
      {
        success: true,
        signatureUrl: signedUrlData.signedUrl,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Server error in GET /api/peso/signature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/peso/signature
 *
 * Delete PESO officer's signature
 *
 * Response: { success: boolean, message: string }
 */
export async function DELETE() {
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

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, signature_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Only PESO and ADMIN can delete signatures
    if (!['PESO', 'ADMIN'].includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Only PESO and Admin can delete signatures',
        },
        { status: 403 }
      );
    }

    // 3. Check if signature exists
    if (!profile.signature_url) {
      return NextResponse.json(
        { success: true, message: 'No signature to delete' },
        { status: 200 }
      );
    }

    // 4. Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('officer-signatures')
      .remove([profile.signature_url]);

    if (deleteError) {
      console.warn('Error deleting signature file:', deleteError);
      // Continue anyway to clear database
    }

    // 5. Clear signature_url in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        signature_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 6. Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Signature deleted successfully',
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Server error in DELETE /api/peso/signature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
