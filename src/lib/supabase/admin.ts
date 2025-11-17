import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client with service role key
 * USE WITH CAUTION - This client bypasses Row Level Security (RLS)
 * Only use server-side for privileged operations like:
 * - User management (creating admin accounts)
 * - Bulk data operations
 * - System-level queries
 *
 * NEVER expose this client to the browser!
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Creates a new admin client instance
 * Useful for fresh connections in API routes
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Hard delete a user from the system
 * Removes auth user and cascades to profile
 * Audit trail is preserved for historical records
 */
export async function deleteUser(userId: string) {
  try {
    // First, check if user exists in auth
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    // If user doesn't exist, consider it already deleted (idempotent)
    if (getUserError || !existingUser.user) {
      console.warn(`User ${userId} not found in auth, may already be deleted`);

      // Clean up orphaned profile if exists
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      return { success: true };
    }

    // Delete auth user (profile cascade deletes via FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // Handle "Database error loading user" gracefully
      if (error.message.includes('Database error loading user')) {
        console.warn('User may already be deleted:', error.message);

        // Clean up orphaned profile
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        return { success: true };
      }

      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

/**
 * Create a new admin user (HR, PESO, or ADMIN role)
 * Auto-creates profile via handle_new_user trigger
 */
export async function createAdminUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'HR' | 'PESO';
}) {
  try {
    // Create auth user with metadata for trigger
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email (no verification needed)
      user_metadata: {
        full_name: data.fullName,
        role: data.role,
      },
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    // Wait briefly for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch created profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Rollback: delete the auth user if profile wasn't created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Profile creation failed');
    }

    return {
      success: true,
      user: profile,
    };
  } catch (error) {
    console.error('Create admin user error:', error);
    throw error;
  }
}

/**
 * Update user profile data
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string;
    status?: 'active' | 'inactive';
  }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return {
      success: true,
      user: data,
    };
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}
