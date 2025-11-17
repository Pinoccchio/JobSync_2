'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/layout';
import { Card, EnhancedTable, Button, Input, Textarea, Container, Badge, RefreshButton, ModernModal } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, GraduationCap, FileText, Clock, Users, Calendar, X, CheckCircle2, AlertCircle, Briefcase, Archive, Loader2, Filter, Undo2 } from 'lucide-react';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  schedule?: string;
  capacity: number;
  enrolled_count: number;
  location?: string;
  start_date: string;
  end_date?: string;
  skills_covered?: string[];
  icon?: string;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled' | 'archived';
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function PESOProgramsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed' | 'cancelled' | 'archived'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<TrainingProgram | null>(null);
  const [archivingProgram, setArchivingProgram] = useState<TrainingProgram | null>(null);
  const [restoringProgram, setRestoringProgram] = useState<TrainingProgram | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    schedule: '',
    capacity: '',
    location: '',
    start_date: '',
    end_date: '',
    skills_covered: '',
  });

  // Fetch training programs
  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/programs?status=all');
      const result = await response.json();

      if (result.success) {
        setPrograms(result.data);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      showToast('Failed to fetch programs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '',
      schedule: '',
      capacity: '',
      location: '',
      start_date: '',
      end_date: '',
      skills_covered: '',
    });
  };

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.duration || !formData.capacity || !formData.start_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const skillsArray = formData.skills_covered
        ? formData.skills_covered.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const response = await fetch('/api/training/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills_covered: skillsArray,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Training program created successfully', 'success');
        setShowAddModal(false);
        resetForm();
        fetchPrograms();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      showToast('Failed to create program', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (program: TrainingProgram) => {
    setEditingProgram(program);
    setFormData({
      title: program.title,
      description: program.description,
      duration: program.duration,
      schedule: program.schedule || '',
      capacity: program.capacity.toString(),
      location: program.location || '',
      start_date: program.start_date,
      end_date: program.end_date || '',
      skills_covered: program.skills_covered?.join(', ') || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProgram) return;

    try {
      setSubmitting(true);

      const skillsArray = formData.skills_covered
        ? formData.skills_covered.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const response = await fetch(`/api/training/programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills_covered: skillsArray,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Training program updated successfully', 'success');
        setShowEditModal(false);
        setEditingProgram(null);
        resetForm();
        fetchPrograms();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error updating program:', error);
      showToast('Failed to update program', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle archive
  const handleArchiveClick = (program: TrainingProgram) => {
    setArchivingProgram(program);
    setShowArchiveConfirm(true);
  };

  const handleArchive = async () => {
    if (!archivingProgram) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/training/programs/${archivingProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...archivingProgram,
          status: 'archived',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Training program archived successfully', 'success');
        setShowArchiveConfirm(false);
        setArchivingProgram(null);
        fetchPrograms();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error archiving program:', error);
      showToast('Failed to archive program', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle restore
  const handleRestoreClick = (program: TrainingProgram) => {
    setRestoringProgram(program);
    setShowRestoreConfirm(true);
  };

  const handleRestore = async () => {
    if (!restoringProgram) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/training/programs/${restoringProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restoringProgram,
          status: 'active',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Training program restored successfully', 'success');
        setShowRestoreConfirm(false);
        setRestoringProgram(null);
        fetchPrograms();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error restoring program:', error);
      showToast('Failed to restore program', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (program: TrainingProgram) => {
    setDeletingProgram(program);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingProgram) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/training/programs/${deletingProgram.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast('Training program deleted successfully', 'success');
        setShowDeleteConfirm(false);
        setDeletingProgram(null);
        fetchPrograms();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      showToast('Failed to delete program', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const stats = {
    total: programs.length,
    active: programs.filter(p => p.status === 'active').length,
    upcoming: programs.filter(p => p.status === 'upcoming').length,
    completed: programs.filter(p => p.status === 'completed').length,
    cancelled: programs.filter(p => p.status === 'cancelled').length,
    archived: programs.filter(p => p.status === 'archived').length,
    totalEnrolled: programs.reduce((sum, p) => sum + p.enrolled_count, 0),
    totalCapacity: programs.reduce((sum, p) => sum + p.capacity, 0),
  };

  // Filter programs by status
  const filteredPrograms = programs.filter(p => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  // Helper function to get program status badge configuration
  const getProgramStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'success' as const, icon: CheckCircle2, label: 'Active' };
      case 'upcoming':
        return { variant: 'info' as const, icon: Clock, label: 'Upcoming' };
      case 'completed':
        return { variant: 'secondary' as const, icon: Archive, label: 'Completed' };
      case 'cancelled':
        return { variant: 'danger' as const, icon: X, label: 'Cancelled' };
      case 'archived':
        return { variant: 'secondary' as const, icon: Archive, label: 'Archived' };
      default:
        return { variant: 'secondary' as const, icon: AlertCircle, label: status };
    }
  };

  // Table columns
  const columns = [
    {
      header: 'Program Name',
      accessor: 'title' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#22A555]" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 line-clamp-2">{value}</span>
        </div>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Capacity',
      accessor: 'capacity' as const,
      render: (value: number, row: TrainingProgram) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{row.enrolled_count} / {value}</span>
        </div>
      )
    },
    {
      header: 'Start Date',
      accessor: 'start_date' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string) => {
        const statusBadge = getProgramStatusBadge(value);
        return (
          <Badge variant={statusBadge.variant} icon={statusBadge.icon}>
            {statusBadge.label}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'id' as const,
      render: (_: string, row: TrainingProgram) => {
        const isArchived = row.status === 'archived';

        return (
          <div className="flex gap-2 flex-wrap">
            {/* Non-archived programs: Edit + Archive */}
            {!isArchived && (
              <>
                <Button variant="warning" size="sm" icon={Edit} onClick={() => handleEdit(row)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" icon={Archive} onClick={() => handleArchiveClick(row)}>
                  Archive
                </Button>
              </>
            )}

            {/* Archived programs: Restore + Delete */}
            {isArchived && (
              <>
                <Button variant="success" size="sm" icon={Undo2} onClick={() => handleRestoreClick(row)}>
                  Restore
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(row)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <AdminLayout
      role="PESO"
      userName={user?.fullName || 'PESO Admin'}
      pageTitle="Training Programs"
      pageDescription="Manage job training programs and courses"
    >
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-[#22A555]" />
              Training Programs
            </h1>
            <p className="text-gray-600 mt-1">Manage job training programs and courses</p>
          </div>
          <div className="flex gap-3">
            <RefreshButton onRefresh={fetchPrograms} label="Refresh" showLastRefresh={true} />
            <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
              Add New Program
            </Button>
          </div>
        </div>

        {/* Stats Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Programs</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Enrolled</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalEnrolled}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Capacity Remaining</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalCapacity - stats.totalEnrolled}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Archived</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.archived}</p>
              </div>
              <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter by Status:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active ({stats.active})
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'secondary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed ({stats.completed})
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('cancelled')}
            >
              Cancelled ({stats.cancelled})
            </Button>
            <Button
              variant={statusFilter === 'archived' ? 'secondary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('archived')}
            >
              <Archive className="w-4 h-4" />
              Archived ({stats.archived})
            </Button>
          </div>
        </div>

        {/* Programs Table */}
        <Card title="TRAINING PROGRAMS" headerColor="bg-[#D4F4DD]" variant="elevated" className="hover:shadow-xl transition-shadow">
          <EnhancedTable
            data={filteredPrograms}
            columns={columns}
            searchable={true}
            paginated={true}
            pageSize={10}
            searchPlaceholder="Search programs..."
          />
        </Card>

        {/* Add Program Modal */}
        <ModernModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          title="Create Training Program"
          subtitle="Add a new job training program"
          colorVariant="green"
          icon={GraduationCap}
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Program Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Web Development Training"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the training program..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Duration *</label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 3 months"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Capacity *</label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="e.g., 25"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Start Date *</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Schedule</label>
                  <Input
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., Mon-Fri, 9:00 AM - 5:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., PESO Training Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Skills Covered</label>
                  <Input
                    value={formData.skills_covered}
                    onChange={(e) => setFormData({ ...formData, skills_covered: e.target.value })}
                    placeholder="e.g., HTML, CSS, JavaScript (comma-separated)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" icon={CheckCircle2} loading={submitting} className="flex-1">
                    {submitting ? 'Creating...' : 'Create Program'}
                  </Button>
                </div>
              </form>
        </ModernModal>

        {/* Edit Program Modal */}
        <ModernModal
          isOpen={showEditModal && editingProgram !== null}
          onClose={() => { setShowEditModal(false); setEditingProgram(null); resetForm(); }}
          title="Edit Training Program"
          subtitle="Update program details"
          colorVariant="orange"
          icon={Edit}
          size="lg"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Program Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Web Development Training"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the training program..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Duration *</label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 3 months"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Capacity *</label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="e.g., 25"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Start Date *</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Schedule</label>
                  <Input
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., Mon-Fri, 9:00 AM - 5:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., PESO Training Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Skills Covered</label>
                  <Input
                    value={formData.skills_covered}
                    onChange={(e) => setFormData({ ...formData, skills_covered: e.target.value })}
                    placeholder="e.g., HTML, CSS, JavaScript (comma-separated)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditingProgram(null); resetForm(); }} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" variant="warning" icon={CheckCircle2} loading={submitting} className="flex-1">
                    {submitting ? 'Updating...' : 'Update Program'}
                  </Button>
                </div>
              </form>
        </ModernModal>

        {/* Archive Confirmation Modal */}
        <ModernModal
          isOpen={showArchiveConfirm && archivingProgram !== null}
          onClose={() => { setShowArchiveConfirm(false); setArchivingProgram(null); }}
          title="Archive Training Program"
          subtitle="Program can be restored later"
          colorVariant="orange"
          icon={Archive}
          size="md"
        >
          {archivingProgram && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Are you sure you want to archive "<strong>{archivingProgram.title}</strong>"? You can restore it later from the Archived tab.
              </p>

              <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => { setShowArchiveConfirm(false); setArchivingProgram(null); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="warning"
                    icon={Archive}
                    loading={submitting}
                    onClick={handleArchive}
                    className="flex-1"
                  >
                    {submitting ? 'Archiving...' : 'Archive Program'}
                  </Button>
                </div>
            </div>
          )}
        </ModernModal>

        {/* Restore Confirmation Modal */}
        <ModernModal
          isOpen={showRestoreConfirm && restoringProgram !== null}
          onClose={() => { setShowRestoreConfirm(false); setRestoringProgram(null); }}
          title="Restore Training Program"
          subtitle="Reactivate archived program"
          colorVariant="green"
          icon={Undo2}
          size="md"
        >
          {restoringProgram && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Are you sure you want to restore "<strong>{restoringProgram.title}</strong>"? It will be marked as active again.
              </p>

              <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => { setShowRestoreConfirm(false); setRestoringProgram(null); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    icon={Undo2}
                    loading={submitting}
                    onClick={handleRestore}
                    className="flex-1"
                  >
                    {submitting ? 'Restoring...' : 'Restore Program'}
                  </Button>
                </div>
            </div>
          )}
        </ModernModal>

        {/* Delete Confirmation Modal */}
        <ModernModal
          isOpen={showDeleteConfirm && deletingProgram !== null}
          onClose={() => { setShowDeleteConfirm(false); setDeletingProgram(null); }}
          title="Delete Training Program"
          subtitle="This action cannot be undone"
          colorVariant="red"
          icon={Trash2}
          size="md"
        >
          {deletingProgram && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Are you sure you want to permanently delete "<strong>{deletingProgram.title}</strong>"? This action cannot be undone.
              </p>

              <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => { setShowDeleteConfirm(false); setDeletingProgram(null); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    loading={submitting}
                    onClick={handleDelete}
                    className="flex-1"
                  >
                    {submitting ? 'Deleting...' : 'Delete Program'}
                  </Button>
                </div>
            </div>
          )}
        </ModernModal>
      </Container>
    </AdminLayout>
  );
}
