'use client';
import React from 'react';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange, className = '' }) => {
  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewed', label: 'Interview Scheduled' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'hired', label: 'Hired' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22A555] ${className}`}
    >
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
};
