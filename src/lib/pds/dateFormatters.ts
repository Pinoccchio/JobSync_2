/**
 * Date Formatting Utilities for PDS Excel Export
 * Converts between database formats and CSC-required formats
 */

/**
 * Convert ISO date string to CSC format (dd/mm/yyyy)
 * @param isoDate - ISO date string (e.g., "2025-01-14" or "2025-01-14T10:30:00Z")
 * @returns Formatted date string (e.g., "14/01/2025") or empty string if invalid
 */
export function formatDateForCSC(isoDate: string | undefined | null): string {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Convert ISO date to year only (for educational background)
 * @param isoDate - ISO date string or year string
 * @returns Year as string (e.g., "2020") or empty string
 */
export function formatYearForCSC(isoDate: string | undefined | null): string {
  if (!isoDate) return '';

  // If it's already a year (4 digits), return it
  if (/^\d{4}$/.test(isoDate)) {
    return isoDate;
  }

  try {
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      return '';
    }

    return String(date.getFullYear());
  } catch (error) {
    return '';
  }
}

/**
 * Format date range for CSC (e.g., work experience periods)
 * @param from - Start date (ISO format)
 * @param to - End date (ISO format) or "Present"
 * @returns Object with formatted from and to dates
 */
export function formatDateRangeForCSC(
  from: string | undefined | null,
  to: string | 'Present' | undefined | null
): { from: string; to: string } {
  return {
    from: formatDateForCSC(from),
    to: to === 'Present' ? 'Present' : formatDateForCSC(to),
  };
}

/**
 * Format month and year (for some PDS sections)
 * @param isoDate - ISO date string
 * @returns Formatted string (e.g., "January 2025")
 */
export function formatMonthYearForCSC(isoDate: string | undefined | null): string {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      return '';
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Validate if a date string is in valid ISO format
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidISODate(dateString: string | undefined | null): boolean {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Get current date in CSC format
 * @returns Current date as dd/mm/yyyy
 */
export function getCurrentDateCSC(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format number of hours (for training/voluntary work)
 * @param hours - Number of hours
 * @returns Formatted string or empty if invalid
 */
export function formatHours(hours: number | undefined | null): string {
  if (hours === undefined || hours === null || isNaN(hours)) {
    return '';
  }

  return String(hours);
}

/**
 * Format salary for work experience
 * @param salary - Monthly salary
 * @returns Formatted string with peso sign or empty
 */
export function formatSalary(salary: number | undefined | null): string {
  if (salary === undefined || salary === null || isNaN(salary)) {
    return '';
  }

  // Format with thousand separators
  return `₱${salary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format height (meters to cm for display)
 * @param heightInMeters - Height in meters (e.g., 1.75)
 * @returns Formatted string (e.g., "175 cm")
 */
export function formatHeight(heightInMeters: number | undefined | null): string {
  if (heightInMeters === undefined || heightInMeters === null || isNaN(heightInMeters)) {
    return '';
  }

  // Convert to cm and round
  const cm = Math.round(heightInMeters * 100);
  return `${cm}`;
}

/**
 * Format weight
 * @param weightInKg - Weight in kilograms
 * @returns Formatted string (e.g., "70 kg")
 */
export function formatWeight(weightInKg: number | undefined | null): string {
  if (weightInKg === undefined || weightInKg === null || isNaN(weightInKg)) {
    return '';
  }

  return `${weightInKg}`;
}
