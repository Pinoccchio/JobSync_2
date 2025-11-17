import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { type EventCategory, getCategoryIcon, getCategoryColor } from '@/lib/activityEventConfig';

interface EventFilterProps {
  category: EventCategory;
  label: string;
  active?: boolean;
  count?: number;
  onToggle?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * Filter chip for event categories
 * Shows category icon, label, and optional count
 */
export const EventFilter: React.FC<EventFilterProps> = ({
  category,
  label,
  active = false,
  count,
  onToggle,
  onRemove,
  className
}) => {
  const IconComponent = getCategoryIcon(category);
  const gradientColor = getCategoryColor(category);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
        'border-2 font-medium text-sm',
        active
          ? 'bg-gradient-to-r ' + gradientColor + ' text-white border-transparent shadow-md scale-105'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm',
        className
      )}
    >
      <IconComponent className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            active
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {count}
        </span>
      )}
      {active && onRemove && (
        <X
          className="w-3.5 h-3.5 ml-1 hover:bg-white/20 rounded-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
};

interface EventFilterGroupProps {
  filters: Array<{
    category: EventCategory;
    label: string;
    count?: number;
    active?: boolean;
  }>;
  onFilterToggle: (category: EventCategory) => void;
  className?: string;
}

/**
 * Group of event filter chips
 */
export const EventFilterGroup: React.FC<EventFilterGroupProps> = ({
  filters,
  onFilterToggle,
  className
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => (
        <EventFilter
          key={filter.category}
          category={filter.category}
          label={filter.label}
          count={filter.count}
          active={filter.active}
          onToggle={() => onFilterToggle(filter.category)}
        />
      ))}
    </div>
  );
};
