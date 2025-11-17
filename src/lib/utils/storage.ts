/**
 * Storage Utilities
 *
 * Helper functions for working with Supabase Storage
 */

/**
 * Extract file path from Supabase storage URL
 *
 * Parses a full Supabase storage URL and extracts just the file path within the bucket.
 *
 * @example
 * // Public bucket URL
 * extractFilePathFromStorageUrl(
 *   'https://ajmftwhmskcvljlfvhjf.supabase.co/storage/v1/object/public/announcements/1761482559916-file.jpg',
 *   'announcements'
 * )
 * // Returns: '1761482559916-file.jpg'
 *
 * @example
 * // Signed URL (private bucket)
 * extractFilePathFromStorageUrl(
 *   'https://ajmftwhmskcvljlfvhjf.supabase.co/storage/v1/object/sign/pds-files/folder/file.pdf?token=xxx',
 *   'pds-files'
 * )
 * // Returns: 'folder/file.pdf'
 *
 * @param url - Full Supabase storage URL (public or signed)
 * @param bucket - Bucket name (e.g., 'announcements', 'pds-files', 'profiles')
 * @returns File path within the bucket, or null if extraction fails
 */
export function extractFilePathFromStorageUrl(url: string | null, bucket: string): string | null {
  if (!url) return null;

  try {
    // Pattern for public URLs: /storage/v1/object/public/{bucket}/{filepath}
    const publicPattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+?)(?:\\?|$)`);
    const publicMatch = url.match(publicPattern);

    if (publicMatch && publicMatch[1]) {
      return decodeURIComponent(publicMatch[1]);
    }

    // Pattern for signed URLs: /storage/v1/object/sign/{bucket}/{filepath}?token=...
    const signedPattern = new RegExp(`/storage/v1/object/sign/${bucket}/(.+?)(?:\\?|$)`);
    const signedMatch = url.match(signedPattern);

    if (signedMatch && signedMatch[1]) {
      return decodeURIComponent(signedMatch[1]);
    }

    // If no pattern matches, log and return null
    console.warn(`Could not extract file path from URL for bucket "${bucket}":`, url);
    return null;
  } catch (error) {
    console.error('Error extracting file path from storage URL:', error);
    return null;
  }
}

/**
 * Delete file from Supabase storage bucket using admin client
 *
 * This function uses the admin client to bypass RLS policies when deleting files.
 * Errors are logged but don't throw - this allows deletion to continue even if
 * the file is already gone or there's a storage issue.
 *
 * @param adminClient - Supabase admin client (with service role key)
 * @param bucket - Storage bucket name
 * @param filePath - File path within the bucket
 * @returns True if deleted successfully, false if error occurred
 */
export async function deleteFileFromStorage(
  adminClient: any,
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    console.log(`Deleting file from storage: ${bucket}/${filePath}`);

    const { error: storageError } = await adminClient.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      console.error(`Error deleting file from ${bucket}:`, storageError);
      return false;
    }

    console.log(`Successfully deleted file: ${bucket}/${filePath}`);
    return true;
  } catch (error) {
    console.error(`Exception while deleting file from ${bucket}:`, error);
    return false;
  }
}
