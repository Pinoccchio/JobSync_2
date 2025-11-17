import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activityLogger';

/**
 * POST /api/profile/picture
 * Upload a new profile picture for the current user
 * Content-Type: multipart/form-data
 * Body: FormData with 'picture' file
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('picture') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Get current profile to find old picture
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single();

    // Delete old profile picture if exists
    if (currentProfile?.profile_image_url) {
      try {
        // Extract file path from URL (e.g., "profiles/user-id/filename.jpg")
        const urlParts = currentProfile.profile_image_url.split('/');
        const bucketIndex = urlParts.findIndex((part) => part === 'profiles');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from('profiles').remove([filePath]);
        }
      } catch (deleteError) {
        // Log but don't fail if old file deletion fails
        console.error('Failed to delete old profile picture:', deleteError);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}.${fileExtension}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload profile picture' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update profile with new image URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, full_name, email, phone, profile_image_url, role, status')
      .single();

    if (updateError) {
      console.error('Error updating profile with image URL:', updateError);
      // Try to clean up uploaded file
      await supabase.storage.from('profiles').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to update profile with new image' },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        userId: user.id,
        eventType: 'profile_picture_updated',
        eventCategory: 'user_management',
        details: 'User uploaded a new profile picture',
        metadata: {
          fileName: fileName,
          fileSize: file.size,
          fileType: file.type,
        },
      });
    } catch (logError) {
      console.error('Failed to log profile picture update:', logError);
    }

    return NextResponse.json(
      {
        message: 'Profile picture uploaded successfully',
        profile: updatedProfile,
        imageUrl: publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/profile/picture:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/picture
 * Remove the current user's profile picture
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current profile to find picture
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.profile_image_url) {
      return NextResponse.json(
        { error: 'No profile picture to delete' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    try {
      const urlParts = currentProfile.profile_image_url.split('/');
      const bucketIndex = urlParts.findIndex((part) => part === 'profiles');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        const { error: deleteError } = await supabase.storage
          .from('profiles')
          .remove([filePath]);

        if (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
          // Continue anyway to remove URL from database
        }
      }
    } catch (parseError) {
      console.error('Error parsing file path:', parseError);
      // Continue anyway to remove URL from database
    }

    // Update profile to remove image URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, full_name, email, phone, profile_image_url, role, status')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove profile picture' },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        userId: user.id,
        eventType: 'profile_picture_deleted',
        eventCategory: 'user_management',
        details: 'User deleted their profile picture',
      });
    } catch (logError) {
      console.error('Failed to log profile picture deletion:', logError);
    }

    return NextResponse.json(
      {
        message: 'Profile picture deleted successfully',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/profile/picture:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
