'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout';
import { Card, EnhancedTable, Button, Input, Textarea, Container, Badge, RefreshButton, DropdownMenu, type DropdownMenuItem } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, EyeOff, Trash2, Briefcase, GraduationCap, CheckCircle2, X, Loader2, AlertCircle, Eye, Archive, Filter } from 'lucide-react';

interface Job {
  id: string;
  position: string;
  degree: string;
  eligibilities: string;
  skills: string;
  experience: string;
  status: string;
  _raw: any;
}

export default function JobManagementPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showUnhideConfirm, setShowUnhideConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobToHide, setJobToHide] = useState<Job | null>(null);
  const [jobToUnhide, setJobToUnhide] = useState<Job | null>(null);
  const [jobToArchive, setJobToArchive] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'archived'>('all');
  const [expandedSkillsCards, setExpandedSkillsCards] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    position: '',
    degree: '',
    eligibilities: '',
    skills: '',
    experience: 'Entry Level (0-1 year)',
    location: 'Asuncion Municipal Hall',
    remote: false,
    employment_type: 'Full-time',
    description: '',
  });

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      const result = await response.json();

      if (result.success) {
        setJobs(result.data.map((job: any) => ({
          id: job.id,
          position: job.title,
          degree: job.degree_requirement,
          eligibilities: job.eligibilities.join(', '),
          skills: job.skills.join(', '),
          experience: job.experience ||
            (job.min_years_experience && job.max_years_experience
              ? `${job.min_years_experience}-${job.max_years_experience} years`
              : 'Not specified'),
          status: job.status === 'active' ? 'Active' : job.status === 'hidden' ? 'Hidden' : 'Archived',
          _raw: job
        })));
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Create job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Build description from form data
      const description = `
Position: ${formData.position}

Degree Requirements:
${formData.degree}

Required Eligibilities:
${formData.eligibilities}

Required Skills:
${formData.skills}

Years of Experience Required: ${formData.experience}

Location: ${formData.location}
Employment Type: ${formData.employment_type}
      `.trim();

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.position,
          description: description,
          degree_requirement: formData.degree,
          eligibilities: formData.eligibilities.split(',').map(e => e.trim()).filter(Boolean),
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          years_of_experience: 0, // Will be calculated from experience string in backend
          experience: formData.experience,
          location: formData.location,
          employment_type: formData.employment_type,
          remote: formData.remote,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Job created successfully!', 'success');
        setShowAddModal(false);
        setFormData({
          position: '',
          degree: '',
          eligibilities: '',
          skills: '',
          experience: 'Entry Level (0-1 year)',
          location: 'Asuncion Municipal Hall',
          remote: false,
          employment_type: 'Full-time',
          description: '',
        });
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      showToast('Failed to create job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit job
  const handleEdit = (job: Job) => {
    setEditingJob(job._raw);
    setFormData({
      position: job._raw.title,
      degree: job._raw.degree_requirement,
      eligibilities: job._raw.eligibilities.join(', '),
      skills: job._raw.skills.join(', '),
      experience: job._raw.experience || `${job._raw.years_of_experience}`,
      location: job._raw.location || 'Asuncion Municipal Hall',
      remote: job._raw.remote || false,
      employment_type: job._raw.employment_type || 'Full-time',
      description: job._raw.description || '',
    });
    setShowEditModal(true);
  };

  // Update job
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingJob) return;

    try {
      setSubmitting(true);

      const description = `
Position: ${formData.position}

Degree Requirements:
${formData.degree}

Required Eligibilities:
${formData.eligibilities}

Required Skills:
${formData.skills}

Years of Experience Required: ${formData.experience}

Location: ${formData.location}
Employment Type: ${formData.employment_type}
      `.trim();

      const response = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.position,
          description: description,
          degree_requirement: formData.degree,
          eligibilities: formData.eligibilities.split(',').map(e => e.trim()).filter(Boolean),
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          years_of_experience: 0, // Will be calculated from experience string in backend
          experience: formData.experience,
          location: formData.location,
          employment_type: formData.employment_type,
          remote: formData.remote,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Job updated successfully!', 'success');
        setShowEditModal(false);
        setEditingJob(null);
        setFormData({
          position: '',
          degree: '',
          eligibilities: '',
          skills: '',
          experience: 'Entry Level (0-1 year)',
          location: 'Asuncion Municipal Hall',
          remote: false,
          employment_type: 'Full-time',
          description: '',
        });
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showToast('Failed to update job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Hide job
  const handleHide = async () => {
    if (!jobToHide) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/jobs/${jobToHide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Job hidden successfully', 'success');
        setShowHideConfirm(false);
        setJobToHide(null);
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      showToast('Failed to hide job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Unhide job (restore to active)
  const handleUnhide = async () => {
    if (!jobToUnhide) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/jobs/${jobToUnhide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Job restored to active successfully', 'success');
        setShowUnhideConfirm(false);
        setJobToUnhide(null);
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      showToast('Failed to restore job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Archive job (soft delete)
  const handleArchive = async () => {
    if (!jobToArchive) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/jobs/${jobToArchive.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message || 'Job archived successfully', 'success');
        setShowArchiveConfirm(false);
        setJobToArchive(null);
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      showToast('Failed to archive job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Permanently delete job (hard delete)
  const handlePermanentDelete = async () => {
    if (!jobToDelete || deleteConfirmText !== 'DELETE') return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/jobs/${jobToDelete.id}?permanent=true`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        const deletedMsg = result.deletedApplications > 0
          ? `Job and ${result.deletedApplications} application(s) permanently deleted`
          : 'Job permanently deleted';
        showToast(deletedMsg, 'success');
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        setDeleteConfirmText('');
        setApplicationCount(0);
        fetchJobs();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      showToast('Failed to permanently delete job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch application count for a job
  const fetchApplicationCount = async (jobId: string) => {
    try {
      const response = await fetch(`/api/applications?job_id=${jobId}`);
      const result = await response.json();
      if (result.success) {
        setApplicationCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error fetching application count:', error);
      setApplicationCount(0);
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

  const columns = [
    {
      header: 'Position',
      accessor: 'position' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#22A555]" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Degree Requirements',
      accessor: 'degree' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Eligibilities',
      accessor: 'eligibilities' as const,
      render: (value: string, row: Job) => {
        const isExpanded = expandedSkillsCards.has(row.id);
        const eligArray = value.split(',').map(e => e.trim());
        const totalCount = eligArray.length;
        const showAll = isExpanded || totalCount <= 2;
        const eligsToShow = showAll ? eligArray : eligArray.slice(0, 2);
        const shownCount = eligsToShow.length;

        return (
          <div className="flex flex-wrap gap-1">
            {eligsToShow.map((elig, idx) => (
              <Badge key={idx} variant="info" className="text-xs">
                {elig}
              </Badge>
            ))}
            {totalCount > 2 && (
              <button
                onClick={() => toggleSkillsExpansion(row.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
                title={isExpanded ? "Click to show less" : "Click to view all eligibilities"}
              >
                {isExpanded ? 'Show less' : `+${totalCount - shownCount} more`}
              </button>
            )}
          </div>
        );
      }
    },
    {
      header: 'Skills',
      accessor: 'skills' as const,
      render: (value: string, row: Job) => {
        const isExpanded = expandedSkillsCards.has(row.id);
        const skillsArray = value.split(',').map(s => s.trim());
        const totalCount = skillsArray.length;
        const showAll = isExpanded || totalCount <= 2;
        const skillsToShow = showAll ? skillsArray : skillsArray.slice(0, 2);
        const shownCount = skillsToShow.length;

        return (
          <div className="flex flex-wrap gap-1">
            {skillsToShow.map((skill, idx) => (
              <Badge key={idx} variant="default" className="text-xs">
                {skill}
              </Badge>
            ))}
            {totalCount > 2 && (
              <button
                onClick={() => toggleSkillsExpansion(row.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer"
                title={isExpanded ? "Click to show less" : "Click to view all skills"}
              >
                {isExpanded ? 'Show less' : `+${totalCount - shownCount} more`}
              </button>
            )}
          </div>
        );
      }
    },
    { header: 'Experience', accessor: 'experience' as const },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string) => {
        if (value === 'Active') {
          return (
            <Badge variant="success" icon={CheckCircle2} className="font-medium">
              Active
            </Badge>
          );
        } else if (value === 'Hidden') {
          return (
            <Badge variant="warning" icon={EyeOff} className="font-medium">
              Hidden from Applicants
            </Badge>
          );
        } else {
          return (
            <Badge variant="default" icon={Archive} className="font-medium">
              Archived
            </Badge>
          );
        }
      }
    },
    {
      header: 'Actions',
      accessor: 'actions' as const,
      render: (_: any, row: Job) => {
        const isActive = row.status === 'Active';
        const isHidden = row.status === 'Hidden';
        const isArchived = row.status === 'Archived';

        const menuItems: DropdownMenuItem[] = [
          {
            label: 'Edit Job',
            icon: Edit,
            onClick: () => handleEdit(row),
            variant: 'warning',
            hidden: isArchived,
          },
          {
            label: 'Hide from Applicants',
            icon: EyeOff,
            onClick: () => {
              setJobToHide(row);
              setShowHideConfirm(true);
            },
            variant: 'warning',
            hidden: !isActive,
          },
          {
            label: isArchived ? 'Restore to Active' : 'Unhide Job',
            icon: Eye,
            onClick: () => {
              setJobToUnhide(row);
              setShowUnhideConfirm(true);
            },
            variant: 'success',
            hidden: isActive,
          },
          {
            label: 'Archive Job',
            icon: Archive,
            onClick: () => {
              setJobToArchive(row);
              setShowArchiveConfirm(true);
            },
            variant: 'danger',
            hidden: isArchived,
          },
          {
            label: 'Permanently Delete',
            icon: Trash2,
            onClick: () => {
              setJobToDelete(row);
              fetchApplicationCount(row.id);
              setShowDeleteConfirm(true);
            },
            variant: 'danger',
            hidden: !isArchived,
          },
        ];

        return <DropdownMenu items={menuItems} />;
      }
    },
  ];

  // Filter jobs based on status
  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return job.status === 'Active';
    if (statusFilter === 'hidden') return job.status === 'Hidden';
    if (statusFilter === 'archived') return job.status === 'Archived';
    return true;
  });

  // Calculate stats
  const activeCount = jobs.filter(j => j.status === 'Active').length;
  const hiddenCount = jobs.filter(j => j.status === 'Hidden').length;
  const archivedCount = jobs.filter(j => j.status === 'Archived').length;
  const totalCount = jobs.length;

  return (
    <AdminLayout role="HR" userName={user?.fullName || "HR Admin"} pageTitle="Job Management" pageDescription="Create and manage job postings">
      <Container size="xl">
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="primary" size="md" icon={Plus} onClick={() => setShowAddModal(true)}>
              Add New Job
            </Button>
            <RefreshButton onRefresh={fetchJobs} label="Refresh" showLastRefresh={true} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Active Jobs */}
            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Hidden Jobs */}
            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hidden Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{hiddenCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <EyeOff className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Archived Jobs */}
            <Card variant="flat" className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Archived Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{archivedCount}</p>
                </div>
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Archive className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            {/* Total Jobs */}
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                statusFilter === 'all'
                  ? 'bg-[#22A555] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#22A555] hover:bg-green-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              All Jobs ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                statusFilter === 'active'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('hidden')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                statusFilter === 'hidden'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-500 hover:bg-orange-50'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              Hidden ({hiddenCount})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                statusFilter === 'archived'
                  ? 'bg-gray-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500 hover:bg-gray-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              Archived ({archivedCount})
            </button>
          </div>

          {/* Job Postings Table */}
          <Card title="JOB POSTINGS" headerColor="bg-[#D4F4DD]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
                <span className="ml-3 text-gray-600">Loading jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {statusFilter === 'all' && 'No jobs found'}
                  {statusFilter === 'active' && 'No active jobs'}
                  {statusFilter === 'hidden' && 'No hidden jobs'}
                  {statusFilter === 'archived' && 'No archived jobs'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all' && 'Create your first job posting to get started'}
                  {statusFilter === 'active' && 'All your active jobs will appear here'}
                  {statusFilter === 'hidden' && 'Jobs you hide will appear here'}
                  {statusFilter === 'archived' && 'Deleted jobs will appear here'}
                </p>
                {statusFilter === 'all' && (
                  <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
                    Add New Job
                  </Button>
                )}
              </div>
            ) : (
              <EnhancedTable
                columns={columns}
                data={filteredJobs}
                searchable
                searchPlaceholder="Search by position, skills, or requirements..."
              />
            )}
          </Card>

          {/* Add Job Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-[#22A555] to-[#1a8045] px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                      <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Create Job Post</h2>
                      <p className="text-sm text-green-100 mt-0.5">Add a new job opportunity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                    disabled={submitting}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                      label="Position/Job Title"
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g., IT Assistant Technician"
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Degree Requirements"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder="e.g., Bachelor of Science in Information Technology"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Eligibilities (comma-separated)"
                      value={formData.eligibilities}
                      onChange={(e) => setFormData({ ...formData, eligibilities: e.target.value })}
                      placeholder="e.g., CS Professional, Certified IT Professional"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Skills (comma-separated)"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g., Programming, Network Administration, Database Management"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white transition-colors"
                        required
                        disabled={submitting}
                      >
                        <option value="Entry Level (0-1 year)">Entry Level (0-1 year)</option>
                        <option value="Junior (1-3 years)">Junior (1-3 years)</option>
                        <option value="Mid-level (3-5 years)">Mid-level (3-5 years)</option>
                        <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                        <option value="Lead (8+ years)">Lead (8+ years)</option>
                        <option value="Expert (10+ years)">Expert (10+ years)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Location"
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          disabled={submitting}
                        />
                        <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.remote}
                            onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                            className="w-4 h-4 text-[#22A555] border-gray-300 rounded focus:ring-[#22A555]"
                            disabled={submitting}
                          />
                          <span>Remote work available</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.employment_type}
                          onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white transition-colors"
                          required
                          disabled={submitting}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Temporary">Temporary</option>
                          <option value="Internship">Internship</option>
                          <option value="Casual">Casual</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        variant="success"
                        icon={Plus}
                        loading={submitting}
                        className="flex-1"
                        disabled={submitting}
                      >
                        {submitting ? 'Creating...' : 'Create Job Post'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        icon={X}
                        className="flex-1"
                        onClick={() => setShowAddModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Job Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                      <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Edit Job Post</h2>
                      <p className="text-sm text-yellow-100 mt-0.5">Update job details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingJob(null);
                    }}
                    className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                    disabled={submitting}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <form onSubmit={handleUpdate} className="space-y-5">
                    <Input
                      label="Position/Job Title"
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="e.g., IT Assistant Technician"
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Degree Requirements"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder="e.g., Bachelor of Science in Information Technology"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Eligibilities (comma-separated)"
                      value={formData.eligibilities}
                      onChange={(e) => setFormData({ ...formData, eligibilities: e.target.value })}
                      placeholder="e.g., CS Professional, Certified IT Professional"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <Textarea
                      label="Skills (comma-separated)"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="e.g., Programming, Network Administration, Database Management"
                      rows={2}
                      required
                      disabled={submitting}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white transition-colors"
                        required
                        disabled={submitting}
                      >
                        <option value="Entry Level (0-1 year)">Entry Level (0-1 year)</option>
                        <option value="Junior (1-3 years)">Junior (1-3 years)</option>
                        <option value="Mid-level (3-5 years)">Mid-level (3-5 years)</option>
                        <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                        <option value="Lead (8+ years)">Lead (8+ years)</option>
                        <option value="Expert (10+ years)">Expert (10+ years)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Location"
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          disabled={submitting}
                        />
                        <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.remote}
                            onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                            className="w-4 h-4 text-[#22A555] border-gray-300 rounded focus:ring-[#22A555]"
                            disabled={submitting}
                          />
                          <span>Remote work available</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.employment_type}
                          onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white transition-colors"
                          required
                          disabled={submitting}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Temporary">Temporary</option>
                          <option value="Internship">Internship</option>
                          <option value="Casual">Casual</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        variant="warning"
                        icon={Edit}
                        loading={submitting}
                        className="flex-1"
                        disabled={submitting}
                      >
                        {submitting ? 'Updating...' : 'Update Job'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        icon={X}
                        className="flex-1"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingJob(null);
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Hide Confirmation Modal */}
          {showHideConfirm && jobToHide && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Hide Job Posting</h3>
                        <p className="text-sm text-white/90">Confirm hiding this job</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowHideConfirm(false);
                        setJobToHide(null);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={submitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Warning Message */}
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800 mb-1">Warning: Hide Job Posting</p>
                        <p className="text-sm text-amber-700">
                          This will hide the job from applicants. They will no longer be able to view or apply to this position.
                        </p>
                        <ul className="text-sm text-amber-700 list-disc list-inside mt-2 space-y-1">
                          <li>Job will be removed from public view</li>
                          <li>Existing applications will be preserved</li>
                          <li>You can restore this job later</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Job to be hidden:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{jobToHide.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{jobToHide.degree}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" />
                        <Badge variant={jobToHide.status === 'Active' ? 'success' : 'warning'} className="text-xs">
                          {jobToHide.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowHideConfirm(false);
                        setJobToHide(null);
                      }}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="warning"
                      icon={EyeOff}
                      loading={submitting}
                      onClick={handleHide}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? 'Hiding...' : 'Hide Job'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Archive Confirmation Modal */}
          {showArchiveConfirm && jobToArchive && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Archive Job Posting</h3>
                        <p className="text-sm text-white/90">Job will be hidden but can be restored</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowArchiveConfirm(false);
                        setJobToArchive(null);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={submitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Info Message */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-800 mb-1">Archiving Job</p>
                        <p className="text-sm text-blue-700">
                          This job will be archived and hidden from applicants. You can restore it later from the Archived tab.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Job to be archived:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{jobToArchive.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{jobToArchive.degree}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowArchiveConfirm(false);
                        setJobToArchive(null);
                      }}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      icon={Archive}
                      loading={submitting}
                      onClick={handleArchive}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? 'Archiving...' : 'Archive Job'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Permanent Delete Confirmation Modal */}
          {showDeleteConfirm && jobToDelete && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">⚠️ Permanently Delete Job</h3>
                        <p className="text-sm text-white/90">This action CANNOT be undone!</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setJobToDelete(null);
                        setDeleteConfirmText('');
                        setApplicationCount(0);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={submitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Critical Warning Message */}
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-900 mb-1">⚠️ CRITICAL WARNING</p>
                        <p className="text-sm text-red-800 font-semibold mb-2">
                          You are about to PERMANENTLY DELETE this job posting from the database.
                        </p>
                        <p className="text-sm text-red-700 mb-2">This will permanently delete:</p>
                        <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                          <li>The job posting: <span className="font-semibold">{jobToDelete.position}</span></li>
                          <li className="font-bold text-red-900">ALL {applicationCount} application(s) for this job</li>
                          <li>All historical data and records</li>
                        </ul>
                        <p className="text-sm text-red-900 font-bold mt-3">
                          This action is IRREVERSIBLE and cannot be undone!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Job to be permanently deleted:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{jobToDelete.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{jobToDelete.degree}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Type <span className="text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">DELETE</span> to confirm permanent deletion:
                    </label>
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="font-mono"
                      disabled={submitting}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setJobToDelete(null);
                        setDeleteConfirmText('');
                        setApplicationCount(0);
                      }}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      icon={Trash2}
                      loading={submitting}
                      onClick={handlePermanentDelete}
                      className="flex-1"
                      disabled={submitting || deleteConfirmText !== 'DELETE'}
                    >
                      {submitting ? 'Deleting...' : 'Permanently Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unhide Confirmation Modal */}
          {showUnhideConfirm && jobToUnhide && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Restore Job Posting</h3>
                        <p className="text-sm text-white/90">Make job visible to applicants</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUnhideConfirm(false);
                        setJobToUnhide(null);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={submitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Info Message */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800 mb-1">Restore Job to Active</p>
                        <p className="text-sm text-green-700">
                          This will make the job posting visible and allow applicants to view and apply.
                        </p>
                        <ul className="text-sm text-green-700 list-disc list-inside mt-2 space-y-1">
                          <li>Job will appear in public listings</li>
                          <li>Applicants can apply to this position</li>
                          <li>Previous applications will be retained</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Job to be restored:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{jobToUnhide.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{jobToUnhide.degree}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-gray-400" />
                        <Badge variant="warning" className="text-xs">
                          {jobToUnhide.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowUnhideConfirm(false);
                        setJobToUnhide(null);
                      }}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="success"
                      icon={Eye}
                      loading={submitting}
                      onClick={handleUnhide}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? 'Restoring...' : 'Restore Job'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </AdminLayout>
  );
}
