'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { updatePassword } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  // Check if we have the required parameters, session, or Supabase errors
  useEffect(() => {
    const validateAccess = async () => {
      // 1. Check for Supabase error parameters first (from failed email link validation)
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (error || errorCode) {
        // Handle Supabase authentication errors
        let errorMessage = 'Invalid or expired password reset link';

        if (errorCode === 'otp_expired') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (errorCode === 'access_denied') {
          errorMessage = 'Access denied. This password reset link is invalid.';
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        }

        showToast(errorMessage, 'error');
        setTimeout(() => router.push('/forgot-password'), 3000);
        return;
      }

      // 2. Check for active session (after successful OTP verification in callback)
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session) {
        // User has active session - allow password reset without URL parameters
        console.log('✅ Active session found, user can reset password');
        return;
      }

      // 3. No session - check for valid token_hash and type parameters in URL
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!tokenHash || type !== 'recovery') {
        showToast('Missing authentication parameters. Please use the link from your email.', 'error');
        setTimeout(() => router.push('/forgot-password'), 3000);
      }
    };

    validateAccess();
  }, [searchParams, router, showToast]);

  // Validation functions
  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
    };

    setErrors(newErrors);

    // If any errors exist, stop submission
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(formData.password);

      if (result.success) {
        setResetComplete(true);
        showToast('Password reset successfully!', 'success');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrors({ ...errors, password: result.error || 'Failed to reset password' });
        showToast(result.error || 'Failed to reset password', 'error');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrors({ ...errors, password: 'An unexpected error occurred. Please try again.' });
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative py-12"
      style={{
        backgroundImage: 'url(/municipal.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Green Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#22A555]/90 to-[#1A7F3E]/90"></div>

      {/* Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Reset Password Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md mx-4">
        {!resetComplete ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-full flex items-center justify-center mb-4">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-600 text-sm">
                Enter your new password below to reset your account password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  onBlur={(e) => setErrors({ ...errors, password: validatePassword(e.target.value) })}
                  error={errors.password}
                  required
                  disabled={isLoading}
                />
                {/* Password Requirements */}
                <div className="mt-2 text-xs text-gray-500">
                  <p>Password must be at least 8 characters</p>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  onBlur={(e) => setErrors({ ...errors, confirmPassword: validateConfirmPassword(e.target.value, formData.password) })}
                  error={errors.confirmPassword}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555]"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              {/* Back to Login */}
              <div className="text-center pt-4">
                <Link
                  href="/login"
                  className="text-sm text-[#22A555] hover:text-[#1A7F3E] font-medium inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Password Reset Successful!
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Redirecting to login page in 3 seconds...
              </p>

              {/* Action */}
              <Link
                href="/login"
                className="w-full"
              >
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555]"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#22A555]/90 to-[#1A7F3E]/90">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
