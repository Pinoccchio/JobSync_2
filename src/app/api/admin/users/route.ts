import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createAdminUser } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/auth';
import { ActivityLogger } from '@/lib/supabase/activityLogger';
import type { CreateUserRequest, User, UserListResponse, ApiResponse } from '@/types/users';

/**
 * GET /api/admin/users
 * Fetch all users (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Fetch users error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Log activity
    await supabaseAdmin.rpc('log_activity', {
      p_user_id: user.id,
      p_event_type: 'View Users',
      p_event_category: 'user_management',
      p_details: `Viewed user list (${users?.length || 0} users)`,
      p_status: 'success',
    });

    return NextResponse.json<ApiResponse<UserListResponse>>({
      success: true,
      data: {
        users: (users as User[]) || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new admin account (HR, PESO, or ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await request.json();

    // Validate input
    if (!body.email || !body.password || !body.fullName || !body.role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role (cannot create applicants through admin panel)
    if (!['ADMIN', 'HR', 'PESO'].includes(body.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid role. Must be ADMIN, HR, or PESO' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const result = await createAdminUser({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role,
    });

    // Log activity using specialized function
    await ActivityLogger.adminCreateUser(
      user.id,
      result.user.id,
      body.email,
      body.role
    );

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      message: `${body.role} account created successfully`,
      data: result.user as User,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);

    // Log failed attempt
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          await supabaseAdmin.rpc('log_activity', {
            p_user_id: user.id,
            p_event_type: 'Create User',
            p_event_category: 'user_management',
            p_details: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            p_status: 'failed',
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}
