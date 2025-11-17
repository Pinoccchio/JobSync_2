import React from 'react';
import { cn } from '@/lib/utils';
import { getEventConfig } from '@/lib/activityEventConfig';

interface EventIconProps {
  eventType: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Event icon with colored gradient background
 * Automatically selects icon and color based on event type
 */
export const EventIcon: React.FC<EventIconProps> = ({
  eventType,
  size = 'md',
  className
}) => {
  const config = getEventConfig(eventType);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0 shadow-md',
        'bg-gradient-to-br',
        config.gradientColor,
        sizeClasses[size],
        className
      )}
    >
      <IconComponent className={cn('text-white', iconSizes[size])} />
    </div>
  );
};
