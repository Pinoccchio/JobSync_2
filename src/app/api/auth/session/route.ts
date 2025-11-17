import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/auth/session
 * Get current user session and access token from client-side localStorage
 *
 * IMPORTANT: This endpoint expects the client to send the session data
 * since Supabase client auth is stored in localStorage (not HTTP-only cookies)
 *
 * Client should call like:
 * const session = await supabase.auth.getSession();
 * const response = await fetch('/api/auth/session', {
 *   headers: { 'Authorization': `Bearer ${session.data.session.access_token}` }
 * });
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token provided',
        token: null,
        user: null,
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create Supabase client and verify the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
        token: null,
        user: null,
      }, { status: 401 });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found or account is inactive',
        token: token,
        user: null,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: profile.id,
        email: profile.email || user.email,
        fullName: profile.full_name,
        role: profile.role,
        status: profile.status,
      },
    });
  } catch (error) {
    console.error('GET /api/auth/session error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session',
      token: null,
      user: null,
    }, { status: 500 });
  }
}
