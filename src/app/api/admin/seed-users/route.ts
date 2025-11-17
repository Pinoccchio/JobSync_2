import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createAdminUser } from '@/lib/supabase/admin';
import { ActivityLogger } from '@/lib/supabase/activityLogger';
import type { ApiResponse } from '@/types/users';

/**
 * POST /api/admin/seed-users
 * Creates seed data for testing the user management system
 *
 * Creates:
 * - 1 ADMIN user
 * - 2 HR users (1 active, 1 inactive)
 * - 2 PESO users (1 active, 1 inactive)
 * - 5 APPLICANT users
 *
 * IMPORTANT: This is for development/testing only!
 * Should be disabled in production.
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Seed data definitions
    const seedUsers = [
      // 1 Additional ADMIN (for testing admin restrictions)
      {
        email: 'admin.test@jobsync.gov',
        password: 'Admin123!@#',
        fullName: 'Admin Test User',
        role: 'ADMIN' as const,
        phone: '+63 917 123 4567',
        status: 'active' as const
      },

      // 2 HR Users
      {
        email: 'hr.active@jobsync.gov',
        password: 'HRActive123!',
        fullName: 'Maria Santos',
        role: 'HR' as const,
        phone: '+63 917 234 5678',
        status: 'active' as const
      },
      {
        email: 'hr.inactive@jobsync.gov',
        password: 'HRInactive123!',
        fullName: 'Juan Reyes',
        role: 'HR' as const,
        phone: '+63 917 345 6789',
        status: 'inactive' as const
      },

      // 2 PESO Users
      {
        email: 'peso.active@jobsync.gov',
        password: 'PESOActive123!',
        fullName: 'Rosa Garcia',
        role: 'PESO' as const,
        phone: '+63 917 456 7890',
        status: 'active' as const
      },
      {
        email: 'peso.inactive@jobsync.gov',
        password: 'PESOInactive123!',
        fullName: 'Pedro Cruz',
        role: 'PESO' as const,
        phone: '+63 917 567 8901',
        status: 'inactive' as const
      },

      // 5 APPLICANT Users
      {
        email: 'applicant1@example.com',
        password: 'Applicant123!',
        fullName: 'Ana Dela Cruz',
        role: 'APPLICANT' as const,
        phone: '+63 917 678 9012',
        status: 'active' as const
      },
      {
        email: 'applicant2@example.com',
        password: 'Applicant123!',
        fullName: 'Carlos Mendoza',
        role: 'APPLICANT' as const,
        phone: '+63 917 789 0123',
        status: 'active' as const
      },
      {
        email: 'applicant3@example.com',
        password: 'Applicant123!',
        fullName: 'Elena Fernandez',
        role: 'APPLICANT' as const,
        phone: '+63 917 890 1234',
        status: 'active' as const
      },
      {
        email: 'applicant4@example.com',
        password: 'Applicant123!',
        fullName: 'Roberto Tan',
        role: 'APPLICANT' as const,
        phone: null,
        status: 'inactive' as const
      },
      {
        email: 'applicant5@example.com',
        password: 'Applicant123!',
        fullName: 'Sofia Lim',
        role: 'APPLICANT' as const,
        phone: '+63 917 012 3456',
        status: 'active' as const
      },
    ];

    const createdUsers = [];
    const errors = [];

    // Create each user
    for (const userData of seedUsers) {
      try {
        // Check if user already exists
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', userData.email)
          .single();

        if (existing) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create user (only ADMIN, HR, PESO can use createAdminUser)
        if (userData.role === 'ADMIN' || userData.role === 'HR' || userData.role === 'PESO') {
          const result = await createAdminUser({
            email: userData.email,
            password: userData.password,
            fullName: userData.fullName,
            role: userData.role,
          });

          // Update phone and status if needed
          if (userData.phone || userData.status === 'inactive') {
            await supabaseAdmin
              .from('profiles')
              .update({
                phone: userData.phone,
                status: userData.status,
              })
              .eq('id', result.user.id);
          }

          // Log creation
          await ActivityLogger.adminCreateUser(
            user.id,
            result.user.id,
            userData.email,
            userData.role
          );

          createdUsers.push({
            email: userData.email,
            role: userData.role,
            id: result.user.id
          });
        } else {
          // For APPLICANT role, create directly (they don't use createAdminUser)
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              full_name: userData.fullName,
              role: userData.role,
            },
          });

          if (authError) throw authError;

          // Wait for trigger to create profile
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Update profile with additional data
          await supabaseAdmin
            .from('profiles')
            .update({
              phone: userData.phone,
              status: userData.status,
              full_name: userData.fullName,
              role: userData.role,
            })
            .eq('id', authData.user!.id);

          createdUsers.push({
            email: userData.email,
            role: userData.role,
            id: authData.user!.id
          });
        }

        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`Failed to create ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log the seeding activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_email: profile.email,
        user_role: profile.role,
        event_type: 'seed_users',
        event_category: 'system',
        details: `Seeded ${createdUsers.length} test users for development`,
        status: 'success',
        metadata: { created_count: createdUsers.length, error_count: errors.length },
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Successfully created ${createdUsers.length} users${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      data: {
        created: createdUsers,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('POST /api/admin/seed-users error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Failed to seed users' },
      { status: 500 }
    );
  }
}
