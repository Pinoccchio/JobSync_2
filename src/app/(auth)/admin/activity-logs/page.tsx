'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import {
  Avatar, Card, EnhancedTable, Container, RefreshButton, EventBadge, EventIcon,
  StatusIndicator, EventFilterGroup, ImagePreviewModal
} from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
// import { useTableRealtime } from '@/hooks/useTableRealtime'; // REMOVED: Realtime disabled
import { supabase } from '@/lib/supabase/auth';
import {
  getEventConfig, type EventCategory, type EventSeverity,
  formatEventType, getCategoryIcon
} from '@/lib/activityEventConfig';
import { Activity, Clock, User, AlertTriangle, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  event_type: string;
  event_category: EventCategory;
  user_email: string | null;
  user_role: string | null;
  details: string;
  status: 'success' | 'failed';
  metadata: any;
  timestamp: string;
  profiles?: {
    full_name?: string;
    profile_image_url?: string | null;
  };
}

export default function ActivityLogsPage() {
  const { showToast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(new Set());
  const [activeStatus, setActiveStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [activeSeverity, setActiveSeverity] = useState<Set<EventSeverity>>(new Set());

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>('');

  // Fetch activity logs function
  const fetchActivityLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          event_type,
          event_category,
          user_email,
          user_role,
          details,
          status,
          metadata,
          timestamp,
          profiles:user_id (
            full_name,
            profile_image_url
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      setActivities((data || []) as ActivityLog[]);
      showToast('Activity logs refreshed', 'success');
    } catch (error: any) {
      console.error('Failed to fetch activity logs:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Handle avatar click to show image preview
  const handleAvatarClick = (imageUrl: string | null, userName: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewUserName(userName);
      setShowImagePreview(true);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Filter by category
    if (activeCategories.size > 0) {
      filtered = filtered.filter(log => activeCategories.has(log.event_category));
    }

    // Filter by status
    if (activeStatus !== 'all') {
      filtered = filtered.filter(log => log.status === activeStatus);
    }

    // Filter by severity
    if (activeSeverity.size > 0) {
      filtered = filtered.filter(log => {
        const config = getEventConfig(log.event_type);
        return activeSeverity.has(config.severity);
      });
    }

    setFilteredActivities(filtered);
  }, [activities, activeCategories, activeStatus, activeSeverity]);

  // Fetch activity logs when authentication is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchActivityLogs();
    }
  }, [authLoading, isAuthenticated, fetchActivityLogs]);

  // REMOVED: Real-time subscription disabled for performance
  // useTableRealtime('activity_logs', ['INSERT'], null, () => {
  //   showToast('New activity logged', 'info');
  //   fetchActivityLogs();
  // });

  // Category filter data
  const categoryStats = React.useMemo(() => {
    const stats: Record<EventCategory, number> = {
      auth: 0,
      user_management: 0,
      application: 0,
      job: 0,
      training: 0,
      system: 0,
    };

    activities.forEach(log => {
      stats[log.event_category]++;
    });

    return stats;
  }, [activities]);

  const categoryFilters = [
    { category: 'auth' as EventCategory, label: 'Auth', count: categoryStats.auth, active: activeCategories.has('auth') },
    { category: 'user_management' as EventCategory, label: 'User Management', count: categoryStats.user_management, active: activeCategories.has('user_management') },
    { category: 'job' as EventCategory, label: 'Jobs', count: categoryStats.job, active: activeCategories.has('job') },
    { category: 'application' as EventCategory, label: 'Applications', count: categoryStats.application, active: activeCategories.has('application') },
    { category: 'training' as EventCategory, label: 'Training', count: categoryStats.training, active: activeCategories.has('training') },
    { category: 'system' as EventCategory, label: 'System', count: categoryStats.system, active: activeCategories.has('system') },
  ];

  const handleCategoryToggle = (category: EventCategory) => {
    const newCategories = new Set(activeCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setActiveCategories(newCategories);
  };

  const clearFilters = () => {
    setActiveCategories(new Set());
    setActiveStatus('all');
    setActiveSeverity(new Set());
  };

  // Table columns
  const columns = [
    {
      header: 'Event',
      accessor: 'event_type' as const,
      sortable: true,
      render: (value: string, row: ActivityLog) => {
        const config = getEventConfig(value);
        return (
          <div className="flex items-center gap-3">
            <EventIcon eventType={value} size="sm" />
            <div>
              <EventBadge eventType={value} size="sm" />
              <StatusIndicator
                severity={config.severity}
                size="sm"
                className="mt-1"
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'User',
      accessor: 'user_email' as const,
      sortable: true,
      render: (value: string, row: ActivityLog) => (
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={row.profiles?.profile_image_url}
            userName={row.profiles?.full_name || value || 'System'}
            size="sm"
            onClick={() => handleAvatarClick(row.profiles?.profile_image_url, row.profiles?.full_name || value || 'System')}
            clickable
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{value || 'System'}</p>
            {row.user_role && (
              <p className="text-xs text-gray-500">{row.user_role}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Details',
      accessor: 'details' as const,
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Success</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Failed</span>
            </>
          )}
        </div>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp' as const,
      sortable: true,
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">{date.toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">{date.toLocaleTimeString()}</p>
            </div>
          </div>
        );
      }
    },
  ];

  // Calculate stats
  const stats = {
    total: activities.length,
    successful: activities.filter(a => a.status === 'success').length,
    failed: activities.filter(a => a.status === 'failed').length,
    critical: activities.filter(a => {
      const config = getEventConfig(a.event_type);
      return config.severity === 'critical' || config.severity === 'high';
    }).length,
  };

  return (
    <AdminLayout
      role="Admin"
      userName={user?.fullName || 'System Admin'}
      pageTitle="Activity Logs"
      pageDescription="Monitor system events and user activities with advanced filtering"
    >
      <Container size="xl">
        <div className="space-y-6">
          {/* Header with Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">System Activity Logs</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredActivities.length} of {activities.length} events
              </p>
            </div>
            <RefreshButton onRefresh={fetchActivityLogs} label="Refresh" showLastRefresh={true} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Successful</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.successful}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.failed}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.critical}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="flat" className="bg-white">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {(activeCategories.size > 0 || activeStatus !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Event Category</p>
              <EventFilterGroup
                filters={categoryFilters}
                onFilterToggle={handleCategoryToggle}
              />
            </div>

            {/* Status Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveStatus('all')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    activeStatus === 'all'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  All ({activities.length})
                </button>
                <button
                  onClick={() => setActiveStatus('success')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    activeStatus === 'success'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Success ({stats.successful})
                </button>
                <button
                  onClick={() => setActiveStatus('failed')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    activeStatus === 'failed'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Failed ({stats.failed})
                </button>
              </div>
            </div>
          </Card>

          {/* Activity Logs Table */}
          <Card title="ACTIVITY HISTORY" headerColor="bg-[#D4F4DD]">
            <EnhancedTable
              columns={columns}
              data={filteredActivities}
              searchable
              paginated
              pageSize={10}
              searchPlaceholder="Search by user, event type, or details..."
              getRowColor={(row: ActivityLog) => {
                const config = getEventConfig(row.event_type);
                return config.rowColor || '';
              }}
            />
          </Card>

          {/* Info Card */}
          <Card variant="flat" className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">About Activity Logs</p>
                <p className="text-sm text-gray-600">
                  This page displays all system activities with color-coded events for easy identification.
                  Critical events (deletions, failures) are highlighted in red, warnings in orange,
                  and successful operations in green. Use filters above to narrow down specific event types
                  or categories. Activity logs are retained for 90 days.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={previewImageUrl}
        imageName={`${previewUserName}'s Profile Picture`}
        userName={previewUserName}
      />
    </AdminLayout>
  );
}
