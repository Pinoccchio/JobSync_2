import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/validation/profileSchema';
import { logActivity } from '@/lib/supabase/activityLogger';

/**
 * GET /api/profile
 * Fetch current user's profile information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, profile_image_url, role, status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile information
 * Body: { full_name?, email?, phone? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if email is being changed and if it conflicts with existing users
    if (updates.email && updates.email !== user.email) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', updates.email)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use by another account' },
          { status: 409 }
        );
      }

      // Update email in auth.users as well
      const { error: authUpdateError } = await supabase.auth.updateUser({
        email: updates.email,
      });

      if (authUpdateError) {
        console.error('Error updating auth email:', authUpdateError);
        return NextResponse.json(
          { error: 'Failed to update email in authentication system' },
          { status: 500 }
        );
      }
    }

    // Update profile in database (RLS enforces user can only update own profile)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, full_name, email, phone, profile_image_url, role, status')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        userId: user.id,
        eventType: 'profile_updated',
        eventCategory: 'user_management',
        details: 'User updated their profile information',
        metadata: {
          updatedFields: Object.keys(updates),
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log profile update activity:', logError);
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
