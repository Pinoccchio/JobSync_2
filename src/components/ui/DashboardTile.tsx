import React from 'react';

interface DashboardTileProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  value,
  icon,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm uppercase font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="text-[#22A555] opacity-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
