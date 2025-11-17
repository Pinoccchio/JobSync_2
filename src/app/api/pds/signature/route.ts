import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/pds/signature
 * Upload a signature image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get signature file from form data
    const formData = await request.formData();
    const signatureFile = formData.get('signature') as File;

    if (!signatureFile) {
      return NextResponse.json({ error: 'No signature file provided' }, { status: 400 });
    }

    // Validate file size (500KB max)
    if (signatureFile.size > 512000) {
      return NextResponse.json({
        error: 'Signature file too large (max 500KB)'
      }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(signatureFile.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only PNG and JPEG are allowed.'
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = signatureFile.type.split('/')[1];
    const fileName = `signature-${timestamp}.${extension}`;
    const filePath = `${user.id}/${fileName}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await signatureFile.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pds-signatures')
      .upload(filePath, fileBuffer, {
        contentType: signatureFile.type,
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        error: `Failed to upload signature: ${uploadError.message}`
      }, { status: 500 });
    }

    // Check if PDS record exists, create if not
    const { data: existingPDS, error: checkError } = await supabase
      .from('applicant_pds')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking PDS record:', checkError);
      return NextResponse.json({
        error: 'Failed to check PDS record'
      }, { status: 500 });
    }

    // If PDS doesn't exist, create a basic record
    if (!existingPDS) {
      const { error: insertError } = await supabase
        .from('applicant_pds')
        .insert({
          user_id: user.id,
          signature_url: filePath,
          signature_uploaded_at: new Date().toISOString(),
          completion_percentage: 0,
          is_completed: false,
        });

      if (insertError) {
        console.error('Error creating PDS record:', insertError);
        return NextResponse.json({
          error: `Signature uploaded but failed to create PDS record: ${insertError.message}`
        }, { status: 500 });
      }
    } else {
      // Update existing PDS record with signature URL
      const { error: updateError } = await supabase
        .from('applicant_pds')
        .update({
          signature_url: filePath,
          signature_uploaded_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json({
          error: `Signature uploaded but failed to update record: ${updateError.message}`
        }, { status: 500 });
      }
    }

    // Generate signed URL for immediate display
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pds-signatures')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json({
        error: 'Failed to generate signature URL'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        signatureUrl: signedUrlData.signedUrl,
        filePath,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Signature upload error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET /api/pds/signature
 * Get a signed URL for the user's signature
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get signature path from database
    const { data: pdsData, error: fetchError } = await supabase
      .from('applicant_pds')
      .select('signature_url, signature_uploaded_at')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: 'Failed to fetch signature data'
      }, { status: 500 });
    }

    if (!pdsData?.signature_url) {
      return NextResponse.json({
        error: 'No signature found'
      }, { status: 404 });
    }

    // Generate fresh signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pds-signatures')
      .createSignedUrl(pdsData.signature_url, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json({
        error: 'Failed to generate signature URL'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        signatureUrl: signedUrlData.signedUrl,
        filePath: pdsData.signature_url,
        uploadedAt: pdsData.signature_uploaded_at,
      },
    });

  } catch (error: any) {
    console.error('Signature fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/pds/signature
 * Delete the user's signature from storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get signature path from database
    const { data: pdsData, error: fetchError } = await supabase
      .from('applicant_pds')
      .select('signature_url')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({
        error: 'Failed to fetch signature data'
      }, { status: 500 });
    }

    if (!pdsData?.signature_url) {
      return NextResponse.json({
        error: 'No signature found'
      }, { status: 404 });
    }

    // Delete from storage using admin client (bypasses RLS for cleanup)
    const { error: deleteError } = await adminClient.storage
      .from('pds-signatures')
      .remove([pdsData.signature_url]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return NextResponse.json({
        error: `Failed to delete signature file: ${deleteError.message}`
      }, { status: 500 });
    }

    // Clear signature URL from database
    const { error: updateError } = await supabase
      .from('applicant_pds')
      .update({
        signature_url: null,
        signature_uploaded_at: null,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({
        error: 'Signature deleted but failed to update record'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Signature deleted successfully',
    });

  } catch (error: any) {
    console.error('Signature delete error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
