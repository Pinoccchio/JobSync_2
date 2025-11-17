import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        // Basic variants
        default: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
        primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
        success: 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300',
        danger: 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300',
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300',
        teal: 'bg-teal-100 text-teal-800 hover:bg-teal-200 border border-teal-300',
        purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300',
        pending: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300',

        // Semantic action variants
        created: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 shadow-sm',
        activated: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 shadow-sm',
        deactivated: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 shadow-sm',
        deleted: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 shadow-sm',
        updated: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-300 shadow-sm',

        // Status variants
        approved: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-300 shadow-sm',
        denied: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 shadow-sm',
        failed: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-400 shadow-sm bg-stripe-red',

        // Auth variants
        login: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300 shadow-sm',
        logout: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300',

        // Category variants
        system: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300 shadow-sm',
        upload: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-300 shadow-sm',
        security: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-400 shadow-sm',
        notification: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-300 shadow-sm',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon: Icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
