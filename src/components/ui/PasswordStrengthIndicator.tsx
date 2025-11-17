'use client';
import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string; icon: any } => {
    if (!pwd) return { score: 0, label: '', color: '', icon: Shield };

    let score = 0;

    // Length checks
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++; // Special characters

    // Determine strength level
    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500', icon: ShieldAlert };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-yellow-500', icon: Shield };
    return { score: 3, label: 'Strong', color: 'bg-green-500', icon: ShieldCheck };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  const Icon = strength.icon;

  const textColor = strength.score === 1 ? 'text-red-600' : strength.score === 2 ? 'text-yellow-600' : 'text-green-600';
  const iconColor = strength.score === 1 ? 'text-red-500' : strength.score === 2 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-sm font-medium ${textColor}`}>
          Password Strength: {strength.label}
        </span>
      </div>
      <div className="flex gap-1">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-gray-200'}`} />
      </div>
    </div>
  );
};
