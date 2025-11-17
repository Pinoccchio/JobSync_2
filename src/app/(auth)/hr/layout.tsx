'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * HR Layout Protection
 * Ensures only authenticated users with HR or ADMIN role can access HR routes
 * Redirects unauthorized users to login or their appropriate dashboard
 */
export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to login
        console.log('🔒 HR route: Not authenticated, redirecting to login');
        router.push('/login');
      } else if (role && role !== 'HR' && role !== 'ADMIN') {
        // Logged in but wrong role - redirect to their dashboard
        console.log(`🔒 HR route: Wrong role (${role}), redirecting to appropriate dashboard`);
        const dashboardMap: Record<string, string> = {
          PESO: '/peso/dashboard',
          APPLICANT: '/applicant/dashboard',
        };
        router.push(dashboardMap[role] || '/applicant/dashboard');
      }
    }
    // Fix: Remove router from dependencies - it's an unstable reference
    // that causes infinite re-renders when included in useEffect deps
  }, [isAuthenticated, isLoading, role]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#22A555] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated or wrong role
  if (!isAuthenticated || (role && role !== 'HR' && role !== 'ADMIN')) {
    return null;
  }

  // Render protected content for HR and ADMIN users
  return <>{children}</>;
}
