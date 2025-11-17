'use client';
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import {
  Home,
  Briefcase,
  ClipboardList,
  FileText,
  Settings,
  Megaphone,
  GraduationCap,
  BarChart3,
  Users,
  Activity,
  Database,
  Pen
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  role: 'Admin' | 'HR' | 'PESO' | 'Applicant';
  userName?: string;
  pageTitle?: string;
  pageDescription?: string;
}

const ADMIN_MENU_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { label: 'User Management', href: '/admin/user-management', icon: Users },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  { label: 'Audit Trail', href: '/admin/audit-trail', icon: Database },
];

const HR_MENU_ITEMS = [
  { label: 'Dashboard', href: '/hr/dashboard', icon: Home },
  { label: 'Extracted and Ranked PDS Record', href: '/hr/ranked-records', icon: BarChart3 },
  { label: 'Scanned PDS Records Management', href: '/hr/scanned-records', icon: FileText },
  { label: 'Job Management', href: '/hr/job-management', icon: Briefcase },
  { label: 'Announcements', href: '/hr/announcements', icon: Megaphone },
];

const PESO_MENU_ITEMS = [
  { label: 'Dashboard', href: '/peso/dashboard', icon: Home },
  { label: 'Training Applications', href: '/peso/applications', icon: ClipboardList },
  { label: 'Training Programs', href: '/peso/programs', icon: GraduationCap },
  { label: 'Digital Signature', href: '/peso/digital-signature', icon: Pen },
];

const APPLICANT_MENU_ITEMS = [
  { label: 'Dashboard', href: '/applicant/dashboard', icon: Home },
  { label: 'Jobs', href: '/applicant/jobs', icon: Briefcase },
  { label: 'Trainings', href: '/applicant/trainings', icon: GraduationCap },
  { label: 'Announcements', href: '/applicant/announcements', icon: Megaphone },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  role,
  userName = 'Admin',
  pageTitle,
  pageDescription
}) => {
  // Manage sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems =
    role === 'Admin' ? ADMIN_MENU_ITEMS :
    role === 'HR' ? HR_MENU_ITEMS :
    role === 'PESO' ? PESO_MENU_ITEMS :
    APPLICANT_MENU_ITEMS;

  const userRole =
    role === 'Admin' ? 'System Admin' :
    role === 'HR' ? 'HR Admin' :
    role === 'PESO' ? 'PESO Admin' :
    'Applicant';

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        menuItems={menuItems}
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        <TopNav
          userRole={userRole}
          userName={userName}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
