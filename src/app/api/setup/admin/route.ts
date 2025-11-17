import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * One-time setup endpoint to create the system administrator
 * POST /api/setup/admin
 *
 * This should only be called once during initial setup
 */
export async function POST() {
  try {
    const adminEmail = 'jenjiliv@gmail.com';
    const adminPassword = 'adminadmin';

    // Check if admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser?.users?.some(u => u.email === adminEmail);

    if (adminExists) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create admin user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'System Administrator',
        role: 'ADMIN',
      },
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return NextResponse.json(
        { error: 'Failed to create admin user', details: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed - no user data returned' },
        { status: 500 }
      );
    }

    // The profile will be automatically created by the handle_new_user trigger
    // Let's verify it was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        {
          success: true,
          message: 'Admin user created in auth, but profile check failed',
          user: authData.user,
          profileError: profileError.message,
        },
        { status: 201 }
      );
    }

    // Log the admin creation activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: authData.user.id,
      event_type: 'Admin Account Created',
      event_category: 'user_management',
      user_email: adminEmail,
      user_role: 'ADMIN',
      details: 'System administrator account created during initial setup',
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          created_at: authData.user.created_at,
        },
        profile: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error creating admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup/admin
 * Check if admin user exists
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, full_name, status, created_at')
      .eq('email', 'jenjiliv@gmail.com')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { exists: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        exists: true,
        admin: {
          id: data.id,
          email: data.email,
          role: data.role,
          full_name: data.full_name,
          status: data.status,
          created_at: data.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
