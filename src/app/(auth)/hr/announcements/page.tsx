'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout';
import { Card, Button, Input, Textarea, FileUploadWithProgress, Container, Badge, RefreshButton } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Calendar, Image as ImageIcon, Send, Megaphone, Loader2, Plus, Edit, TrendingUp, Briefcase, GraduationCap, Bell, FileText, X, Archive, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AnnouncementPreviewModal } from '@/components/hr/AnnouncementPreviewModal';

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  status: string;
  created_by: string;
  published_at: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    imageUrl: '',
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToArchive, setAnnouncementToArchive] = useState<Announcement | null>(null);
  const [announcementToRestore, setAnnouncementToRestore] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all announcements (both active and archived)
      const response = await fetch('/api/announcements?status=all');
      const result = await response.json();

      if (result.success) {
        setAnnouncements(result.data);
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Calculate stats
  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.status === 'active').length,
    jobOpenings: announcements.filter(a => a.category === 'job_opening').length,
    archived: announcements.filter(a => a.status === 'archived').length,
  };

  // Filter announcements by status and category
  const filteredAnnouncements = announcements
    .filter(a => {
      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return a.status === 'active';
      if (statusFilter === 'archived') return a.status === 'archived';
      return true;
    })
    .filter(a => {
      // Category filter
      if (categoryFilter === 'all') return true;
      return a.category === categoryFilter;
    });

  // Handle image upload
  const handleImageUpload = (data: {
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }) => {
    setFormData({ ...formData, imageUrl: data.fileUrl });
  };

  // Handle form submit (create)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          image_url: formData.imageUrl || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Announcement posted successfully!', 'success');
        setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
        setShowCreateModal(false);
        fetchAnnouncements();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error posting announcement:', error);
      showToast('Failed to post announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      imageUrl: announcement.image_url || '',
    });
    setShowEditModal(true);
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAnnouncement) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          image_url: formData.imageUrl || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Announcement updated successfully!', 'success');
        setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
        setShowEditModal(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      showToast('Failed to update announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Archive announcement (soft delete)
  const handleArchive = async () => {
    if (!announcementToArchive) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/announcements/${announcementToArchive.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast('Announcement archived successfully', 'success');
        setShowArchiveConfirm(false);
        setAnnouncementToArchive(null);
        fetchAnnouncements();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error archiving announcement:', error);
      showToast('Failed to archive announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Restore announcement (unhide)
  const handleRestore = async () => {
    if (!announcementToRestore) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/announcements/${announcementToRestore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementToRestore.title,
          description: announcementToRestore.description,
          category: announcementToRestore.category,
          image_url: announcementToRestore.image_url,
          status: 'active',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Announcement restored to active successfully', 'success');
        setShowRestoreConfirm(false);
        setAnnouncementToRestore(null);
        fetchAnnouncements();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error restoring announcement:', error);
      showToast('Failed to restore announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Permanently delete announcement
  const handlePermanentDelete = async () => {
    if (!announcementToDelete || deleteConfirmText !== 'DELETE') return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/announcements/${announcementToDelete.id}?permanent=true`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast('Announcement permanently deleted', 'success');
        setShowDeleteConfirm(false);
        setAnnouncementToDelete(null);
        setDeleteConfirmText('');
        fetchAnnouncements();
      } else {
        showToast(getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      console.error('Error permanently deleting announcement:', error);
      showToast('Failed to permanently delete announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_opening': return 'bg-blue-100 text-blue-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'notice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'job_opening': return 'Job Opening';
      case 'training': return 'Training';
      case 'notice': return 'Notice';
      default: return 'General';
    }
  };

  return (
    <AdminLayout role="HR" userName={user?.fullName || "HR Admin"} pageTitle="Announcements" pageDescription="Post job announcements and notices">
      <Container size="xl" className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <Button
            variant="success"
            size="lg"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            New Announcement
          </Button>
          <RefreshButton onRefresh={fetchAnnouncements} label="Refresh" showLastRefresh={true} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Announcements</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-gray-600 mb-1">Job Openings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.jobOpenings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card variant="flat" className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-500">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-gray-600 mb-1">Archived</p>
                <p className="text-3xl font-bold text-gray-900">{stats.archived}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                <Archive className="w-6 h-6 text-white" />
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
            <Megaphone className="w-4 h-4" />
            All Announcements ({stats.total})
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
            Active ({stats.active})
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
            Archived ({stats.archived})
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-[#22A555] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All ({announcements.length})
          </button>
          <button
            onClick={() => setCategoryFilter('job_opening')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === 'job_opening'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Job Opening ({announcements.filter(a => a.category === 'job_opening').length})
          </button>
          <button
            onClick={() => setCategoryFilter('training')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === 'training'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Training ({announcements.filter(a => a.category === 'training').length})
          </button>
          <button
            onClick={() => setCategoryFilter('notice')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === 'notice'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Notice ({announcements.filter(a => a.category === 'notice').length})
          </button>
          <button
            onClick={() => setCategoryFilter('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === 'general'
                ? 'bg-gray-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            General ({announcements.filter(a => a.category === 'general').length})
          </button>
        </div>

        {/* Announcements Grid */}
        <Card title="ANNOUNCEMENTS" headerColor="bg-[#D4F4DD]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#22A555] animate-spin" />
              <span className="ml-3 text-gray-600">Loading announcements...</span>
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredAnnouncements.map((item) => (
                <Card key={item.id} variant="interactive" noPadding className="group hover:shadow-2xl transition-all duration-300 h-full flex flex-col min-h-[480px] cursor-pointer"
                  onClick={() => {
                    setSelectedAnnouncement(item);
                    setShowPreviewModal(true);
                  }}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden group-hover:from-gray-300 group-hover:to-gray-400 transition-all">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getCategoryColor(item.category)}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Title */}
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#22A555] transition-colors line-clamp-2 mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {item.description}
                    </p>

                    {/* Spacer to push content down */}
                    <div className="flex-1" />

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 py-3 border-t border-gray-100">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {item.status === 'active' ? (
                        <>
                          {/* Active announcements: Edit + Archive */}
                          <Button
                            variant="warning"
                            size="sm"
                            icon={Edit}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Archive}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnnouncementToArchive(item);
                              setShowArchiveConfirm(true);
                            }}
                          >
                            Archive
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Archived announcements: Restore + Delete */}
                          <Button
                            variant="success"
                            size="sm"
                            icon={Eye}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnnouncementToRestore(item);
                              setShowRestoreConfirm(true);
                            }}
                          >
                            Restore
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnnouncementToDelete(item);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Megaphone className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements found</h3>
              <p className="text-gray-600 mb-4">
                {categoryFilter === 'all'
                  ? 'Create your first announcement to get started'
                  : `No announcements in the ${getCategoryLabel(categoryFilter)} category`
                }
              </p>
              <Button
                variant="success"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Create Announcement
              </Button>
            </div>
          )}
        </Card>
      </Container>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22A555] to-[#1a8045] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                  <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Announcement</h2>
                  <p className="text-sm text-green-100 mt-0.5">Share important updates and job openings</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
                }}
                className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                disabled={submitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-5">
                <Input
                  label="Title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  required
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] transition-colors"
                    disabled={submitting}
                  >
                    <option value="general">General</option>
                    <option value="job_opening">Job Opening</option>
                    <option value="training">Training</option>
                    <option value="notice">Notice</option>
                  </select>
                </div>

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter announcement description"
                  rows={5}
                  required
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Upload Image (Optional)
                  </label>
                  <FileUploadWithProgress
                    bucket="announcements"
                    onUploadComplete={handleImageUpload}
                    accept="image/jpeg,image/jpg,image/png"
                  />
                  {formData.imageUrl && (
                    <p className="text-sm text-[#22A555] mt-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image uploaded successfully
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  icon={Send}
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Posting...' : 'Post Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && editingAnnouncement && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                  <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Announcement</h2>
                  <p className="text-sm text-blue-100 mt-0.5">Update announcement details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                  setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
                }}
                className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                disabled={submitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUpdate} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-5">
                <Input
                  label="Title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  required
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] transition-colors"
                    disabled={submitting}
                  >
                    <option value="general">General</option>
                    <option value="job_opening">Job Opening</option>
                    <option value="training">Training</option>
                    <option value="notice">Notice</option>
                  </select>
                </div>

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter announcement description"
                  rows={5}
                  required
                  disabled={submitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Upload Image (Optional)
                  </label>
                  <FileUploadWithProgress
                    bucket="announcements"
                    onUploadComplete={handleImageUpload}
                    accept="image/jpeg,image/jpg,image/png"
                  />
                  {formData.imageUrl && (
                    <p className="text-sm text-[#22A555] mt-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image uploaded successfully
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAnnouncement(null);
                    setFormData({ title: '', description: '', category: 'general', imageUrl: '' });
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  icon={Send}
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Updating...' : 'Update Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && announcementToArchive && (
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
                    <h3 className="text-xl font-bold text-white">Archive Announcement</h3>
                    <p className="text-sm text-white/90">Hidden but can be restored</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowArchiveConfirm(false);
                    setAnnouncementToArchive(null);
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
                    <p className="font-semibold text-blue-800 mb-1">Archiving Announcement</p>
                    <p className="text-sm text-blue-700">
                      This announcement will be archived and hidden from public view. You can restore it later from the Archived tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* Announcement Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Announcement to be archived:</p>
                <div className="flex items-start gap-3">
                  {announcementToArchive.image_url ? (
                    <img
                      src={announcementToArchive.image_url}
                      alt={announcementToArchive.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{announcementToArchive.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcementToArchive.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(announcementToArchive.category)}`}>
                        {getCategoryLabel(announcementToArchive.category)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowArchiveConfirm(false);
                    setAnnouncementToArchive(null);
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  icon={Archive}
                  loading={submitting}
                  onClick={handleArchive}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Archiving...' : 'Archive Announcement'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && announcementToRestore && (
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
                    <h3 className="text-xl font-bold text-white">Restore Announcement</h3>
                    <p className="text-sm text-white/90">Make announcement public again</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRestoreConfirm(false);
                    setAnnouncementToRestore(null);
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
                    <p className="font-semibold text-green-800 mb-1">Restore to Active</p>
                    <p className="text-sm text-green-700">
                      This will make the announcement visible and active again.
                    </p>
                  </div>
                </div>
              </div>

              {/* Announcement Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Announcement to be restored:</p>
                <div className="flex items-start gap-3">
                  {announcementToRestore.image_url ? (
                    <img
                      src={announcementToRestore.image_url}
                      alt={announcementToRestore.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{announcementToRestore.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcementToRestore.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(announcementToRestore.category)}`}>
                        {getCategoryLabel(announcementToRestore.category)}
                      </span>
                      <Badge variant="default" className="text-xs">
                        Archived
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowRestoreConfirm(false);
                    setAnnouncementToRestore(null);
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="success"
                  icon={Eye}
                  loading={submitting}
                  onClick={handleRestore}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Restoring...' : 'Restore Announcement'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteConfirm && announcementToDelete && (
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
                    <h3 className="text-xl font-bold text-white">⚠️ Permanently Delete</h3>
                    <p className="text-sm text-white/90">This action CANNOT be undone!</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAnnouncementToDelete(null);
                    setDeleteConfirmText('');
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
              {/* Critical Warning */}
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 mb-1">⚠️ CRITICAL WARNING</p>
                    <p className="text-sm text-red-800 font-semibold mb-2">
                      You are about to PERMANENTLY DELETE this announcement from the database.
                    </p>
                    <p className="text-sm text-red-700">
                      All data will be irreversibly removed. This action cannot be undone!
                    </p>
                  </div>
                </div>
              </div>

              {/* Announcement Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Announcement to be permanently deleted:</p>
                <div className="flex items-start gap-3">
                  {announcementToDelete.image_url ? (
                    <img
                      src={announcementToDelete.image_url}
                      alt={announcementToDelete.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{announcementToDelete.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcementToDelete.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(announcementToDelete.category)}`}>
                        {getCategoryLabel(announcementToDelete.category)}
                      </span>
                    </div>
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
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAnnouncementToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  icon={Trash2}
                  loading={submitting}
                  onClick={handlePermanentDelete}
                  disabled={submitting || deleteConfirmText !== 'DELETE'}
                  className="flex-1"
                >
                  {submitting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Preview Modal */}
      <AnnouncementPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedAnnouncement(null);
        }}
        announcement={selectedAnnouncement}
        onEdit={() => {
          if (selectedAnnouncement) {
            handleEdit(selectedAnnouncement);
          }
        }}
        onArchive={() => {
          if (selectedAnnouncement) {
            setAnnouncementToArchive(selectedAnnouncement);
            setShowArchiveConfirm(true);
          }
        }}
        onRestore={() => {
          if (selectedAnnouncement) {
            setAnnouncementToRestore(selectedAnnouncement);
            setShowRestoreConfirm(true);
          }
        }}
        onDelete={() => {
          if (selectedAnnouncement) {
            setAnnouncementToDelete(selectedAnnouncement);
            setShowDeleteConfirm(true);
          }
        }}
      />
    </AdminLayout>
  );
}
