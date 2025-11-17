import { createClient } from './client';
import { ActivityLogger } from './activityLogger';

/**
 * Singleton Supabase client for all authentication operations
 * Uses cookies for automatic session persistence (via SSR package)
 */
export const supabase = createClient();

// ==================== TYPE DEFINITIONS ====================

export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginResult {
  user: { id: string; email?: string };
  session: { access_token: string; user: { id: string } };
  profile: {
    id: string;
    email: string;
    fullName: string;
    profileImageUrl?: string | null;
    role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT';
    status: 'active' | 'inactive';
    last_login: string | null;
  };
}

export interface SignupResult {
  userId: string;
  profileId: string;
  emailConfirmationSent: boolean;
}

export interface SessionResult {
  user: { id: string; email?: string };
  session: { access_token: string; user: { id: string } };
  profile: {
    id: string;
    email: string;
    fullName: string;
    profileImageUrl?: string | null;
    role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT';
    status: 'active' | 'inactive';
    last_login: string | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT';
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT';
  status: 'active' | 'inactive';
  last_login_at: string | null;
}

// ==================== AUTHENTICATION FUNCTIONS ====================

/**
 * Log in user with email and password
 * Fetches profile data and updates last login timestamp
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult<LoginResult>> {
  try {
    console.log('🔐 Starting login for:', credentials.email);

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return {
        success: false,
        error: authError.message || 'Authentication failed',
      };
    }

    if (!authData.user || !authData.session) {
      console.error('❌ No user or session returned');
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    console.log('✅ Auth successful, fetching profile...');

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('status', 'active')
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError?.message);
      // Clean up auth session if profile doesn't exist or is inactive
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'User profile not found or account is inactive',
      };
    }

    console.log('✅ Profile found, updating last login...');

    // Update last login timestamp
    const { error: updateError } = await supabase.rpc('update_user_last_login', {
      p_user_id: profile.id,
    });

    if (updateError) {
      console.error('⚠️ Failed to update last login:', updateError.message);
      // Don't fail the login process if last login update fails
    }

    // Get updated profile with new last_login timestamp
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();

    const finalProfile = updatedProfile || profile;

    console.log('✅ Login complete for:', finalProfile.full_name);

    // Log successful login activity
    await ActivityLogger.login(
      finalProfile.email || authData.user.email || '',
      finalProfile.id,
      finalProfile.role
    );

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        profile: {
          id: finalProfile.id,
          email: finalProfile.email || authData.user.email || '',
          fullName: finalProfile.full_name,
          profileImageUrl: finalProfile.profile_image_url,
          role: finalProfile.role as 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT',
          status: finalProfile.status as 'active' | 'inactive',
          last_login: finalProfile.last_login_at,
        },
      },
    };
  } catch (error) {
    console.error('❌ Login exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Sign up new user
 * Creates auth user and triggers automatic profile creation via database trigger
 */
export async function signupUser(signupData: SignupData): Promise<AuthResult<SignupResult>> {
  try {
    console.log('📝 Starting signup for:', signupData.email);

    // Create auth user with metadata for trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          full_name: signupData.fullName,
          role: signupData.role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      console.error('❌ Signup auth error:', authError.message);
      return {
        success: false,
        error: authError.message || 'Account creation failed',
      };
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return {
        success: false,
        error: 'User creation failed',
      };
    }

    console.log('✅ User created, verifying profile...');

    // Wait briefly for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify profile was created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not created by trigger:', profileError?.message);
      return {
        success: false,
        error: 'Profile creation failed. Please contact support.',
      };
    }

    console.log('✅ Signup complete, profile ID:', profile.id);

    // Force logout after registration to prevent auto-login
    // User must manually login after registration (INCLOUD pattern)
    await supabase.auth.signOut();
    console.log('🚪 User signed out - must login manually');

    return {
      success: true,
      data: {
        userId: authData.user.id,
        profileId: profile.id,
        emailConfirmationSent: !authData.session, // true if email confirmation required
      },
    };
  } catch (error) {
    console.error('❌ Signup exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed',
    };
  }
}

/**
 * Get current session and validate user profile
 * Call this on app initialization to restore session
 */
export async function getCurrentSession(): Promise<AuthResult<SessionResult>> {
  try {
    console.log('🔍 Checking for existing session...');

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      console.log('ℹ️ No active session found');
      return { success: false, error: 'No active session' };
    }

    console.log('✅ Session found, fetching profile...');

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .eq('status', 'active')
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found or inactive');
      return { success: false, error: 'User profile not found or inactive' };
    }

    console.log('✅ Session validated for:', profile.full_name);

    return {
      success: true,
      data: {
        user: session.user,
        session,
        profile: {
          id: profile.id,
          email: profile.email || session.user.email || '',
          fullName: profile.full_name,
          profileImageUrl: profile.profile_image_url,
          role: profile.role as 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT',
          status: profile.status as 'active' | 'inactive',
          last_login: profile.last_login_at,
        },
      },
    };
  } catch (error) {
    console.error('❌ Session validation exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session validation failed',
    };
  }
}

/**
 * Sign out current user
 * Clears session from localStorage and Supabase
 */
export async function signOut(): Promise<AuthResult<void>> {
  try {
    console.log('🚪 Signing out...');

    // Get user info before signing out for activity logging
    const { data: { session } } = await supabase.auth.getSession();
    let userEmail = session?.user?.email;
    let userId = session?.user?.id;
    let userRole: string | undefined;

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', userId)
        .single();

      if (profile) {
        userEmail = profile.email || userEmail;
        userRole = profile.role;
      }
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out error:', error.message);
      return { success: false, error: error.message };
    }

    // Log successful logout activity
    if (userEmail && userId && userRole) {
      await ActivityLogger.logout(userEmail, userId, userRole);
    }

    console.log('✅ Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResult<void>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email',
    };
  }
}

/**
 * Update password for currently authenticated user
 */
export async function updatePassword(newPassword: string): Promise<AuthResult<void>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update password',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}
