import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/notifications';

/**
 * POST /api/auth/notify-registration
 *
 * Notify ADMIN when new user registers
 * Called after successful user registration
 *
 * Request Body:
 * - userId: string (required) - The ID of the newly registered user
 * - fullName: string (required) - User's full name
 * - email: string (required) - User's email
 * - role: string (required) - User's role (APPLICANT, HR, PESO, ADMIN)
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get request body
    const { userId, fullName, email, role } = await request.json();

    // Validate required fields
    if (!userId || !fullName || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, fullName, email, role' },
        { status: 400 }
      );
    }

    // Verify user exists in database (security check)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('User verification failed:', profileError?.message);
      return NextResponse.json(
        { success: false, error: 'User not found - cannot send notification' },
        { status: 404 }
      );
    }

    console.log('📧 Sending registration notification to ADMIN for:', profile.full_name);

    // Send ADMIN notification for system monitoring
    await notifyAdmins({
      type: 'system',
      title: 'New User Registered',
      message: `${profile.full_name} (${profile.email}) registered as ${profile.role}`,
      link_url: '/admin/user-management',
    });

    console.log('✅ Registration notification sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin notification sent successfully',
    });

  } catch (error: any) {
    console.error('❌ Error sending registration notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
