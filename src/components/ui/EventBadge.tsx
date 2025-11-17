import React from 'react';
import { Badge, BadgeProps } from './Badge';
import { getEventConfig, type BadgeVariant } from '@/lib/activityEventConfig';

interface EventBadgeProps extends Omit<BadgeProps, 'variant'> {
  eventType: string;
  showIcon?: boolean;
}

/**
 * Smart badge component that automatically selects the appropriate
 * color variant and icon based on the event type
 */
export const EventBadge: React.FC<EventBadgeProps> = ({
  eventType,
  showIcon = true,
  children,
  ...props
}) => {
  const config = getEventConfig(eventType);
  const IconComponent = config.icon;

  return (
    <Badge
      variant={config.badgeVariant as BadgeVariant}
      icon={showIcon ? IconComponent : undefined}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};
