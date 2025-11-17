'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { sendPasswordResetEmail } from '@/lib/supabase/auth';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Validation function
  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await sendPasswordResetEmail(email);

      if (result.success) {
        setEmailSent(true);
        showToast('Password reset email sent! Please check your inbox.', 'success');
      } else {
        setError(result.error || 'Failed to send password reset email');
        showToast(result.error || 'Failed to send password reset email', 'error');
      }
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      setError('An unexpected error occurred. Please try again.');
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

      {/* Forgot Password Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md mx-4">
        {!emailSent ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-full flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600 text-sm">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  onBlur={(e) => setError(validateEmail(e.target.value))}
                  error={error}
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
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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
                <Mail className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555]"
                >
                  Send Again
                </Button>
                <Link
                  href="/login"
                  className="text-sm text-[#22A555] hover:text-[#1A7F3E] font-medium inline-flex items-center justify-center gap-2 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
