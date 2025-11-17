'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as authLoginUser, getCurrentSession, signOut as authSignOut } from '@/lib/supabase/auth';

/**
 * User interface for the application
 */
interface User {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl?: string | null;
}

/**
 * Auth context interface
 * Provides authentication state and methods to all components
 */
interface AuthContextType {
  user: User | null;
  role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<'ADMIN' | 'HR' | 'PESO' | 'APPLICANT'>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'HR' | 'PESO' | 'APPLICANT' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check session ONCE on mount
   * No continuous listeners - follows INCLOUD simplified pattern
   */
  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking session (once on mount)...');
      const result = await getCurrentSession();

      if (result.success && result.data) {
        const mappedUser: User = {
          id: result.data.profile.id,
          email: result.data.profile.email,
          fullName: result.data.profile.fullName,
          profileImageUrl: result.data.profile.profileImageUrl,
        };

        setUser(mappedUser);
        setRole(result.data.profile.role);
        console.log('✅ Session restored:', {
          email: mappedUser.email,
          role: result.data.profile.role
        });
      } else {
        console.log('ℹ️ No active session found');
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run ONCE on mount - no dependencies
  useEffect(() => {
    refreshAuth();
  }, []);

  /**
   * Login function - manual auth state update
   * Returns role for immediate redirect
   */
  const login = async (email: string, password: string): Promise<'ADMIN' | 'HR' | 'PESO' | 'APPLICANT'> => {
    try {
      console.log('🔐 Logging in...');
      const result = await authLoginUser({ email, password });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Login failed');
      }

      // Manually update context state
      const mappedUser: User = {
        id: result.data.profile.id,
        email: result.data.profile.email,
        fullName: result.data.profile.fullName,
        profileImageUrl: result.data.profile.profileImageUrl,
      };

      setUser(mappedUser);
      setRole(result.data.profile.role);

      console.log('✅ Login successful:', {
        email: mappedUser.email,
        role: result.data.profile.role
      });

      // Return role for immediate redirect
      return result.data.profile.role;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  };

  /**
   * Logout function - manual state clear
   */
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      const result = await authSignOut();

      if (!result.success) {
        throw new Error(result.error || 'Logout failed');
      }

      // Manually clear context state
      setUser(null);
      setRole(null);

      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
