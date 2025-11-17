'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔐 Login form submitted');

    // Validate all fields
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);

    // If any errors exist, stop submission
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('✅ Validation passed, calling login...');

      // Login returns the user role directly
      const userRole = await login(formData.email, formData.password);

      console.log('✅ Login successful, role:', userRole);

      showToast('Login successful!', 'success');

      // Direct redirect based on returned role
      const dashboardMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        HR: '/hr/dashboard',
        PESO: '/peso/dashboard',
        APPLICANT: '/applicant/dashboard',
      };

      const dashboardPath = dashboardMap[userRole] || '/applicant/dashboard';
      console.log('➡️ Redirecting to:', dashboardPath);

      // Immediate redirect - no waiting for listener
      router.push(dashboardPath);
    } catch (error: any) {
      console.error('❌ Login error:', error);

      // Translate error to user-friendly message
      const userFriendlyMessage = getErrorMessage(error);
      showToast(userFriendlyMessage, 'error');

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

      {/* Login Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-5xl mx-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Section - Logo & Info */}
          <div className="flex flex-col items-center justify-center text-center">
            <Image
              src="/logo-no-bg.png"
              alt="Municipality of Asuncion Logo"
              width={280}
              height={280}
              className="rounded-full mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">JobSync</h1>
            <p className="text-gray-600 text-sm">
              Municipality of Asuncion<br />
              Davao del Norte
            </p>
          </div>

          {/* Right Section - Login Form */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Login to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  onBlur={(e) => setErrors({ ...errors, email: validateEmail(e.target.value) })}
                  error={errors.email}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
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
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#22A555] hover:text-[#1A7F3E] font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#22A555] to-[#1A7F3E] hover:from-[#1A7F3E] hover:to-[#22A555]"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-[#22A555] hover:text-[#1A7F3E] font-semibold"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
