'use client';
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  label?: string;
  showLastRefresh?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RefreshButton({
  onRefresh,
  label = 'Refresh',
  showLastRefresh = true,
  className,
  size = 'sm'
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size={size}
        icon={RefreshCw}
        iconClassName={isRefreshing ? 'animate-spin' : ''}
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={className}
      >
        {label}
      </Button>
      {showLastRefresh && lastRefresh && (
        <span className="text-xs text-gray-500">
          Updated {formatLastRefresh(lastRefresh)}
        </span>
      )}
    </div>
  );
}
