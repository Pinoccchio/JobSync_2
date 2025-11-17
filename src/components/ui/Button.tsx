import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-[#22A555] hover:bg-[#1A7F3E] text-white focus:ring-[#22A555] shadow-sm hover:shadow-md',
        success: 'bg-[#22A555] hover:bg-[#1A7F3E] text-white focus:ring-[#22A555] shadow-sm hover:shadow-md',
        warning: 'bg-[#FDB912] hover:bg-[#E5A810] text-white focus:ring-[#FDB912] shadow-sm hover:shadow-md',
        danger: 'bg-[#DC3545] hover:bg-[#C82333] text-white focus:ring-[#DC3545] shadow-sm hover:shadow-md',
        teal: 'bg-[#20C997] hover:bg-[#1AB386] text-white focus:ring-[#20C997] shadow-sm hover:shadow-md',
        secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500 shadow-sm hover:shadow-md',
        outline: 'border-2 border-[#22A555] text-[#22A555] hover:bg-[#22A555] hover:text-white focus:ring-[#22A555]',
        ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    icon: Icon,
    iconPosition = 'left',
    iconClassName,
    loading = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const iconElement = loading ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : Icon ? (
      <Icon className={cn("w-4 h-4", iconClassName)} />
    ) : null;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {iconPosition === 'left' && iconElement}
        {children}
        {iconPosition === 'right' && iconElement}
      </button>
    );
  }
);

Button.displayName = 'Button';
