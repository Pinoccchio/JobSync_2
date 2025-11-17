import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication API Routes
 *
 * TODO: Implement the following endpoints:
 * - POST /api/auth/signup - Register new users
 * - POST /api/auth/login - Login (handled by Supabase Auth)
 * - POST /api/auth/logout - Logout (handled by Supabase Auth)
 * - POST /api/auth/reset-password - Password reset
 * - GET /api/auth/verify-email - Email verification
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Authentication API - Coming soon',
    endpoints: [
      'POST /api/auth/signup',
      'POST /api/auth/reset-password',
      'GET /api/auth/verify-email',
    ],
  });
}
