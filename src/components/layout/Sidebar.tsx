'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface SidebarProps {
  menuItems: MenuItem[];
  role: 'Admin' | 'HR' | 'PESO' | 'Applicant';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ menuItems, role, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();

  return (
    <div
      className={`bg-gradient-to-b from-[#1A7F3E] to-[#157036] text-white h-screen fixed left-0 top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } flex flex-col shadow-xl z-50`}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
          <span className="text-[#1A7F3E] font-bold text-lg">JS</span>
        </div>
        {!isCollapsed && (
          <div>
            <span className="font-bold text-xl block">JOBSYNC</span>
            <span className="text-xs text-white/70">{role} Portal</span>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 group ${
                isActive
                  ? 'bg-[#22A555] shadow-lg shadow-[#22A555]/20'
                  : 'hover:bg-white/10 hover:translate-x-1'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {Icon && (
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                  }`}
                />
              )}
              {!isCollapsed && (
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/90'}`}>
                  {item.label}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="m-4 p-3 hover:bg-white/10 transition-colors rounded-lg border border-white/10 flex items-center justify-center group"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        ) : (
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        )}
      </button>
    </div>
  );
};
