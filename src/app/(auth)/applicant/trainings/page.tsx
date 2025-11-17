'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Container, Badge, RefreshButton, Modal, ModernModal, Input, Textarea } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatPhilippinePhone } from '@/lib/utils/phoneFormatter';
// import { useTableRealtime } from '@/hooks/useTableRealtime'; // REMOVED: Realtime disabled
import { AdminLayout } from '@/components/layout';
import { StatusTimeline } from '@/components/peso/StatusTimeline';
import { GraduationCap, Clock, Calendar, Users, MapPin, CheckCircle2, Upload, Filter, Loader2, Award, Star, TrendingUp, User, Laptop, Briefcase, BarChart3, Palette, Wrench, BookOpen, Code, Lightbulb, Eye, XCircle, UserCheck, Play, Ban, AlertCircle, Archive, Download, FileText, History, X, ArrowRight } from 'lucide-react';
import { FileUploadWithProgress } from '@/components/ui';
import { formatShortDate, formatRelativeDate, getCreatorTooltip } from '@/lib/utils/dateFormatters';
import { getStatusConfig } from '@/lib/config/statusConfig';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  schedule: string | null;
  capacity: number;
  enrolled_count: number;
  location: string | null;
  start_date: string;
  end_date: string | null;
  skills_covered: string[];
  icon: string;
  status: string;
  created_by: string;
  created_at: string;
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

interface UserApplication {
  id: string;
  program_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  highest_education: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'enrolled' | 'in_progress' | 'completed' | 'certified' | 'withdrawn' | 'failed' | 'archived';
  status_history?: StatusHistoryItem[];
  submitted_at: string;
  denial_reason?: string;
  next_steps?: string;
  certificate_url?: string;
  training_programs?: {
    id: string;
    title: string;
    duration: string;
    description?: string;
    location?: string | null;
    created_at?: string;
    profiles?: {
      id: string;
      full_name: string;
      role: string;
    } | null;
  };
}

export default function TrainingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filterDuration, setFilterDuration] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [statusHistoryModalOpen, setStatusHistoryModalOpen] = useState(false);
  const [selectedApplicationForHistory, setSelectedApplicationForHistory] = useState<UserApplication | null>(null);
  const [expandedSkillsCards, setExpandedSkillsCards] = useState<Set<string>>(new Set());

  // Description expansion state
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Tab state for organizing view
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled' | 'completed'>('available');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    highest_education: '',
    id_image_url: '',
    id_image_name: '',
  });

  // Fetch training programs function
  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/programs?status=active');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch training programs');
      }

      setPrograms(result.data || []);
      showToast('Training programs refreshed', 'success');
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch user's applications
  const fetchUserApplications = useCallback(async () => {
    try {
      console.log('📊 [Trainings Page] Fetching user training applications...');
      const response = await fetch('/api/training/applications');
      const result = await response.json();

      console.log('📊 [Trainings Page] API Response:', {
        status: response.status,
        ok: response.ok,
        resultSuccess: result.success,
        count: result.count,
        dataLength: result.data?.length,
      });

      if (response.ok) {
        const applications = result.data || [];
        console.log('📊 [Trainings Page] Total Applications:', applications.length);

        // Log each application with key details
        applications.forEach((app: any, index: number) => {
          console.log(`📊 [Trainings Page] Application ${index + 1}:`, {
            id: app.id,
            status: app.status,
            program_title: app.training_programs?.title,
            certificate_url: app.certificate_url,
            completion_status: app.completion_status,
            submitted_at: app.submitted_at,
          });
        });

        // Specifically look for certified applications
        const certifiedApps = applications.filter((app: any) => app.status === 'certified');
        console.log('🎓 [Trainings Page] Certified Applications:', certifiedApps.length);
        if (certifiedApps.length > 0) {
          console.log('🎓 [Trainings Page] Certified Apps Details:', certifiedApps.map((app: any) => ({
            title: app.training_programs?.title,
            has_certificate: !!app.certificate_url,
          })));
        }

        setUserApplications(applications);
      } else {
        console.error('❌ [Trainings Page] API Error:', result.error);
      }
    } catch (error: any) {
      console.error('❌ [Trainings Page] Error fetching user applications:', error);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTrainings();
    fetchUserApplications();
  }, [fetchTrainings, fetchUserApplications]);

  // REMOVED: Real-time subscription disabled for performance
  // useTableRealtime('training_programs', ['INSERT', 'UPDATE', 'DELETE'], null, () => {
  //   showToast('Training programs updated', 'info');
  //   // fetchTrainings(); // Uncomment when real data
  // });

  // Handle apply button click
  const handleApplyClick = (program: TrainingProgram) => {
    setSelectedProgram(program);

    // Pre-fill form with user data
    // 1. Get data from AuthContext (always available)
    const fullName = user?.fullName || '';
    const email = user?.email || '';

    // 2. Get data from most recent application (if exists)
    const mostRecentApp = userApplications.length > 0
      ? userApplications.sort((a, b) =>
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        )[0]
      : null;

    const phone = mostRecentApp?.phone || '';
    const address = mostRecentApp?.address || '';
    const highestEducation = mostRecentApp?.highest_education || '';

    setFormData({
      full_name: fullName,
      email: email,
      phone: phone,
      address: address,
      highest_education: highestEducation,
      id_image_url: '', // Don't pre-fill - user uploads new ID each time
      id_image_name: '',
    });
    setApplyModalOpen(true);
  };

  // Handle image upload
  const handleImageUpload = (data: {
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }) => {
    setFormData({
      ...formData,
      id_image_url: data.fileUrl,
      id_image_name: data.fileName,
    });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProgram) return;

    // Validate all fields
    if (!formData.full_name || !formData.email || !formData.phone || !formData.address || !formData.highest_education || !formData.id_image_url) {
      showToast('Please fill in all required fields and upload your ID', 'error');
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await fetch('/api/training/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgram.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      showToast(result.message || 'Application submitted successfully', 'success');
      setApplyModalOpen(false);
      setSelectedProgram(null);
      fetchUserApplications(); // Refresh applications list
    } catch (error: any) {
      console.error('Error submitting application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Check if user has applied to a program
  const getUserApplication = (programId: string) => {
    return userApplications.find(app => app.program_id === programId);
  };

  // Get status badge configuration using centralized config
  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    return {
      variant: statusConfig.badgeVariant,
      icon: statusConfig.icon,
      label: statusConfig.label,
    };
  };

  // Get card gradient color based on index
  const getCardGradient = (index: number) => {
    const gradients = [
      'from-blue-500/10 to-blue-600/5',
      'from-purple-500/10 to-purple-600/5',
      'from-teal-500/10 to-teal-600/5',
      'from-orange-500/10 to-orange-600/5',
      'from-pink-500/10 to-pink-600/5',
      'from-green-500/10 to-green-600/5',
    ];
    return gradients[index % gradients.length];
  };

  // Handle view application details
  const handleViewDetails = (application: UserApplication) => {
    setSelectedApplication(application);
    setViewDetailsModalOpen(true);
  };

  // Handle view status history
  const handleViewStatusHistory = (application: UserApplication) => {
    setSelectedApplicationForHistory(application);
    setStatusHistoryModalOpen(true);
  };

  // Handle withdraw application
  const handleWithdrawClick = (application: UserApplication) => {
    setSelectedApplication(application);
    setWithdrawModalOpen(true);
  };

  // Handle withdraw confirm
  const handleWithdrawConfirm = async () => {
    if (!selectedApplication) return;

    try {
      setWithdrawLoading(true);
      const response = await fetch(`/api/training/applications/${selectedApplication.id}`, {
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
      setSelectedApplication(null);
      fetchUserApplications(); // Refresh applications list
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Handle download certificate
  const handleDownloadCertificate = async (certificateUrl: string, applicationId: string) => {
    try {
      const response = await fetch('/api/training/certificates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificate_url: certificateUrl,
          application_id: applicationId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get certificate download URL');
      }

      // Open the signed URL in a new tab to download
      window.open(result.signed_url, '_blank');
      showToast('Opening certificate download...', 'success');
    } catch (error: any) {
      console.error('Error downloading certificate:', error);
      showToast(getErrorMessage(error), 'error');
    }
  };

  // Handle Toggle Skills Expansion
  const toggleSkillsExpansion = (programId: string) => {
    setExpandedSkillsCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  // Handle Toggle Description Expansion
  const toggleDescriptionExpansion = (programId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  // Helper function to check if program is new (created within last 7 days)
  const isNewProgram = (createdAt: string) => {
    const programDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - programDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Helper function to check if program is starting soon (within 7 days)
  const isStartingSoon = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Filter programs with search and filters
  const filteredPrograms = programs.filter(program => {
    const availableSlots = program.capacity - program.enrolled_count;
    const availabilityPercent = (availableSlots / program.capacity) * 100;

    // Search filter
    const matchesSearch = searchQuery === '' ||
      program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.skills_covered?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    // Duration filter (parsing duration string)
    const matchesDuration = filterDuration === 'all' || (() => {
      const durationLower = program.duration.toLowerCase();
      if (filterDuration === 'short') {
        return durationLower.includes('week') || durationLower.includes('1 month');
      } else if (filterDuration === 'medium') {
        return durationLower.includes('2 month') || durationLower.includes('3 month');
      } else if (filterDuration === 'long') {
        return durationLower.includes('4 month') || durationLower.includes('5 month') ||
               durationLower.includes('6 month') || durationLower.includes('year');
      }
      return true;
    })();

    // Availability filter
    const matchesAvailability = filterAvailability === 'all' || (() => {
      if (filterAvailability === 'available') return availableSlots > 0;
      if (filterAvailability === 'full') return availableSlots === 0;
      if (filterAvailability === 'almost-full') return availabilityPercent < 20 && availableSlots > 0;
      return true;
    })();

    return matchesSearch && matchesDuration && matchesAvailability;
  });

  const getSlotColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-100';
    if (percentage > 20) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCardColor = (index: number) => {
    const colors = [
      'from-blue-500/10 to-blue-600/5',
      'from-purple-500/10 to-purple-600/5',
      'from-teal-500/10 to-teal-600/5',
      'from-orange-500/10 to-orange-600/5',
    ];
    return colors[index % colors.length];
  };

  const getIcon = (index: number) => {
    const icons = ['💻', '📱', '📊', '🎨', '🔧', '📚', '🎯', '💡'];
    return icons[index % icons.length];
  };

  // Map icon string to lucide-react icon component
  const getIconComponent = (iconString: string | null | undefined) => {
    const iconMap: { [key: string]: any } = {
      'laptop': Laptop,
      'briefcase': Briefcase,
      'chart': BarChart3,
      'palette': Palette,
      'wrench': Wrench,
      'book': BookOpen,
      'code': Code,
      'lightbulb': Lightbulb,
      'graduation': GraduationCap,
      'award': Award,
    };

    if (!iconString) return GraduationCap;

    const key = iconString.toLowerCase().trim();
    return iconMap[key] || GraduationCap;
  };

  // Filter applications by tab
  const enrolledApplications = userApplications.filter(app =>
    ['pending', 'under_review', 'approved', 'enrolled', 'in_progress'].includes(app.status)
  );

  const completedApplications = userApplications.filter(app =>
    ['completed', 'certified', 'failed', 'withdrawn', 'denied', 'archived'].includes(app.status)
  );

  // Calculate stats
  const stats = {
    totalPrograms: programs.length,
    availableSlots: programs.reduce((sum, p) => sum + (p.capacity - p.enrolled_count), 0),
    myApplications: userApplications.length,
    activeTrainings: userApplications.filter(app =>
      ['enrolled', 'in_progress', 'approved'].includes(app.status)
    ).length,
    completedCertified: userApplications.filter(app =>
      ['completed', 'certified'].includes(app.status)
    ).length,
    pendingApplications: userApplications.filter(app =>
      ['pending', 'under_review'].includes(app.status)
    ).length,
  };

  return (
    <AdminLayout role="Applicant" userName={user?.fullName || 'Applicant'} pageTitle="PESO Training Programs" pageDescription="Enhance your skills with our free training programs">
      <Container size="xl">
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="flex items-center justify-end">
            <RefreshButton onRefresh={fetchTrainings} label="Refresh" showLastRefresh={true} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.totalPrograms}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Applications</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.myApplications}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Trainings</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.activeTrainings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
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
                  <GraduationCap className="w-5 h-5" />
                  <span>Available Programs</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-purple-100 text-purple-800">
                    {filteredPrograms.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('enrolled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'enrolled'
                    ? 'border-[#22A555] text-[#22A555]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>My Enrollments</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-green-100 text-green-800">
                    {enrolledApplications.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'completed'
                    ? 'border-[#22A555] text-[#22A555]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Training History</span>
                  <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-orange-100 text-orange-800">
                    {completedApplications.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Search and Filters - Only show on Available tab */}
          {activeTab === 'available' && (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search programs by title, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] transition-colors"
              />
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600 hidden md:block" />
              <select
                value={filterDuration}
                onChange={(e) => setFilterDuration(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white min-w-[150px]"
              >
                <option value="all">All Durations</option>
                <option value="short">Short (&lt; 1 month)</option>
                <option value="medium">Medium (1-3 months)</option>
                <option value="long">Long (3+ months)</option>
              </select>

              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white min-w-[150px]"
              >
                <option value="all">All Availability</option>
                <option value="available">Available</option>
                <option value="almost-full">Almost Full</option>
                <option value="full">Full</option>
              </select>

              {(filterDuration !== 'all' || filterAvailability !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterDuration('all');
                    setFilterAvailability('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          )}

        {/* Available Programs Tab */}
        {activeTab === 'available' && (
        <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Training Programs ({filteredPrograms.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading programs...</span>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <Card className="text-center py-16">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs found</h3>
                <p className="text-gray-600 mb-4">
                  {programs.length === 0 ? 'No training programs available at the moment.' : 'Try adjusting your search or filters'}
                </p>
                {(filterDuration !== 'all' || filterAvailability !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterDuration('all');
                      setFilterAvailability('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {filteredPrograms.map((program, index) => {
                  const availableSlots = program.capacity - program.enrolled_count;
                  const availabilityPercent = (availableSlots / program.capacity) * 100;
                  const userApp = getUserApplication(program.id);

                  return (
                    <Card key={program.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                      <div className={`h-3 bg-gradient-to-r ${getCardColor(index)}`}></div>
                      <div className="p-6 space-y-4">
                        {/* Header with Badges */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-[#22A555]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {(() => {
                                const IconComponent = getIconComponent(program.icon);
                                return <IconComponent className="w-6 h-6 text-[#22A555]" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#22A555] transition-colors mb-2 line-clamp-2">
                                {program.title}
                              </h2>
                              <div className="space-y-1">
                                <p className={`text-sm text-gray-600 leading-relaxed ${expandedDescriptions.has(program.id) ? '' : 'line-clamp-2'}`}>
                                  {program.description}
                                </p>
                                {program.description && program.description.length > 150 && (
                                  <button
                                    onClick={() => toggleDescriptionExpansion(program.id)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    {expandedDescriptions.has(program.id) ? 'Show less' : 'Show more'}
                                  </button>
                                )}
                              </div>
                              {/* Posted By Info */}
                              {program.profiles && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Posted by {program.profiles.full_name} • {formatShortDate(program.created_at)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-col gap-2">
                            {isNewProgram(program.created_at) && (
                              <Badge variant="success" size="sm" className="whitespace-nowrap">
                                🆕 New
                              </Badge>
                            )}
                            {isStartingSoon(program.start_date) && (
                              <Badge variant="warning" size="sm" className="whitespace-nowrap">
                                ⚡ Starting Soon
                              </Badge>
                            )}
                            {availabilityPercent < 20 && availableSlots > 0 && (
                              <Badge variant="danger" size="sm" className="whitespace-nowrap">
                                🔥 Almost Full
                              </Badge>
                            )}
                          </div>
                        </div>

                  {/* Skills Tags */}
                  {program.skills_covered && program.skills_covered.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const isExpanded = expandedSkillsCards.has(program.id);
                        const totalCount = program.skills_covered.length;
                        const showAll = isExpanded || totalCount <= 5;

                        const skillsToShow = showAll ? program.skills_covered : program.skills_covered.slice(0, 5);

                        return (
                          <>
                            {skillsToShow.map((skill, idx) => (
                              <Badge key={idx} size="sm" variant="default">
                                {skill}
                              </Badge>
                            ))}
                            {totalCount > 5 && (
                              <button
                                onClick={() => toggleSkillsExpansion(program.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
                                title={isExpanded ? "Click to show less" : "Click to view all skills"}
                              >
                                {isExpanded ? 'Show less' : `+${totalCount - skillsToShow.length} more`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Training Details */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{program.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Start Date</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {new Date(program.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {program.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Location</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{program.location}</p>
                        </div>
                      </div>
                    )}

                    {program.schedule && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-[#22A555] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Schedule</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{program.schedule}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slots Availability */}
                  <div className={`flex items-center justify-between p-3 rounded-lg ${getSlotColor(availableSlots, program.capacity)}`}>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold text-sm">
                        {availableSlots} / {program.capacity} slots
                      </span>
                    </div>
                    <div className="w-24 h-2.5 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all duration-300"
                        style={{ width: `${(availableSlots / program.capacity) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  {userApp ? (
                    <div className="w-full space-y-3">
                      <Badge
                        variant={getStatusBadge(userApp.status).variant}
                        className="w-full justify-center py-3 text-sm"
                      >
                        {(() => {
                          const StatusIcon = getStatusBadge(userApp.status).icon;
                          return <StatusIcon className="w-4 h-4 mr-1" />;
                        })()}
                        {getStatusBadge(userApp.status).label}
                      </Badge>

                      {/* Download Certificate Button (if certified) */}
                      {userApp.status === 'certified' && userApp.certificate_url && (
                        <Button
                          variant="success"
                          className="w-full shadow-md"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownloadCertificate(userApp.certificate_url!, userApp.id)}
                        >
                          Download Certificate
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        className="w-full"
                        size="sm"
                        icon={History}
                        onClick={() => handleViewStatusHistory(userApp)}
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
                      onClick={() => handleApplyClick(program)}
                      disabled={availableSlots === 0}
                    >
                      {availableSlots === 0 ? 'Training Full' : 'Apply for Training'}
                    </Button>
                  )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Info Card */}
              <Card variant="flat" className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">About PESO Training Programs</p>
                    <p className="text-sm text-gray-600">
                      Our training programs are designed to equip job seekers with in-demand skills. All programs
                      are completely free and include certificates upon completion. Limited slots are available,
                      so apply early to secure your spot!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
        )}

        {/* My Enrollments Tab */}
        {activeTab === 'enrolled' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              My Enrollments ({enrolledApplications.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
              <span className="ml-3 text-gray-600">Loading enrollments...</span>
            </div>
          ) : enrolledApplications.length === 0 ? (
            <Card className="text-center py-16">
              <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active enrollments</h3>
              <p className="text-gray-600 mb-4">
                You haven't enrolled in any training programs yet. Browse available programs and apply!
              </p>
              <Button variant="primary" onClick={() => setActiveTab('available')}>
                Browse Programs
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {enrolledApplications.map((app, index) => {
                const statusConfig = getStatusConfig(app.status);
                // Allow withdrawal for applications that haven't started training yet
                const canWithdraw = ['pending', 'under_review', 'approved', 'enrolled'].includes(app.status);

                return (
                  <Card key={app.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                    {/* Gradient Top Border */}
                    <div className={`h-3 bg-gradient-to-r ${getCardGradient(index)}`}></div>

                    <div className="p-6 space-y-4">
                      {/* Header with Icon and Title */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-12 h-12 bg-[#22A555]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-6 h-6 text-[#22A555]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#22A555] transition-colors mb-1 line-clamp-2">
                                {app.training_programs?.title || 'Program'}
                              </h3>
                              <p className="text-sm text-gray-500">PESO Training</p>
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

                      {/* Applied Date Badge */}
                      <div className="flex items-center gap-2 -mt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Applied {formatRelativeDate(app.submitted_at)}</span>
                        </div>
                      </div>

                      {/* Posted By Information */}
                      {app.training_programs?.profiles && app.training_programs?.created_at && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 -mt-2">
                          <User className="w-3.5 h-3.5" />
                          <span>Posted by <span className="font-medium text-gray-700">{app.training_programs.profiles.full_name}</span></span>
                          <span className="text-gray-400">•</span>
                          <span>{formatShortDate(app.training_programs.created_at)}</span>
                        </div>
                      )}

                      {/* Training Description (if available) */}
                      {app.training_programs?.description && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {app.training_programs.description}
                        </p>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {app.training_programs?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{app.training_programs.location}</span>
                            </div>
                          )}
                          {app.training_programs?.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{app.training_programs.duration}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Applied {formatRelativeDate(app.submitted_at)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={History}
                          onClick={() => {
                            setSelectedApplicationForHistory(app);
                            setStatusHistoryModalOpen(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View History
                        </Button>
                        {canWithdraw && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Ban}
                            onClick={() => {
                              setSelectedApplication(app);
                              setWithdrawModalOpen(true);
                            }}
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

        {/* Training History Tab */}
        {activeTab === 'completed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Training History ({completedApplications.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
              <span className="ml-3 text-gray-600">Loading certificates...</span>
            </div>
          ) : completedApplications.length === 0 ? (
            <Card className="text-center py-16">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed trainings yet</h3>
              <p className="text-gray-600 mb-4">
                Complete your enrolled trainings to receive certificates!
              </p>
              <Button variant="primary" onClick={() => setActiveTab('enrolled')}>
                View My Enrollments
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedApplications.map((app, index) => {
                const statusConfig = getStatusConfig(app.status);
                const isCertified = app.status === 'certified';
                const isCompleted = app.status === 'completed';
                const isFailed = app.status === 'failed';
                const isDenied = app.status === 'denied';
                const isWithdrawn = app.status === 'withdrawn';
                const isArchived = app.status === 'archived';

                // Status-specific gradient colors
                const gradientColor = isCertified
                  ? 'from-teal-500 to-green-500'
                  : isCompleted
                  ? 'from-blue-500 to-blue-600'
                  : isFailed
                  ? 'from-red-500 to-red-600'
                  : isDenied
                  ? 'from-red-600 to-red-700'
                  : isWithdrawn
                  ? 'from-gray-500 to-gray-600'
                  : isArchived
                  ? 'from-gray-600 to-gray-700'
                  : getCardGradient(index);

                return (
                  <Card key={app.id} variant="interactive" noPadding className="group hover:shadow-xl transition-all duration-300">
                    {/* Status-specific Top Border */}
                    <div className={`h-3 bg-gradient-to-r ${gradientColor}`}></div>

                    <div className="p-6 space-y-4">
                      {/* Header with Icon and Title */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCertified ? 'bg-green-100' : isCompleted ? 'bg-blue-100' : isFailed ? 'bg-red-100' : isDenied ? 'bg-red-100' : isWithdrawn ? 'bg-gray-100' : isArchived ? 'bg-gray-100' : 'bg-gray-100'
                            }`}>
                              {isCertified && <Award className="w-6 h-6 text-green-700" />}
                              {isCompleted && <CheckCircle2 className="w-6 h-6 text-blue-700" />}
                              {isFailed && <XCircle className="w-6 h-6 text-red-700" />}
                              {isDenied && <AlertCircle className="w-6 h-6 text-red-700" />}
                              {isWithdrawn && <Ban className="w-6 h-6 text-gray-600" />}
                              {isArchived && <Archive className="w-6 h-6 text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#22A555] transition-colors mb-1 line-clamp-2">
                                {app.training_programs?.title || 'Program'}
                              </h3>
                              <p className="text-sm text-gray-500">PESO Training</p>
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

                      {/* Certificate Details */}
                      {isCertified && app.certificate_url && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                          <div className="flex items-center gap-2 text-green-800">
                            <Award className="w-5 h-5" />
                            <span className="font-semibold">Certificate Available</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Your certificate is ready for download. This certificate verifies your successful completion of the training program.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              icon={Download}
                              className="flex-1"
                              onClick={() => handleDownloadCertificate(app.certificate_url!, app.id)}
                            >
                              Download Certificate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              onClick={() => handleDownloadCertificate(app.certificate_url!, app.id)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Completed (pending certificate) */}
                      {isCompleted && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">Certificate Pending</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Congratulations on completing the training! Your certificate is being processed and will be available soon.
                          </p>
                        </div>
                      )}

                      {/* Failed */}
                      {isFailed && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800 mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-semibold">Training Not Completed</span>
                          </div>
                          <p className="text-sm text-red-700">
                            Unfortunately, you did not meet the requirements to complete this training. Please contact PESO for more information.
                          </p>
                        </div>
                      )}

                      {/* Denied */}
                      {isDenied && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="font-semibold text-red-800">Application Denied</p>
                          </div>
                          <p className="text-sm text-red-700">
                            Your application was not approved. You may reapply after improving your qualifications or when new slots become available.
                          </p>
                        </div>
                      )}

                      {isWithdrawn && (
                        <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Ban className="w-5 h-5 text-gray-600" />
                            <p className="font-semibold text-gray-800">Application Withdrawn</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            You withdrew this application. You may reapply if slots are still available.
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
                            This application was archived because the training program has been closed or all slots have been filled.
                          </p>
                        </div>
                      )}

                      {/* Posted By Information */}
                      {app.training_programs?.profiles && app.training_programs?.created_at && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          <span>Posted by <span className="font-medium text-gray-700">{app.training_programs.profiles.full_name}</span></span>
                          <span className="text-gray-400">•</span>
                          <span>{formatShortDate(app.training_programs.created_at)}</span>
                        </div>
                      )}

                      {/* Training Description (if available) */}
                      {app.training_programs?.description && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {app.training_programs.description}
                        </p>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {app.training_programs?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{app.training_programs.location}</span>
                            </div>
                          )}
                          {app.training_programs?.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{app.training_programs.duration}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Completed {formatRelativeDate(app.submitted_at)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={History}
                          onClick={() => {
                            setSelectedApplicationForHistory(app);
                            setStatusHistoryModalOpen(true);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                              const program = programs.find(p => p.id === app.program_id);
                              if (program) handleApplyClick(program);
                            }}
                          >
                            Reapply
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FileText}
                          onClick={() => {
                            setSelectedApplication(app);
                            setViewDetailsModalOpen(true);
                          }}
                          className="flex-1"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Application Modal */}
        <ModernModal
          isOpen={applyModalOpen}
          onClose={() => {
            setApplyModalOpen(false);
            setSelectedProgram(null);
          }}
          title={`Apply for ${selectedProgram?.title || 'Training'}`}
          subtitle="Complete your training application"
          colorVariant="green"
          icon={CheckCircle2}
          size="lg"
        >
          {selectedProgram && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Program Info */}
              <div className="bg-[#22A555]/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedProgram.title}</h3>
                <p className="text-sm text-gray-600">{selectedProgram.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedProgram.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedProgram.start_date).toLocaleDateString()}
                  </span>
                  {selectedProgram.profiles && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Created by {selectedProgram.profiles.full_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const formatted = formatPhilippinePhone(e.target.value);
                        setFormData({ ...formData, phone: formatted });
                      }}
                      placeholder="+639123456789"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complete Address <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Barangay, Municipality, Province"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Highest Educational Attainment <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.highest_education}
                      onChange={(e) => setFormData({ ...formData, highest_education: e.target.value })}
                      placeholder="e.g., Bachelor of Science in Information Technology"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ID Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Valid ID Upload</h3>
                <FileUploadWithProgress
                  bucket="id-images"
                  accept="image/*"
                  onUploadComplete={handleImageUpload}
                  label="Upload a clear photo of your valid ID (Driver's License, Passport, etc.)"
                />
                {formData.id_image_url && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">✓ ID uploaded successfully</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setApplyModalOpen(false);
                    setSelectedProgram(null);
                  }}
                  disabled={submitLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  icon={CheckCircle2}
                  loading={submitLoading}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          )}
        </ModernModal>

        {/* View Application Details Modal */}
        <ModernModal
          isOpen={viewDetailsModalOpen}
          onClose={() => {
            setViewDetailsModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Application Details"
          subtitle="View your training application"
          colorVariant="blue"
          icon={FileText}
          size="lg"
        >
          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedApplication.training_programs?.title || 'Training Program'}
                  </h3>
                  <Badge variant={getStatusBadge(selectedApplication.status).variant}>
                    {getStatusBadge(selectedApplication.status).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedApplication.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedApplication.training_programs?.duration && (
                    <div>
                      <p className="text-gray-500 mb-1">Duration</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.training_programs.duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedApplication.status_history && selectedApplication.status_history.length > 0 && (
                <div>
                  <StatusTimeline
                    statusHistory={selectedApplication.status_history}
                    currentStatus={selectedApplication.status}
                  />
                </div>
              )}

              {/* Status-specific information */}
              {selectedApplication.denial_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Denial Reason:</p>
                  <p className="text-sm text-red-700">{selectedApplication.denial_reason}</p>
                </div>
              )}

              {selectedApplication.next_steps && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</p>
                  <p className="text-sm text-blue-700">{selectedApplication.next_steps}</p>
                </div>
              )}

              {selectedApplication.certificate_url && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">Certificate Available</p>
                  <Button
                    variant="success"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadCertificate(selectedApplication.certificate_url!, selectedApplication.id)}
                  >
                    Download Certificate
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setViewDetailsModalOpen(false);
                    setSelectedApplication(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Withdraw Application Modal */}
        <ModernModal
          isOpen={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedApplication(null);
          }}
          title="Withdraw Application"
          subtitle="Confirm withdrawal"
          colorVariant="orange"
          useLogoIcon={true}
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              {/* Warning */}
              <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-800 mb-1">Are you sure?</p>
                    <p className="text-sm text-orange-700">
                      Withdrawing this application cannot be undone. You may reapply later if slots are still available.
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Info Card */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Application Details:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {selectedApplication.training_programs?.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      Applied: {formatShortDate(selectedApplication.submitted_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setWithdrawModalOpen(false);
                    setSelectedApplication(null);
                  }}
                  className="flex-1"
                  disabled={withdrawLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  icon={XCircle}
                  loading={withdrawLoading}
                  onClick={handleWithdrawConfirm}
                  className="flex-1"
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </Button>
              </div>
            </div>
          )}
        </ModernModal>

        {/* Status History Modal */}
        <ModernModal
          isOpen={statusHistoryModalOpen}
          onClose={() => {
            setStatusHistoryModalOpen(false);
            setSelectedApplicationForHistory(null);
          }}
          title="Status History"
          subtitle="Track your application progress"
          colorVariant="blue"
          icon={History}
          size="lg"
        >
          {selectedApplicationForHistory && (
            <div className="space-y-6">
              {/* Application Info Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedApplicationForHistory.training_programs?.title || 'Training Program'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Applied Date</p>
                          <p className="font-medium text-gray-900">
                            {formatShortDate(selectedApplicationForHistory.submitted_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Current Status</p>
                          <p className="font-medium text-gray-900">
                            {getStatusBadge(selectedApplicationForHistory.status).label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                {selectedApplicationForHistory.status_history && selectedApplicationForHistory.status_history.length > 0 ? (
                  <StatusTimeline
                    statusHistory={selectedApplicationForHistory.status_history}
                    currentStatus={selectedApplicationForHistory.status}
                  />
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600 font-medium">No status history available</p>
                    <p className="text-sm text-gray-500 mt-1">Status changes will appear here</p>
                  </div>
                )}
              </div>

              {/* Certificate Download Section */}
              {selectedApplicationForHistory.status === 'certified' && selectedApplicationForHistory.certificate_url && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-green-900 mb-1">Certificate Available!</p>
                        <p className="text-sm text-green-700 mb-3">
                          Your training certificate has been issued. Download it now to add to your credentials.
                        </p>
                        <Button
                          variant="success"
                          size="sm"
                          icon={Download}
                          className="shadow-md"
                          onClick={() => handleDownloadCertificate(selectedApplicationForHistory.certificate_url!, selectedApplicationForHistory.id)}
                        >
                          Download Certificate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="secondary"
                  icon={X}
                  onClick={() => {
                    setStatusHistoryModalOpen(false);
                    setSelectedApplicationForHistory(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </ModernModal>
        </div>
      </Container>
    </AdminLayout>
  );
}
