import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { changePasswordSchema } from '@/lib/validation/profileSchema';
import { logActivity } from '@/lib/supabase/activityLogger';

/**
 * POST /api/profile/password
 * Change the current user's password
 * Body: { currentPassword: string, newPassword: string, confirmPassword: string }
 */
export async function POST(request: NextRequest) {
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
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Verify current password by attempting to sign in
    // This ensures the user knows their current password before changing it
    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);

      // Check for specific error messages
      if (updateError.message.includes('password')) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await logActivity({
        userId: user.id,
        eventType: 'password_changed',
        eventCategory: 'user_management',
        details: 'User changed their password',
        metadata: {
          changedAt: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log password change activity:', logError);
    }

    return NextResponse.json(
      {
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/profile/password:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
