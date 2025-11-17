/**
 * Phone Number Formatting Utility for Philippine Numbers
 *
 * Automatically formats Philippine mobile numbers to international format.
 * Converts: 09123456789 → +639123456789
 */

/**
 * Format a Philippine phone number to international format (+63)
 *
 * @param value - The phone number input (can be in various formats)
 * @returns Formatted phone number with +63 prefix
 *
 * @example
 * formatPhilippinePhone("09123456789") // Returns: "+639123456789"
 * formatPhilippinePhone("9123456789")  // Returns: "+639123456789"
 * formatPhilippinePhone("+639123456789") // Returns: "+639123456789"
 * formatPhilippinePhone("639123456789") // Returns: "+639123456789"
 */
export function formatPhilippinePhone(value: string): string {
  // Remove all non-numeric characters except + at the start
  const hasPlus = value.startsWith('+');
  const cleaned = value.replace(/\D/g, '');

  // If empty, return as-is
  if (!cleaned) {
    return value;
  }

  // Case 1: Starts with 09 (Philippine mobile format) - 11 digits
  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return '+63' + cleaned.substring(1);
  }

  // Case 2: Starts with 9 (missing the leading 0) - 10 digits
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '+63' + cleaned;
  }

  // Case 3: Starts with 63 (already has country code) - 12 digits
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  // Case 4: Already has +63 - verify and return
  if (hasPlus && cleaned.startsWith('63') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  // If none of the patterns match, return the original input
  // This allows partial typing without breaking the input
  return value;
}

/**
 * Validate if a phone number is a valid Philippine mobile number
 *
 * @param value - The phone number to validate
 * @returns True if valid Philippine mobile number format
 *
 * @example
 * isValidPhilippinePhone("+639123456789") // Returns: true
 * isValidPhilippinePhone("09123456789")   // Returns: true
 * isValidPhilippinePhone("123456789")     // Returns: false
 */
export function isValidPhilippinePhone(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');

  // Valid formats:
  // 1. +639XXXXXXXXX (12 digits starting with 63)
  // 2. 09XXXXXXXXX (11 digits starting with 09)
  // 3. 9XXXXXXXXX (10 digits starting with 9)

  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return /^639\d{9}$/.test(cleaned);
  }

  if (cleaned.startsWith('09') && cleaned.length === 11) {
    return /^09\d{9}$/.test(cleaned);
  }

  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return /^9\d{9}$/.test(cleaned);
  }

  return false;
}

/**
 * Format phone number on change event (for React inputs)
 *
 * @param event - React change event
 * @returns Formatted phone number
 */
export function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>): string {
  return formatPhilippinePhone(event.target.value);
}
