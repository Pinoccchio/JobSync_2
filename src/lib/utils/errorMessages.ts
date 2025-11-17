/**
 * Error Message Translator
 * Converts technical Supabase/database errors into user-friendly messages
 */

export interface UserFriendlyError {
  message: string;
  field?: string; // Optional field name for form-specific errors
}

/**
 * Translates Supabase/database errors into user-friendly messages
 * @param error - The error object from Supabase or other sources
 * @returns User-friendly error message
 */
export function translateError(error: any): UserFriendlyError {
  // If no error, return generic message
  if (!error) {
    return { message: 'An unexpected error occurred. Please try again.' };
  }

  // Extract error message
  const errorMessage = error.message || error.msg || error.error_description || String(error);

  // Convert to lowercase for easier matching
  const lowerMessage = errorMessage.toLowerCase();

  // ==================== AUTHENTICATION ERRORS ====================

  // Duplicate email / User already exists
  if (
    lowerMessage.includes('duplicate key') && lowerMessage.includes('email') ||
    lowerMessage.includes('email already') ||
    lowerMessage.includes('user already registered') ||
    lowerMessage.includes('user with this email already exists') ||
    error.code === '23505' // PostgreSQL unique violation
  ) {
    return {
      message: 'This email is already registered. Please login instead or use a different email.',
      field: 'email'
    };
  }

  // Invalid email format
  if (
    lowerMessage.includes('invalid email') ||
    lowerMessage.includes('email') && lowerMessage.includes('invalid')
  ) {
    return {
      message: 'Please enter a valid email address.',
      field: 'email'
    };
  }

  // Weak password
  if (
    lowerMessage.includes('password') && (
      lowerMessage.includes('weak') ||
      lowerMessage.includes('at least') ||
      lowerMessage.includes('minimum') ||
      lowerMessage.includes('should be')
    )
  ) {
    return {
      message: 'Password must be at least 8 characters long.',
      field: 'password'
    };
  }

  // Invalid credentials / wrong password
  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid credentials') ||
    lowerMessage.includes('wrong password') ||
    lowerMessage.includes('email not confirmed')
  ) {
    return {
      message: 'Invalid email or password. Please check your credentials and try again.',
      field: 'email'
    };
  }

  // Email not confirmed
  if (lowerMessage.includes('email not confirmed')) {
    return {
      message: 'Please verify your email address before logging in. Check your inbox for the confirmation link.'
    };
  }

  // Account inactive
  if (
    lowerMessage.includes('account is inactive') ||
    lowerMessage.includes('user profile not found or inactive')
  ) {
    return {
      message: 'Your account is currently inactive. Please contact support for assistance.'
    };
  }

  // Session expired
  if (
    lowerMessage.includes('session') && (
      lowerMessage.includes('expired') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('not found')
    )
  ) {
    return {
      message: 'Your session has expired. Please login again.'
    };
  }

  // ==================== VALIDATION ERRORS ====================

  // Required field missing
  if (
    lowerMessage.includes('missing required') ||
    lowerMessage.includes('cannot be null') ||
    lowerMessage.includes('required field') ||
    error.code === '23502' // PostgreSQL not-null violation
  ) {
    return {
      message: 'Please fill in all required fields.'
    };
  }

  // Invalid data format
  if (
    lowerMessage.includes('invalid input syntax') ||
    lowerMessage.includes('violates check constraint') ||
    error.code === '23514' // PostgreSQL check violation
  ) {
    return {
      message: 'The data you entered is not in the correct format. Please check and try again.'
    };
  }

  // Value too long
  if (
    lowerMessage.includes('value too long') ||
    lowerMessage.includes('exceeds maximum length')
  ) {
    return {
      message: 'One or more fields exceed the maximum allowed length. Please shorten your input.'
    };
  }

  // ==================== PERMISSION ERRORS ====================

  // Unauthorized
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('not authorized') ||
    error.status === 401
  ) {
    return {
      message: 'You need to be logged in to perform this action. Please login first.'
    };
  }

  // Forbidden / No permission
  if (
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('access denied') ||
    error.status === 403
  ) {
    return {
      message: 'You don\'t have permission to perform this action.'
    };
  }

  // ==================== NETWORK ERRORS ====================

  // Network error
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('failed to fetch') ||
    error.name === 'NetworkError'
  ) {
    return {
      message: 'Network connection error. Please check your internet connection and try again.'
    };
  }

  // Timeout
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out')
  ) {
    return {
      message: 'The request took too long. Please try again.'
    };
  }

  // ==================== SERVER ERRORS ====================

  // Not found
  if (
    lowerMessage.includes('not found') ||
    error.status === 404
  ) {
    return {
      message: 'The requested resource was not found.'
    };
  }

  // Server error
  if (
    lowerMessage.includes('internal server error') ||
    lowerMessage.includes('server error') ||
    error.status === 500
  ) {
    return {
      message: 'A server error occurred. Our team has been notified. Please try again later.'
    };
  }

  // ==================== FILE UPLOAD ERRORS ====================

  // File too large
  if (
    lowerMessage.includes('file') && (
      lowerMessage.includes('too large') ||
      lowerMessage.includes('exceeds') ||
      lowerMessage.includes('maximum size')
    )
  ) {
    return {
      message: 'File size is too large. Please upload a smaller file (max 10MB).'
    };
  }

  // Invalid file type
  if (
    lowerMessage.includes('file') && (
      lowerMessage.includes('type') ||
      lowerMessage.includes('format') ||
      lowerMessage.includes('invalid')
    )
  ) {
    return {
      message: 'Invalid file format. Please upload a supported file type.'
    };
  }

  // ==================== BUSINESS LOGIC ERRORS ====================

  // Capacity full
  if (
    lowerMessage.includes('capacity') ||
    lowerMessage.includes('full') ||
    lowerMessage.includes('no spaces available')
  ) {
    return {
      message: 'This program has reached its maximum capacity. No more applications can be accepted.'
    };
  }

  // ==================== DEFAULT ====================

  // If we have a readable error message, return it (but clean it up)
  if (errorMessage && !errorMessage.includes('null') && errorMessage.length > 0 && errorMessage.length < 200) {
    // Remove technical prefixes
    const cleanMessage = errorMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^PostgreSQL error:\s*/i, '')
      .replace(/^Supabase error:\s*/i, '')
      .replace(/^Database error:\s*/i, '')
      .trim();

    // If cleaned message looks technical, use generic message
    if (
      cleanMessage.includes('PGRST') ||
      cleanMessage.includes('column') ||
      cleanMessage.includes('relation') ||
      cleanMessage.includes('constraint')
    ) {
      return {
        message: 'An error occurred while processing your request. Please try again.'
      };
    }

    // Return cleaned message if it seems user-friendly
    return { message: cleanMessage };
  }

  // Generic fallback
  return {
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  };
}

/**
 * Shorthand function to get just the message string
 */
export function getErrorMessage(error: any): string {
  return translateError(error).message;
}
