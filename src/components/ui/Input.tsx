'use client';
import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: LucideIcon;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  prefixIcon: PrefixIcon,
  className = '',
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordInput = type === 'password';

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine actual input type
  const inputType = isPasswordInput ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {PrefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <PrefixIcon className="w-5 h-5" />
          </div>
        )}
        <input
          type={inputType}
          className={`w-full ${PrefixIcon ? 'pl-11' : 'px-4'} ${PrefixIcon ? 'pr-4' : ''} ${!PrefixIcon ? 'px-4' : ''} py-2.5 border-2 border-blue-200 rounded-full focus:outline-none focus:border-[#22A555] transition-colors ${
            error ? 'border-red-500 focus:border-red-500' : ''
          } ${isPasswordInput ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};
