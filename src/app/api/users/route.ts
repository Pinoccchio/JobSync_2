import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * User Management API Routes
 *
 * TODO: Implement the following endpoints:
 * - GET /api/users - List all users (Admin only)
 * - POST /api/users - Create HR/PESO admin accounts (Admin only)
 * - GET /api/users/[id] - Get user details
 * - PATCH /api/users/[id] - Update user
 * - DELETE /api/users/[id] - Delete user (Admin only)
 * - PATCH /api/users/[id]/status - Activate/deactivate user
 *
 * Required Database Schema:
 * - users table: id, email, full_name, role, status, created_at
 * - Sync with Supabase Auth users
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // TODO: Verify user is Admin
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user || user.user_metadata?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // TODO: Fetch users from database
    // const { data: users, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    return NextResponse.json({
      message: 'User Management API - Coming soon',
      todo: 'Create users table and implement user CRUD operations',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // TODO: Implement admin account creation
    // 1. Verify current user is Admin
    // 2. Validate account data (email, role, password)
    // 3. Create Supabase Auth user using Admin client
    // 4. Insert user record in users table
    // 5. Send welcome email

    // Example using Supabase Admin client:
    // const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    //   email: body.email,
    //   password: body.password,
    //   email_confirm: true,
    //   user_metadata: {
    //     full_name: body.full_name,
    //     role: body.role,
    //   },
    // });

    return NextResponse.json({
      message: 'User creation - Coming soon',
    }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
