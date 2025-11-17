/**
 * Date Formatting Utilities
 *
 * Shared functions for consistent date formatting across the application
 */

/**
 * Format a date string to a relative time string (e.g., "3 days ago", "2 weeks ago")
 * @param dateString - ISO date string
 * @returns Formatted relative date string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears === 1) return '1 year ago';
  return `${diffYears} years ago`;
}

/**
 * Format a date string to full date with time (e.g., "January 15, 2025 at 10:30 AM")
 * @param dateString - ISO date string
 * @returns Formatted full date and time string
 */
export function formatFullDateTime(dateString: string): string {
  const date = new Date(dateString);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Format a date string to short date (e.g., "Jan 15, 2025")
 * @param dateString - ISO date string
 * @returns Formatted short date string
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get creator display information with name, role, and date
 * @param creator - Creator object with full_name and role
 * @param createdAt - ISO date string of creation
 * @returns Formatted creator display string
 */
export function getCreatorDisplay(
  creator: { full_name: string; role: string } | null | undefined,
  createdAt: string
): { name: string; role: string; date: string; fullText: string } {
  if (!creator) {
    return {
      name: 'Unknown',
      role: 'N/A',
      date: formatShortDate(createdAt),
      fullText: `Unknown • ${formatShortDate(createdAt)}`,
    };
  }

  return {
    name: creator.full_name,
    role: creator.role,
    date: formatShortDate(createdAt),
    fullText: `${creator.full_name} (${creator.role}) • ${formatShortDate(createdAt)}`,
  };
}

/**
 * Get creator display for tooltips with full details
 * @param creator - Creator object with full_name and role
 * @param createdAt - ISO date string of creation
 * @returns Formatted tooltip text
 */
export function getCreatorTooltip(
  creator: { full_name: string; role: string } | null | undefined,
  createdAt: string
): string {
  if (!creator) {
    return `Created on ${formatFullDateTime(createdAt)}`;
  }

  return `Created by ${creator.full_name} (${creator.role}) on ${formatFullDateTime(createdAt)}`;
}

/**
 * Format a date-only string (YYYY-MM-DD) for display without timezone conversion
 * IMPORTANT: This function keeps dates as-is without any timezone conversion.
 * Use this for date-only fields (birthdate, graduation date, etc.) to prevent
 * timezone bugs where dates shift by one day.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns The date string as-is, or 'N/A' if invalid
 *
 * @example
 * formatDateOnly('2025-11-01') // Returns: '2025-11-01'
 * formatDateOnly('') // Returns: 'N/A'
 * formatDateOnly(undefined) // Returns: 'N/A'
 */
export function formatDateOnly(dateString: string | undefined | null): string {
  // Return N/A for empty/null/undefined values
  if (!dateString || dateString.trim() === '') {
    return 'N/A';
  }

  // If already in YYYY-MM-DD format, return as-is (no timezone conversion!)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Fallback: return the original string for other formats
  return dateString;
}
