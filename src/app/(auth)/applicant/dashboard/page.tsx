'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, Container, RefreshButton, EnhancedTable, Badge } from '@/components/ui';
import { AdminLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Briefcase, Download, Calendar, Users, GraduationCap, Megaphone, Loader2, CheckCircle2, Clock, FileText, Tag, ImageIcon, Eye, Star, XCircle, AlertCircle, Archive, History, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/auth';
import { AnnouncementViewModal } from '@/components/applicant/AnnouncementViewModal';
import { StatusTimeline } from '@/components/hr/StatusTimeline';
import { getStatusConfig } from '@/lib/config/statusConfig';

interface StatusHistoryItem {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

interface DashboardStats {
  activeJobs: number;
  trainingPrograms: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
}

interface RecentApplication {
  id: string;
  position: string;
  type: 'Job Application' | 'Training Application';
  dateApplied: string;
  status: string;
  matchScore?: string;
  statusHistory?: StatusHistoryItem[];
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  published_at: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export default function ApplicantDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    trainingPrograms: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [selectedApplicationForHistory, setSelectedApplicationForHistory] = useState<RecentApplication | null>(null);

  // Track component mount state to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    console.log('📊 Fetching applicant dashboard data...');

    // Only update loading state if component is still mounted
    if (isMounted.current) {
      setLoading(true);
    }
    try {
      // Fetch active jobs count (global stat)
      const activeJobsResponse = await fetch('/api/jobs?status=active');
      const activeJobsData = await activeJobsResponse.json();
      const activeJobs = activeJobsData.count || 0;

      // Fetch active training programs count (global stat)
      const trainingResponse = await fetch('/api/training/programs?status=active');
      const trainingData = await trainingResponse.json();
      const trainingPrograms = trainingData.count || 0;

      // Fetch announcements
      const announcementsResponse = await fetch('/api/announcements?status=active');
      const announcementsData = await announcementsResponse.json();
      const announcements = announcementsData.data || [];

      // Fetch user-specific job applications
      const jobAppsResponse = await fetch('/api/applications');
      const jobAppsData = await jobAppsResponse.json();
      const jobApplications = jobAppsData.data || [];

      // Fetch user-specific training applications
      const trainingAppsResponse = await fetch('/api/training/applications');
      const trainingAppsData = await trainingAppsResponse.json();
      const trainingApplications = trainingAppsData.data || [];

      // Calculate stats based on user's applications
      const totalApplications = jobApplications.length + trainingApplications.length;
      const pendingApplications = jobApplications.filter((app: any) => app.status === 'pending').length +
        trainingApplications.filter((app: any) => app.status === 'pending').length;
      const approvedApplications = jobApplications.filter((app: any) => app.status === 'approved').length +
        trainingApplications.filter((app: any) => ['approved', 'certified', 'completed'].includes(app.status)).length;

      // Combine and format recent applications (last 5)
      const allApplications = [
        ...jobApplications.map((app: any) => ({
          id: app.id,
          position: app.jobs?.title || 'Unknown Position',
          type: 'Job Application' as const,
          dateApplied: app.created_at,
          status: app.status, // Use actual status for accurate display
          matchScore: app.match_score ? `${app.match_score}%` : 'N/A',
          statusHistory: app.status_history || []
        })),
        ...trainingApplications.map((app: any) => ({
          id: app.id,
          position: app.training_programs?.title || 'Unknown Program',
          type: 'Training Application' as const,
          dateApplied: app.submitted_at || app.created_at,
          status: app.status, // Use actual status for accurate display
          matchScore: 'N/A',
          statusHistory: app.status_history || []
        }))
      ];

      // Sort by date and take last 5
      const recentApplications = allApplications
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
        .slice(0, 5);

      // Only update state if component is still mounted
      if (isMounted.current) {
        setStats({
          activeJobs,
          trainingPrograms,
          totalApplications,
          pendingApplications,
          approvedApplications,
        });

        setAnnouncements(announcements.slice(0, 3));
        setRecentApplications(recentApplications);
      }
    } catch (error) {
      console.error('❌ Error fetching applicant dashboard data:', error);
      // Use showToast directly without including it in dependencies to avoid infinite loop
      if (isMounted.current) {
        showToast('Failed to load dashboard data', 'error');
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
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]); // All dependencies to prevent race condition

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'job_opening':
        return Briefcase;
      case 'training':
        return GraduationCap;
      case 'notice':
        return Megaphone;
      default:
        return Users;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_opening':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'training':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'notice':
        return { bg: 'bg-teal-100', text: 'text-teal-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted 1 day ago';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 14) return 'Posted 1 week ago';
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'job_opening': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Table columns for recent applications
  const applicationColumns = [
    {
      header: 'Position/Program',
      accessor: 'position' as const,
      render: (value: string, row: RecentApplication) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.type}</p>
        </div>
      )
    },
    {
      header: 'Date Applied',
      accessor: 'dateApplied' as const,
      render: (value: string) => (
        <span className="text-gray-700">{new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string) => {
        // Use centralized status configuration
        const statusConfig = getStatusConfig(value);
        return <Badge variant={statusConfig.badgeVariant} icon={statusConfig.icon}>{statusConfig.label}</Badge>;
      }
    },
    {
      header: 'Status History',
      accessor: 'id' as const,
      render: (_: any, row: RecentApplication) => {
        const hasHistory = row.statusHistory && row.statusHistory.length > 0;
        return (
          <Button
            variant={hasHistory ? "primary" : "secondary"}
            size="sm"
            icon={History}
            onClick={() => {
              setSelectedApplicationForHistory(row);
              setShowStatusHistoryModal(true);
            }}
            className="text-xs whitespace-nowrap"
          >
            {hasHistory ? `View History (${row.statusHistory?.length || 0})` : 'View Status'}
          </Button>
        );
      }
    },
  ];

  return (
    <AdminLayout
      role="Applicant"
      userName={user?.fullName || 'Applicant'}
      pageTitle="Dashboard"
      pageDescription="Overview of your applications and opportunities"
    >
      <Container size="xl">
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex items-center justify-end">
            <RefreshButton
              onRefresh={fetchDashboardData}
              label="Refresh"
              showLastRefresh={true}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.activeJobs}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Training Programs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.trainingPrograms}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.totalApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.pendingApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.approvedApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Applications Table */}
          <Card title="RECENT APPLICATIONS" headerColor="bg-[#D4F4DD]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading applications...</span>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">No applications yet</p>
                <p className="text-sm text-gray-500 mt-2 mb-4">Start by applying to available jobs and training programs</p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/applicant/jobs">
                    <Button variant="success" icon={Briefcase}>
                      Browse Jobs
                    </Button>
                  </Link>
                  <Link href="/applicant/trainings">
                    <Button variant="primary" icon={GraduationCap}>
                      View Trainings
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <EnhancedTable
                columns={applicationColumns}
                data={recentApplications}
                pageSize={5}
              />
            )}
          </Card>

          {/* Latest Announcements */}
          <Card title="LATEST ANNOUNCEMENTS" headerColor="bg-[#D4F4DD]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading announcements...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">No announcements yet</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for updates</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => handleViewAnnouncement(announcement)}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    {/* Image */}
                    <div className="relative w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300">
                      {announcement.image_url ? (
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {/* Category Badge Overlay */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-md ${getCategoryBadgeColor(announcement.category)}`}>
                          <Tag className="w-3 h-3 inline mr-1" />
                          {formatCategory(announcement.category)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {announcement.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {announcement.description}
                      </p>

                      {/* Metadata */}
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        {/* Published Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(announcement.published_at)}</span>
                        </div>

                        {/* Creator Info */}
                        {announcement.profiles && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">
                                {announcement.profiles.full_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {announcement.profiles.role}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All Button */}
            {!loading && announcements.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Link href="/applicant/announcements">
                  <Button variant="primary" icon={Megaphone} size="md" className="shadow-md hover:shadow-lg transition-shadow">
                    View All Announcements
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Announcement Preview Modal */}
          <AnnouncementViewModal
            isOpen={showAnnouncementModal}
            onClose={() => setShowAnnouncementModal(false)}
            announcement={selectedAnnouncement}
          />

          {/* Status History Modal */}
          {showStatusHistoryModal && selectedApplicationForHistory && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between z-10 shadow-lg rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <History className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Application Status History</h3>
                      <p className="text-sm text-blue-100">Track your application progress</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowStatusHistoryModal(false);
                      setSelectedApplicationForHistory(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Application Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          {selectedApplicationForHistory.position}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedApplicationForHistory.type}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied on: {new Date(selectedApplicationForHistory.dateApplied).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  {selectedApplicationForHistory.statusHistory && selectedApplicationForHistory.statusHistory.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-visible">
                      <StatusTimeline
                        statusHistory={selectedApplicationForHistory.statusHistory}
                        currentStatus={selectedApplicationForHistory.status}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 font-medium">No status changes yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Your application is currently in <span className="font-semibold">{selectedApplicationForHistory.status}</span> status
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end rounded-b-xl">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowStatusHistoryModal(false);
                      setSelectedApplicationForHistory(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </AdminLayout>
  );
}
