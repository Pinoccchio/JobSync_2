'use client';
import React from 'react';
import Image from 'next/image';
import { X, LucideIcon } from 'lucide-react';

type ColorVariant = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'teal' | 'gray';
type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colorVariant?: ColorVariant;
  icon?: LucideIcon;
  useLogoIcon?: boolean;
  size?: SizeVariant;
}

const gradientClasses: Record<ColorVariant, string> = {
  green: 'bg-gradient-to-r from-green-500 to-green-600',
  red: 'bg-gradient-to-r from-red-600 to-red-700',
  orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
  blue: 'bg-gradient-to-r from-blue-600 to-blue-700',
  purple: 'bg-gradient-to-r from-purple-600 to-purple-700',
  teal: 'bg-gradient-to-r from-teal-600 to-teal-700',
  gray: 'bg-gradient-to-r from-gray-600 to-gray-700',
};

const iconColorClasses: Record<ColorVariant, string> = {
  green: 'text-green-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  teal: 'text-teal-600',
  gray: 'text-gray-600',
};

const sizeClasses: Record<SizeVariant, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  colorVariant = 'blue',
  icon: Icon,
  useLogoIcon = false,
  size = 'lg',
}) => {
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className={`${gradientClasses[colorVariant]} p-6 rounded-t-xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                {useLogoIcon ? (
                  <Image
                    src="/JS-logo.png"
                    alt="JobSync"
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                  />
                ) : Icon ? (
                  <Icon className={`w-6 h-6 ${iconColorClasses[colorVariant]}`} />
                ) : null}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-sm text-white/90">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
