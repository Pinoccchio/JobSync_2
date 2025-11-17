import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * File Storage API Routes
 *
 * Endpoints:
 * - POST /api/storage - Upload file to Supabase Storage
 * - GET /api/storage - Get signed URL for private file access
 *
 * Storage Buckets:
 * - pds-files: PDF files (10MB max, private)
 * - id-images: ID verification images (5MB max, private)
 * - certificates: Training certificates (10MB max, private)
 * - announcements: Announcement images (5MB max, public)
 * - profiles: Profile pictures (2MB max, public)
 */

// Bucket configurations
const BUCKET_CONFIG = {
  'pds-files': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
  },
  'id-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
  },
  'certificates': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  'announcements': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  'profiles': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
};

// POST /api/storage - Upload file
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

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string | null; // Optional subfolder

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!bucket || !BUCKET_CONFIG[bucket as keyof typeof BUCKET_CONFIG]) {
      return NextResponse.json(
        { success: false, error: `Invalid bucket. Must be one of: ${Object.keys(BUCKET_CONFIG).join(', ')}` },
        { status: 400 }
      );
    }

    const config = BUCKET_CONFIG[bucket as keyof typeof BUCKET_CONFIG];

    // 3. Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return NextResponse.json(
        { success: false, error: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // 4. Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed types: ${config.allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // 5. Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid file extension. Allowed: ${config.allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // 6. Generate unique file name to prevent conflicts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${randomString}-${sanitizedFileName}`;

    // 7. Create file path (with optional folder)
    // For private buckets (id-images, pds-files, certificates), always organize by user ID for RLS policies
    let filePath: string;
    if (bucket === 'id-images' || bucket === 'pds-files' || bucket === 'certificates') {
      // Private buckets: enforce user ID folder structure for RLS
      const userFolder = user.id;
      filePath = `${userFolder}/${uniqueFileName}`;
    } else {
      // Public buckets: use optional folder or root
      filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    }

    // 8. Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // 9. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // 10. Get file URL
    // For private buckets, store the path (generate signed URLs on-demand when needed)
    // For public buckets, return the public URL
    let fileUrl = '';

    if (bucket === 'announcements' || bucket === 'profiles') {
      // Public buckets - get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      fileUrl = publicUrlData.publicUrl;
    } else {
      // Private buckets - store the path, not signed URL
      // Signed URLs expire after 1 hour, which breaks OCR processing for older applications
      // We'll generate signed URLs on-demand when needed for viewing/downloading
      fileUrl = filePath;
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        filePath: filePath,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        bucket: bucket,
      },
      message: 'File uploaded successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Server error in POST /api/storage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/storage - Get signed URL for private file
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

    // 2. Get parameters
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600'); // Default 1 hour

    if (!bucket || !path) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: bucket and path' },
        { status: 400 }
      );
    }

    if (!BUCKET_CONFIG[bucket as keyof typeof BUCKET_CONFIG]) {
      return NextResponse.json(
        { success: false, error: `Invalid bucket. Must be one of: ${Object.keys(BUCKET_CONFIG).join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Validate expiry time (max 7 days)
    if (expiresIn < 60 || expiresIn > 604800) {
      return NextResponse.json(
        { success: false, error: 'expiresIn must be between 60 and 604800 seconds (1 minute to 7 days)' },
        { status: 400 }
      );
    }

    // 4. Generate signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Server error in GET /api/storage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/storage - Delete file (for future implementation)
export async function DELETE(request: NextRequest) {
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

    // 2. Get parameters
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: bucket and path' },
        { status: 400 }
      );
    }

    // 3. Delete file
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error: any) {
    console.error('Server error in DELETE /api/storage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
