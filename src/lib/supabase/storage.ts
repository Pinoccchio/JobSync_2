import { createClient } from './server';

/**
 * Generate a signed URL for accessing a private file in Supabase Storage
 *
 * @param bucket - The storage bucket name (e.g., 'pds-files', 'id-images')
 * @param filePath - The file path within the bucket (e.g., 'user-id/filename.pdf')
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
 * @returns The signed URL that provides temporary access to the file
 *
 * @example
 * ```typescript
 * // Generate 1-hour signed URL for viewing PDS
 * const url = await getSignedUrlForFile('pds-files', 'user-123/document.pdf');
 *
 * // Generate 7-day signed URL for long-term access
 * const longTermUrl = await getSignedUrlForFile('pds-files', 'user-123/document.pdf', 604800);
 * ```
 */
export async function getSignedUrlForFile(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  // Validate expiry time (1 minute to 7 days)
  if (expiresIn < 60 || expiresIn > 604800) {
    throw new Error('expiresIn must be between 60 and 604800 seconds (1 minute to 7 days)');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('No signed URL returned from Supabase');
  }

  return data.signedUrl;
}

/**
 * Generate signed URLs for multiple files in batch
 * Useful when displaying a list of files that need temporary access URLs
 *
 * @param bucket - The storage bucket name
 * @param filePaths - Array of file paths
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Array of signed URLs in the same order as filePaths
 *
 * @example
 * ```typescript
 * const paths = ['user-1/file1.pdf', 'user-2/file2.pdf'];
 * const urls = await getSignedUrlsForFiles('pds-files', paths);
 * ```
 */
export async function getSignedUrlsForFiles(
  bucket: string,
  filePaths: string[],
  expiresIn: number = 3600
): Promise<string[]> {
  const supabase = await createClient();

  const urlPromises = filePaths.map(async (filePath) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(`Failed to generate signed URL for ${filePath}:`, error);
      return ''; // Return empty string on error
    }

    return data?.signedUrl || '';
  });

  return Promise.all(urlPromises);
}

/**
 * Check if a value is a storage path or a full URL
 * Used to detect legacy signed URLs vs new storage paths
 *
 * @param filePathOrUrl - The value to check
 * @returns true if it's a full URL, false if it's a storage path
 */
export function isFullUrl(filePathOrUrl: string): boolean {
  return filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://');
}

/**
 * Get a viewable URL for a file, handling both storage paths and full URLs
 * - If it's already a URL (legacy format), return as-is
 * - If it's a path, generate a signed URL
 *
 * @param bucket - The storage bucket name
 * @param filePathOrUrl - Either a storage path or a full URL
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns A viewable URL (either the original URL or a newly generated signed URL)
 *
 * @example
 * ```typescript
 * // Handle both legacy URLs and new paths
 * const viewUrl = await getViewableUrl('pds-files', application.pds_file_url);
 * ```
 */
export async function getViewableUrl(
  bucket: string,
  filePathOrUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  // If it's already a full URL (legacy signed URL), return as-is
  if (isFullUrl(filePathOrUrl)) {
    return filePathOrUrl;
  }

  // It's a storage path - generate signed URL
  return getSignedUrlForFile(bucket, filePathOrUrl, expiresIn);
}
