'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, ApplicationModal, Container, Badge, RefreshButton, ModernModal } from '@/components/ui';
import { AdminLayout } from '@/components/layout';
import { ApplicationStatusBadge, AppliedBadge } from '@/components/ApplicationStatusBadge';
import { StatusTimeline } from '@/components/hr/StatusTimeline';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { getStatusConfig } from '@/lib/config/statusConfig';
// import { useTableRealtime } from '@/hooks/useTableRealtime'; // REMOVED: Realtime disabled
import { Briefcase, MapPin, Clock, CheckCircle2, GraduationCap, Building, FileText, Filter, Loader2, Star, Award, Calendar, TrendingUp, User, CheckCircle, Eye, History, X, Ban, AlertCircle, Search, Mail, Phone, Archive, ArrowRight } from 'lucide-react';
import { formatShortDate, formatRelativeDate, getCreatorTooltip } from '@/lib/utils/dateFormatters';

interface Job {
  id: string;
  title: string;
  description: string;
  degree_requirement: string;
  eligibilities: string[];
  skills: string[];
  years_of_experience: number;
  location: string | null;
  employment_type: string | null;
  remote: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

interface StatusHistoryItem {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'interviewed' | 'approved' | 'denied' | 'hired' | 'archived' | 'withdrawn';
  rank: number | null;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  status_history?: StatusHistoryItem[];
  denial_reason?: string;
  next_steps?: string;
  interview_date?: string;
  hr_notes?: string;
  jobs?: {
    id: string;
    title: string;
    description: string;
    location: string | null;
    employment_type: string | null;
    created_at?: string;
    profiles?: {
      id: string;
      full_name: string;
      role: string;
    } | null;
  };
}

interface JobWithApplication extends Job {
  userApplication: Application | null;
  hasApplied: boolean;
}

export default function AuthenticatedJobsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedApplicationToWithdraw, setSelectedApplicationToWithdraw] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Tab state for organizing view (like trainings page)
  const [activeTab, setActiveTab] = useState<'available' | 'applications' | 'history'>('available');

  // Status History Modal state
  const [showStatusHistoryModal, setShowStatusHistoryModal] = useState(false);
  const [selectedApplicationForHistory, setSelectedApplicationForHistory] = useState<Application | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Skills expansion state
  const [expandedSkillsCards, setExpandedSkillsCards] = useState<Set<string>>(new Set());

  // Description expansion state
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Fetch jobs function
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs?status=active');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.data || []);
      showToast('Jobs refreshed', 'success');
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch user applications function
  const fetchUserApplications = useCallback(async () => {
    try {
      setLoadingApplications(true);
      const response = await fetch('/api/applications');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch applications');
      }

      setUserApplications(result.data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setUserApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  // Fetch jobs and applications on component mount
  useEffect(() => {
    fetchJobs();
    fetchUserApplications();
  }, [fetchJobs, fetchUserApplications]);

  // REMOVED: Real-time subscription disabled for performance

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleApplicationSuccess = () => {
    fetchUserApplications();
  };

  // Handle withdraw application
  const handleWithdrawClick = (application: Application) => {
    setSelectedApplicationToWithdraw(application);
    setWithdrawModalOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!selectedApplicationToWithdraw) return;

    try {
      setWithdrawing(true);
      const response = await fetch(`/api/applications/${selectedApplicationToWithdraw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to withdraw application');
      }

      showToast('Application withdrawn successfully', 'success');
      setWithdrawModalOpen(false);
      setSelectedApplicationToWithdraw(null);
      fetchUserApplications();
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // Handle View Status History
  const handleViewStatusHistory = async (application: Application) => {
    try {
      setLoadingHistory(true);
      setShowStatusHistoryModal(true);

      // Fetch full application details including status_history
      const response = await fetch(`/api/applications/${application.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSelectedApplicationForHistory({
          ...application,
          status_history: result.data.status_history || []
        });
      } else {
        setSelectedApplicationForHistory(application);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      setSelectedApplicationForHistory(application);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Toggle Skills Expansion
  const toggleSkillsExpansion = (jobId: string) => {
    setExpandedSkillsCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Handle Toggle Description Expansion
  const toggleDescriptionExpansion = (jobId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Helper functions for application status
  const getApplicationForJob = (jobId: string): Application | null => {
    return userApplications.find(app => app.job_id === jobId) || null;
  };

  const hasAppliedToJob = (jobId: string): boolean => {
    const application = getApplicationForJob(jobId);
    return !!application && application.status !== 'withdrawn';
  };

  // Combine jobs with application status
  const jobsWithApplicationStatus: JobWithApplication[] = jobs.map(job => ({
    ...job,
    userApplication: getApplicationForJob(job.id),
    hasApplied: hasAppliedToJob(job.id),
  }));

  // Filter applications by tab
  const activeApplications = userApplications.filter(app =>
    ['pending', 'under_review', 'shortlisted', 'interviewed', 'approved'].includes(app.status)
  );

  const historyApplications = userApplications.filter(app =>
    ['hired', 'denied', 'withdrawn', 'archived'].includes(app.status)
  );

  // Filter jobs for Available Jobs tab
  const filteredJobs = jobsWithApplicationStatus.filter(job => {
    const matchesType = filterType === 'all' || job.employment_type === filterType;
    const matchesLocation = filterLocation === 'all' ||
      (filterLocation === 'Remote' ? job.remote : job.location === filterLocation);
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.degree_requirement.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesLocation && matchesSearch;
  });

  // Helper function to get card gradient color
  const getCardGradient = (index: number) => {
    const gradients = [
      'from-blue-500/10 to-blue-600/5',
      'from-purple-500/10 to-purple-600/5',
      'from-teal-500/10 to-teal-600/5',
      'from-orange-500/10 to-orange-600/5',
      'from-green-500/10 to-green-600/5',
      'from-pink-500/10 to-pink-600/5',
    ];
    return gradients[index % gradients.length];
  };

  // Helper function to check if job is new (posted within last 3 days)
  const isNewJob = (createdAt: string) => {
    const jobDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  // Helper function to format date
  const formatPostedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
    return `Posted ${Math.floor(diffDays / 30)} months ago`;
  };

  // Calculate stats
  const stats = {
    totalJobs: jobs.length,
    myApplications: userApplications.length,
    activeApplications: activeApplications.length,
    pendingReview: userApplications.filter(a => ['pending', 'under_review'].includes(a.status)).length,
    shortlisted: userApplications.filter(a => a.status === 'shortlisted').length,
  };

  // Get unique employment types and locations for filters
  const employmentTypes = Array.from(new Set(jobs.map(j => j.employment_type).filter(Boolean))) as string[];
  const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean))) as string[];

  return (
    <AdminLayout role="Applicant" userName={user?.fullName || 'Applicant'} pageTitle="Job Opportunities" pageDescription="Browse and apply for available positions">
      <Container size="xl">
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex items-center justify-end">
            <RefreshButton
              onRefresh={async () => {
                await fetchJobs();
                await fetchUserApplications();
              }}
              label="Refresh"
              showLastRefresh={true}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.totalJobs}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-teal-50 to-teal-100 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Applications</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loadingApplications ? '...' : stats.myApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loadingApplications ? '...' : stats.activeApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loadingApplications ? '...' : stats.pendingReview}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loadingApplications ? '...' : stats.shortlisted}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'available'
                    ? 'border-[#22A555] text-[#22A555]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Available Jobs</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-blue-100 text-blue-800">
                    {filteredJobs.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-[#22A555] text-[#22A555]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>My Applications</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-green-100 text-green-800">
                    {activeApplications.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-[#22A555] text-[#22A555]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  <span>Application History</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-800">
                    {historyApplications.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* TAB 1: AVAILABLE JOBS */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search jobs by title, description, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] transition-colors"
                  />
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="w-5 h-5 text-gray-600 hidden md:block" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white min-w-[140px]"
                  >
                    <option value="all">All Types</option>
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white min-w-[160px]"
                  >
                    <option value="all">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    <option value="Remote">Remote</option>
                  </select>

                  {(filterType !== 'all' || filterLocation !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setFilterLocation('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Jobs Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Available Positions ({filteredJobs.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                    <span className="ml-3 text-gray-600">Loading jobs...</span>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <Card className="text-center py-16">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-4">
                      {jobs.length === 0 ? 'No active job postings at the moment. Check back soon!' : 'Try adjusting your search or filters'}
                    </p>
                    {(filterType !== 'all' || filterLocation !== 'all' || searchQuery) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterType('all');
                          setFilterLocation('all');
                          setSearchQuery('');
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {filteredJobs.map((job, index) => (
                      <Card key={job.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                        <div className={`h-3 bg-gradient-to-r ${getCardGradient(index)}`}></div>
                        <div className="p-6 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <div className="w-12 h-12 bg-[#22A555]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Briefcase className="w-6 h-6 text-[#22A555]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#22A555] transition-colors mb-1 line-clamp-2">
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-gray-500">Municipality of Asuncion</p>
                                </div>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-col gap-2">
                              {isNewJob(job.created_at) && !job.hasApplied && (
                                <Badge variant="success" size="sm" className="whitespace-nowrap">
                                  🆕 New
                                </Badge>
                              )}
                              {job.remote && (
                                <Badge variant="info" size="sm" className="whitespace-nowrap">
                                  🌐 Remote
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Applied Badge */}
                          {job.hasApplied && job.userApplication && (
                            <div className="flex items-center gap-2 -mt-2">
                              <AppliedBadge createdAt={job.userApplication.created_at} />
                            </div>
                          )}

                          {/* Description */}
                          <div className="space-y-2">
                            <p className={`text-sm text-gray-600 leading-relaxed ${expandedDescriptions.has(job.id) ? '' : 'line-clamp-2'}`}>
                              {job.description}
                            </p>
                            {job.description && job.description.length > 150 && (
                              <button
                                onClick={() => toggleDescriptionExpansion(job.id)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                {expandedDescriptions.has(job.id) ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>

                          {/* Creator Info */}
                          {job.profiles && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Posted by {job.profiles.full_name} • {formatRelativeDate(job.created_at)}
                            </p>
                          )}

                          {/* Key Requirements */}
                          <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <GraduationCap className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-0.5">Degree Requirement</p>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {job.degree_requirement}
                                </p>
                              </div>
                            </div>

                            {job.years_of_experience > 0 && (
                              <div className="flex items-start gap-2">
                                <Award className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-gray-500 mb-0.5">Experience Required</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {job.years_of_experience} {job.years_of_experience === 1 ? 'year' : 'years'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Skills & Eligibilities */}
                          {((job.skills && job.skills.length > 0) || (job.eligibilities && job.eligibilities.length > 0)) && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const isExpanded = expandedSkillsCards.has(job.id);
                                  const totalCount = (job.skills?.length || 0) + (job.eligibilities?.length || 0);
                                  const showAll = isExpanded || totalCount <= 5;

                                  const skillsToShow = showAll ? (job.skills || []) : (job.skills || []).slice(0, 3);
                                  const eligsToShow = showAll ? (job.eligibilities || []) : (job.eligibilities || []).slice(0, 2);
                                  const shownCount = skillsToShow.length + eligsToShow.length;

                                  return (
                                    <>
                                      {skillsToShow.map((skill, idx) => (
                                        <Badge key={`skill-${idx}`} size="sm" variant="default">
                                          {skill}
                                        </Badge>
                                      ))}
                                      {eligsToShow.map((elig, idx) => (
                                        <Badge key={`elig-${idx}`} size="sm" variant="default">
                                          {elig}
                                        </Badge>
                                      ))}
                                      {totalCount > 5 && (
                                        <button
                                          onClick={() => toggleSkillsExpansion(job.id)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
                                          title={isExpanded ? "Click to show less" : "Click to view all requirements"}
                                        >
                                          {isExpanded ? 'Show less' : `+${totalCount - shownCount} more`}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location || 'Not specified'}</span>
                              </div>
                              {job.employment_type && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{job.employment_type}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatPostedDate(job.created_at)}
                            </div>
                          </div>

                          {/* Application Button/Status */}
                          {job.userApplication ? (
                            <div className="space-y-3">
                              <ApplicationStatusBadge
                                status={job.userApplication.status}
                                createdAt={job.userApplication.created_at}
                                className="w-full justify-center py-2"
                              />
                              <Button
                                variant="primary"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                size="sm"
                                icon={History}
                                onClick={() => handleViewStatusHistory(job.userApplication!)}
                              >
                                View Status History
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="success"
                              className="w-full shadow-md hover:shadow-lg transition-shadow"
                              size="lg"
                              icon={CheckCircle2}
                              onClick={() => handleApplyClick(job)}
                            >
                              Apply Now
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY APPLICATIONS (ACTIVE) */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  My Applications ({activeApplications.length})
                </h2>
              </div>

              {loadingApplications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                  <span className="ml-3 text-gray-600">Loading applications...</span>
                </div>
              ) : activeApplications.length === 0 ? (
                <Card className="text-center py-16">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No active applications</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't applied to any jobs yet. Browse available positions and apply!
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab('available')}>
                    Browse Jobs
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                  {activeApplications.map((app, index) => {
                    const statusConfig = getStatusConfig(app.status);
                    const canWithdraw = app.status === 'pending' || app.status === 'under_review';

                    return (
                      <Card key={app.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                        {/* Colored Top Border */}
                        <div className={`h-3 bg-gradient-to-r ${getCardGradient(index)}`}></div>

                        <div className="p-6 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <div className="w-12 h-12 bg-[#22A555]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Briefcase className="w-6 h-6 text-[#22A555]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#22A555] transition-colors mb-1 line-clamp-2">
                                    {app.jobs?.title || 'Position'}
                                  </h3>
                                  <p className="text-sm text-gray-500">Municipality of Asuncion</p>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col gap-2">
                              <Badge variant={statusConfig.badgeVariant} size="lg" icon={statusConfig.icon}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Applied Badge & Posted By */}
                          <div className="flex items-center gap-2 -mt-2">
                            <AppliedBadge createdAt={app.created_at} />
                          </div>
                          {app.jobs?.profiles && app.jobs?.created_at && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 -mt-2">
                              <User className="w-3.5 h-3.5" />
                              <span>Posted by <span className="font-medium text-gray-700">{app.jobs.profiles.full_name}</span></span>
                              <span className="text-gray-400">•</span>
                              <span>{formatShortDate(app.jobs.created_at)}</span>
                            </div>
                          )}

                          {/* Interview Scheduled Box (if applicable) */}
                          {app.interview_date && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-green-700" />
                                <p className="font-bold text-green-900">Interview Scheduled! 📅</p>
                              </div>
                              <p className="text-sm text-green-700">
                                {new Date(app.interview_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}

                          {/* Job Description (if available) */}
                          {app.jobs?.description && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {app.jobs.description}
                            </p>
                          )}

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{app.jobs?.location || 'Not specified'}</span>
                              </div>
                              {app.jobs?.employment_type && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{app.jobs.employment_type}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Applied {formatRelativeDate(app.created_at)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={History}
                              onClick={() => handleViewStatusHistory(app)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              View History
                            </Button>
                            {canWithdraw && (
                              <Button
                                variant="danger"
                                size="sm"
                                icon={Ban}
                                onClick={() => handleWithdrawClick(app)}
                                className="flex-1"
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPLICATION HISTORY (COMPLETED) */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Application History ({historyApplications.length})
                </h2>
              </div>

              {loadingApplications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                  <span className="ml-3 text-gray-600">Loading history...</span>
                </div>
              ) : historyApplications.length === 0 ? (
                <Card className="text-center py-16">
                  <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No application history yet</h3>
                  <p className="text-gray-600 mb-4">
                    Your completed applications will appear here
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab('available')}>
                    Browse Jobs
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {historyApplications.map((app, index) => {
                    const statusConfig = getStatusConfig(app.status);
                    const isHired = app.status === 'hired';
                    const isDenied = app.status === 'denied';
                    const isWithdrawn = app.status === 'withdrawn';
                    const isArchived = app.status === 'archived';

                    // Choose gradient color based on status
                    const gradientColor = isHired
                      ? 'from-teal-500 to-green-500'
                      : isDenied
                      ? 'from-red-500 to-red-600'
                      : isWithdrawn
                      ? 'from-gray-400 to-gray-500'
                      : isArchived
                      ? 'from-gray-500 to-gray-600'
                      : getCardGradient(index);

                    return (
                      <Card key={app.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                        {/* Colored Top Border (status-specific) */}
                        <div className={`h-3 bg-gradient-to-r ${gradientColor}`}></div>

                        <div className="p-6 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isHired ? 'bg-teal-100' : isDenied ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  <Briefcase className={`w-6 h-6 ${
                                    isHired ? 'text-teal-700' : isDenied ? 'text-red-700' : 'text-gray-600'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                                    {app.jobs?.title || 'Position'}
                                  </h3>
                                  <p className="text-sm text-gray-500">Municipality of Asuncion</p>
                                </div>
                              </div>
                            </div>

                            {/* Large Status Badge */}
                            <div className="flex flex-col gap-2">
                              <Badge variant={statusConfig.badgeVariant} size="lg" icon={statusConfig.icon}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Status-specific Hero Sections */}
                          {isHired && (
                            <div className="p-5 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-300 rounded-xl shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-lg font-bold text-teal-900">Congratulations! 🎉</p>
                              </div>
                              <p className="text-sm text-teal-700 ml-13">
                                You've been hired for this position! Check with HR for onboarding details.
                              </p>
                            </div>
                          )}

                          {isDenied && (
                            <div className="space-y-3">
                              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                <p className="text-sm font-bold text-blue-800 mb-2">💡 Ways to Improve:</p>
                                <ul className="text-sm text-blue-700 space-y-1.5 ml-4">
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>Complete relevant training programs</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>Gain more work experience in the field</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span>Obtain required certifications or licenses</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {isWithdrawn && (
                            <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Ban className="w-5 h-5 text-gray-600" />
                                <p className="font-semibold text-gray-800">Application Withdrawn</p>
                              </div>
                              <p className="text-sm text-gray-600">
                                You withdrew this application on {formatShortDate(app.updated_at)}. You can reapply anytime.
                              </p>
                            </div>
                          )}

                          {isArchived && (
                            <div className="p-4 bg-gray-50 border-l-4 border-gray-500 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Archive className="w-5 h-5 text-gray-600" />
                                <p className="font-semibold text-gray-800">Application Archived</p>
                              </div>
                              <p className="text-sm text-gray-600">
                                This application was archived because the job posting has been closed or the position has been filled.
                              </p>
                            </div>
                          )}

                          {/* Posted By Information */}
                          {app.jobs?.profiles && app.jobs?.created_at && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <User className="w-3.5 h-3.5" />
                              <span>Posted by <span className="font-medium text-gray-700">{app.jobs.profiles.full_name}</span></span>
                              <span className="text-gray-400">•</span>
                              <span>{formatShortDate(app.jobs.created_at)}</span>
                            </div>
                          )}

                          {/* Job Description (if available) */}
                          {app.jobs?.description && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {app.jobs.description}
                            </p>
                          )}

                          {/* Application Details */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{app.jobs?.location || 'Not specified'}</span>
                              </div>
                              {app.jobs?.employment_type && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{app.jobs.employment_type}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Applied {formatRelativeDate(app.created_at)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={History}
                              onClick={() => handleViewStatusHistory(app)}
                              className="flex-1"
                            >
                              View History
                            </Button>
                            {(isDenied || isWithdrawn) && (
                              <Button
                                variant="success"
                                size="sm"
                                icon={ArrowRight}
                                className="flex-1"
                                onClick={() => {
                                  const job = jobs.find(j => j.id === app.job_id);
                                  if (job) handleApplyClick(job);
                                }}
                              >
                                Reapply
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        job={selectedJob as any}
        onSuccess={handleApplicationSuccess}
      />

      {/* Withdraw Modal */}
      <ModernModal
        isOpen={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false);
          setSelectedApplicationToWithdraw(null);
        }}
        title="Withdraw Application"
        subtitle="Confirm withdrawal"
        colorVariant="orange"
        icon={AlertCircle}
        size="md"
      >
        {selectedApplicationToWithdraw && (
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800 mb-1">Are you sure?</p>
                  <p className="text-sm text-orange-700">
                    Withdrawing this application cannot be undone. You may reapply later if the position is still available.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Application Details:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {selectedApplicationToWithdraw.jobs?.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Applied: {formatShortDate(selectedApplicationToWithdraw.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setSelectedApplicationToWithdraw(null);
                }}
                className="flex-1"
                disabled={withdrawing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Ban}
                loading={withdrawing}
                onClick={handleWithdrawConfirm}
                className="flex-1"
                disabled={withdrawing}
              >
                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </Button>
            </div>
          </div>
        )}
      </ModernModal>

      {/* Status History Modal */}
      {showStatusHistoryModal && selectedApplicationForHistory && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
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

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {selectedApplicationForHistory.jobs?.title || 'Position'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Job Application</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Applied on: {new Date(selectedApplicationForHistory.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading status history...</span>
                </div>
              ) : selectedApplicationForHistory.status_history && selectedApplicationForHistory.status_history.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-visible">
                  <StatusTimeline
                    statusHistory={selectedApplicationForHistory.status_history}
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
    </AdminLayout>
  );
}
