'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout';
import { DashboardTile, Card, Button, Container, RefreshButton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FileText, Clock, XCircle, CheckCircle2, Briefcase, AlertCircle, Activity, Star, Archive, Loader2 } from 'lucide-react';
import { MonthlyApplicantsChart, JobMatchedChart } from '@/components/charts';

interface DashboardStats {
  totalScanned: number;
  pendingReview: number;
  inProgress: number;
  approvedHired: number;
  deniedWithdrawn: number;
  archived: number;
  activeJobs: number;
}

export default function HRDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalScanned: 0,
    pendingReview: 0,
    inProgress: 0,
    approvedHired: 0,
    deniedWithdrawn: 0,
    archived: 0,
    activeJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  // Track component mount state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    console.log('📊 Fetching HR dashboard stats...');

    // Only update loading state if component is still mounted
    if (isMounted.current) {
      setLoading(true);
    }
    try {
      // Fetch stats from API endpoint (properly filtered for HR multi-tenancy)
      const response = await fetch('/api/hr/dashboard/stats');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard stats');
      }

      // Only update state if component is still mounted
      if (isMounted.current) {
        setStats(result.data);
      }
    } catch (error: any) {
      console.error('❌ Error fetching HR dashboard stats:', error);
      // Use showToast directly without including it in dependencies to avoid infinite loop
      if (isMounted.current) {
        showToast(error.message || 'Failed to load dashboard statistics', 'error');
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []); // Empty deps - stable function, auth check moved to useEffect

  // Fetch data when authentication is ready - fixed race condition
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardStats();
    }
  }, [authLoading, isAuthenticated, fetchDashboardStats]); // All dependencies to prevent race condition

  const tiles = [
    {
      title: 'Total Applications',
      value: loading ? '...' : stats.totalScanned.toString(),
      icon: FileText,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Pending Review',
      value: loading ? '...' : stats.pendingReview.toString(),
      icon: Clock,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'In Progress',
      value: loading ? '...' : stats.inProgress.toString(),
      icon: Star,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Approved / Hired',
      value: loading ? '...' : stats.approvedHired.toString(),
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Denied / Withdrawn',
      value: loading ? '...' : stats.deniedWithdrawn.toString(),
      icon: XCircle,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Archived',
      value: loading ? '...' : stats.archived.toString(),
      icon: Archive,
      color: 'from-gray-500 to-gray-600'
    },
    {
      title: 'Active Job Postings',
      value: loading ? '...' : stats.activeJobs.toString(),
      icon: Briefcase,
      color: 'from-teal-500 to-teal-600'
    },
  ];

  return (
    <AdminLayout
      role="HR"
      userName={user?.fullName || 'HR User'}
      pageTitle="Dashboard"
      pageDescription="Overview of hiring statistics and metrics"
    >
      <Container size="xl">
        <div className="space-y-8">
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <RefreshButton
              onRefresh={fetchDashboardStats}
              label="Refresh"
              showLastRefresh={true}
            />
          </div>

          {/* Dashboard Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiles.map((tile, index) => {
              const Icon = tile.icon;
              const bgGradient = tile.color.includes('blue') ? 'from-blue-50 to-blue-100 border-blue-500' :
                               tile.color.includes('orange') ? 'from-orange-50 to-orange-100 border-orange-500' :
                               tile.color.includes('purple') ? 'from-purple-50 to-purple-100 border-purple-500' :
                               tile.color.includes('green') ? 'from-green-50 to-green-100 border-green-500' :
                               tile.color.includes('red') ? 'from-red-50 to-red-100 border-red-500' :
                               tile.color.includes('gray') ? 'from-gray-50 to-gray-100 border-gray-500' :
                               'from-teal-50 to-teal-100 border-teal-500';
              const iconBg = tile.color.includes('blue') ? 'bg-blue-500' :
                            tile.color.includes('orange') ? 'bg-orange-500' :
                            tile.color.includes('purple') ? 'bg-purple-500' :
                            tile.color.includes('green') ? 'bg-[#22A555]' :
                            tile.color.includes('red') ? 'bg-red-500' :
                            tile.color.includes('gray') ? 'bg-gray-500' :
                            'bg-teal-500';

              return (
                <Card key={index} variant="flat" className={`bg-gradient-to-br ${bgGradient} border-l-4 hover:shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tile.title}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {loading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        ) : (
                          tile.value
                        )}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Applicants Chart */}
            <Card title="MONTHLY APPLICANTS" headerColor="bg-[#D4F4DD]" variant="elevated" className="hover:shadow-xl transition-shadow">
              <MonthlyApplicantsChart />
            </Card>

            {/* Applications by Job Chart */}
            <Card title="APPLICATIONS BY JOB" headerColor="bg-[#D4F4DD]" variant="elevated" className="hover:shadow-xl transition-shadow">
              <JobMatchedChart />
            </Card>
          </div>
        </div>
      </Container>
    </AdminLayout>
  );
}
