import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'bg-white rounded-lg overflow-hidden transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-md hover:shadow-lg',
        elevated: 'shadow-lg hover:shadow-xl',
        flat: 'shadow-sm hover:shadow-md border border-gray-200',
        interactive: 'shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  title?: string;
  headerColor?: string;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    className,
    title,
    headerColor = 'bg-[#D4F4DD]',
    variant,
    padding,
    noPadding,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding: noPadding ? 'none' : padding }),
          className
        )}
        {...props}
      >
        {title && (
          <div className={cn(
            headerColor,
            'px-6 py-3 font-semibold text-[#1A7F3E] uppercase text-sm'
          )}>
            {title}
          </div>
        )}
        <div className={noPadding || padding === 'none' ? '' : title ? 'p-6' : ''}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
