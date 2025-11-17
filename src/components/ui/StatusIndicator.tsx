import React from 'react';
import { cn } from '@/lib/utils';
import { type EventSeverity } from '@/lib/activityEventConfig';

interface StatusIndicatorProps {
  severity: EventSeverity;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Colored dot indicator with optional pulse animation
 * Shows event severity at a glance
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  severity,
  pulse = false,
  size = 'md',
  label,
  className
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const severityColors = {
    info: 'bg-blue-500',
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const severityRingColors = {
    info: 'ring-blue-500/20',
    low: 'ring-green-500/20',
    medium: 'ring-yellow-500/20',
    high: 'ring-orange-500/20',
    critical: 'ring-red-500/20',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center justify-center p-1">
        <div
          className={cn(
            'rounded-full',
            sizeClasses[size],
            severityColors[severity],
            pulse && 'animate-pulse'
          )}
        />
        {pulse && (
          <div
            className={cn(
              'absolute rounded-full animate-ping',
              sizeClasses[size],
              severityColors[severity],
              'opacity-75'
            )}
          />
        )}
      </div>
      {label && (
        <span className="text-sm text-gray-700 font-medium">{label}</span>
      )}
    </div>
  );
};
