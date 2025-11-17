'use client';
import React from 'react';
import { AlertCircle, Clock, Star, CheckCircle, XCircle } from 'lucide-react';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  count?: number;
  statuses: string[];
}

interface QuickFiltersProps {
  activeFilter: string;
  onChange: (filterId: string) => void;
  counts?: {
    needsAction: number;
    inProgress: number;
    approved: number;
    denied: number;
  };
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({ activeFilter, onChange, counts }) => {
  const filters: QuickFilter[] = [
    {
      id: 'all',
      label: 'All Applications',
      icon: AlertCircle,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 hover:bg-gray-200',
      statuses: [],
    },
    {
      id: 'needsAction',
      label: 'Needs Action',
      icon: Clock,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100 hover:bg-orange-200',
      count: counts?.needsAction,
      statuses: ['pending'],
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      icon: Star,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100 hover:bg-blue-200',
      count: counts?.inProgress,
      statuses: ['under_review', 'shortlisted', 'interviewed'],
    },
    {
      id: 'approved',
      label: 'Approved / Hired',
      icon: CheckCircle,
      color: 'text-green-700',
      bgColor: 'bg-green-100 hover:bg-green-200',
      count: counts?.approved,
      statuses: ['approved', 'hired'],
    },
    {
      id: 'denied',
      label: 'Denied',
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-100 hover:bg-red-200',
      count: counts?.denied,
      statuses: ['denied'],
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all
              ${isActive
                ? `${filter.bgColor} ${filter.color} ring-2 ring-offset-1 shadow-md`
                : `bg-white ${filter.color} hover:${filter.bgColor} border border-gray-300`
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span className={`
                ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                ${isActive ? 'bg-white/30' : 'bg-gray-200'}
              `}>
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
