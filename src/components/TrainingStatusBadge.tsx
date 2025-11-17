import React from 'react';
import { getStatusConfig, TrainingStatus } from '@/lib/config/statusConfig';

interface TrainingStatusBadgeProps {
  status: TrainingStatus;
  createdAt?: string;
  className?: string;
  showDate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TrainingStatusBadge: React.FC<TrainingStatusBadgeProps> = ({
  status,
  createdAt,
  className = '',
  showDate = false,
  size = 'md',
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Use centralized status configuration
  const statusConfig = getStatusConfig(status);
  const Icon = statusConfig.icon;
  const config = {
    color: statusConfig.legacyColor || 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Icon,
    label: statusConfig.label,
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.color} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      <span className="font-medium">{config.label}</span>
      {showDate && createdAt && (
        <span className="opacity-75">• {formatDate(createdAt)}</span>
      )}
    </div>
  );
};
