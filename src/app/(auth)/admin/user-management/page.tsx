'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout';
import {
  Avatar, Card, EnhancedTable, Button, Container, Badge, Input, RefreshButton,
  EventIcon, EventBadge, StatusIndicator, ImagePreviewModal
} from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
// import { useTableRealtime } from '@/hooks/useTableRealtime'; // REMOVED: Realtime disabled
import { supabase } from '@/lib/supabase/auth';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import {
  UserPlus, UserX, Trash2, User as UserIcon, Mail, Shield, Calendar, X,
  CheckCircle2, AlertCircle, Eye, Loader2, Briefcase, Building, Clock, Activity
} from 'lucide-react';
import { getEventConfig, type EventCategory } from '@/lib/activityEventConfig';
import type { User, CreateUserRequest } from '@/types/users';

interface ActivityLog {
  id: string;
  event_type: string;
  event_category: EventCategory;
  user_email: string | null;
  timestamp: string;
}

export default function UserManagementPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToChangeStatus, setUserToChangeStatus] = useState<User | null>(null);
  const [statusChangeType, setStatusChangeType] = useState<'activate' | 'deactivate'>('activate');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [formData, setFormData] = useState<CreateUserRequest>({
    role: 'ADMIN',
    fullName: '',
    email: '',
    password: '',
  });

  // Filter states
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Image Preview Modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewUserName, setPreviewUserName] = useState<string>('');

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data.users);
      showToast('Users loaded successfully', 'success');
    } catch (error) {
      console.error('Fetch users error:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch recent user management activities
  const fetchRecentActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, event_type, event_category, user_email, timestamp')
        .eq('event_category', 'user_management')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentActivities(data as ActivityLog[]);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  // Load users and activities on mount
  useEffect(() => {
    fetchUsers();
    fetchRecentActivities();
  }, [fetchUsers, fetchRecentActivities]);

  // REMOVED: Real-time subscriptions disabled for performance
  // useTableRealtime('profiles', ['INSERT', 'UPDATE', 'DELETE'], null, () => {
  //   showToast('User profile updated', 'info');
  //   fetchUsers();
  // });

  // useTableRealtime('activity_logs', ['INSERT'], 'event_category=eq.user_management', () => {
  //   fetchRecentActivities();
  // });

  // Handle avatar click to show image preview
  const handleAvatarClick = (imageUrl: string | null, userName: string) => {
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setPreviewUserName(userName);
      setShowImagePreview(true);
    }
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.fullName || !formData.email || !formData.password) {
        throw new Error('All fields are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Invalid email format');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Get session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      showToast(result.message || 'User created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ role: 'ADMIN', fullName: '', email: '', password: '' });
      fetchUsers();
      fetchRecentActivities();
    } catch (error) {
      console.error('Create user error:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show confirmation modal for status toggle
  const handleToggleStatus = (user: User, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUserToChangeStatus(user);
    setStatusChangeType(newStatus === 'active' ? 'activate' : 'deactivate');
    setStatusChangeReason('');
    setShowStatusChangeModal(true);
  };

  // Confirm and execute status change
  const handleConfirmStatusChange = async () => {
    if (!userToChangeStatus) return;

    setIsSubmitting(true);
    try {
      // Get session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authentication token');
      }

      const newStatus = statusChangeType === 'activate' ? 'active' : 'inactive';

      const response = await fetch(`/api/admin/users/${userToChangeStatus.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: statusChangeReason || undefined
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      showToast(`User ${statusChangeType}d successfully`, 'success');
      setShowStatusChangeModal(false);
      setUserToChangeStatus(null);
      setStatusChangeReason('');
      fetchUsers();
      fetchRecentActivities();
    } catch (error) {
      console.error('Status change error:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsSubmitting(true);
    try {
      // Get session from Supabase client
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      showToast('User deleted successfully', 'success');

      // Reset loading state FIRST to prevent stuck loading
      setIsSubmitting(false);

      // Then close modal and clear selection
      setShowDeleteConfirm(false);
      setUserToDelete(null);

      // Finally refresh data
      fetchUsers();
      fetchRecentActivities();
    } catch (error) {
      console.error('Delete user error:', error);
      showToast(getErrorMessage(error), 'error');
      setIsSubmitting(false);
    }
  };

  // Enhanced role badge with semantic colors
  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'ADMIN': return 'system'; // Purple
      case 'HR': return 'created'; // Emerald
      case 'PESO': return 'upload'; // Teal
      case 'APPLICANT': return 'deactivated'; // Amber
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return Shield;
      case 'HR': return Briefcase;
      case 'PESO': return Building;
      default: return UserIcon;
    }
  };

  // Helper function to check if action is restricted
  const isActionRestricted = (targetUser: User, action: 'delete' | 'deactivate') => {
    // RULE 1: Cannot perform actions on other ADMIN accounts
    if (targetUser.role === 'ADMIN' && targetUser.id !== currentUser?.id) {
      return true;
    }
    // RULE 2: Cannot delete your own account
    if (action === 'delete' && targetUser.id === currentUser?.id) {
      return true;
    }
    // RULE 3: Cannot deactivate ANY admin account (including yourself)
    // This prevents admins from locking themselves out
    if (action === 'deactivate' && targetUser.role === 'ADMIN') {
      return true;
    }
    return false;
  };

  // Check if user was created recently (< 24 hours)
  const isNewUser = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesRole && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'ADMIN' || u.role === 'HR' || u.role === 'PESO').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'full_name' as const,
      render: (value: string, row: User) => (
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={row.profile_image_url}
            userName={value}
            size="sm"
            onClick={() => handleAvatarClick(row.profile_image_url, value)}
            clickable
          />
          <div>
            <span className="font-medium text-gray-900">{value}</span>
            {isNewUser(row.created_at) && (
              <Badge variant="created" size="sm" className="ml-2">NEW</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role' as const,
      render: (value: string) => {
        const RoleIcon = getRoleIcon(value);
        return (
          <div className="flex items-center gap-2">
            <RoleIcon className="w-4 h-4 text-gray-400" />
            <Badge variant={getRoleBadgeVariant(value)}>{value}</Badge>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <StatusIndicator
            severity={value === 'active' ? 'low' : 'medium'}
            pulse={value === 'active'}
            size="md"
          />
          <Badge
            variant={value === 'active' ? 'success' : 'default'}
            icon={value === 'active' ? CheckCircle2 : AlertCircle}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        </div>
      )
    },
    {
      header: 'Created Date',
      accessor: 'created_at' as const,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id' as const,
      render: (_: any, row: User) => {
        const canDelete = !isActionRestricted(row, 'delete');
        const canDeactivate = !isActionRestricted(row, 'deactivate');

        return (
          <div className="flex gap-2">
            {/* View Details Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={() => {
                setSelectedUser(row);
                setShowDetailsModal(true);
              }}
            >
              View
            </Button>

            {/* Activate/Deactivate Button */}
            {row.role !== 'APPLICANT' && (
              <Button
                variant={row.status === 'active' ? 'warning' : 'success'}
                size="sm"
                icon={row.status === 'active' ? UserX : CheckCircle2}
                onClick={() => handleToggleStatus(row, row.status)}
                disabled={
                  (row.status === 'active' && !canDeactivate) ||
                  (row.status === 'inactive' && row.role === 'ADMIN')
                }
                className={
                  ((row.status === 'active' && !canDeactivate) ||
                  (row.status === 'inactive' && row.role === 'ADMIN'))
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }
              >
                {row.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}

            {/* Delete Button */}
            {row.role !== 'APPLICANT' && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  if (canDelete) {
                    setUserToDelete(row);
                    setShowDeleteConfirm(true);
                  }
                }}
                disabled={!canDelete}
                className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Delete
              </Button>
            )}
          </div>
        );
      }
    },
  ];

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <AdminLayout
      role="Admin"
      userName={currentUser?.fullName || 'System Admin'}
      pageTitle="User Management"
      pageDescription="Create and manage admin accounts with advanced controls"
    >
      <Container size="xl">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="flat" className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-[#22A555] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Admin Accounts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card variant="flat" className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactive Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserX className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <RefreshButton onRefresh={async () => { await fetchUsers(); await fetchRecentActivities(); }} label="Refresh" showLastRefresh={true} />

              {/* Filters */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="PESO">PESO</option>
                <option value="APPLICANT">APPLICANT</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Button variant="success" icon={UserPlus} onClick={() => setShowCreateModal(true)}>
              Create Admin Account
            </Button>
          </div>

          {/* Users Table */}
          <Card title={`USER ACCOUNTS (${filteredUsers.length})`} headerColor="bg-[#D4F4DD]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#22A555]" />
                  <p className="text-sm text-gray-500">Loading users...</p>
                </div>
              </div>
            ) : (
              <EnhancedTable
                columns={columns}
                data={filteredUsers}
                searchable
                paginated
                pageSize={10}
                searchPlaceholder="Search by name, email, or role..."
                getRowClassName={(row) =>
                  row.id === currentUser?.id ? 'bg-blue-50 hover:bg-blue-100' : ''
                }
              />
            )}
          </Card>

          {/* Recent User Management Activity */}
          {recentActivities.length > 0 && (
            <Card title="RECENT USER MANAGEMENT ACTIVITY" headerColor="bg-[#D4F4DD]">
              <div className="space-y-2">
                {recentActivities.map((activity) => {
                  const config = getEventConfig(activity.event_type);
                  return (
                    <div
                      key={activity.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border-l-4 transition-all
                        ${config.rowColor}
                      `}
                      style={{ borderLeftColor: config.gradientColor?.split(' ')[0].replace('from-', '') }}
                    >
                      <div className="flex items-center gap-3">
                        <EventIcon eventType={activity.event_type} size="sm" />
                        <div>
                          <EventBadge eventType={activity.event_type} size="sm" showIcon={false} />
                          <p className="text-xs text-gray-600 mt-1">{activity.user_email || 'System'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Create User Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#22A555] to-[#1a8244] p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Create Admin Account</h3>
                        <p className="text-sm text-white/90">Add a new admin user to the system</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({ role: 'ADMIN', fullName: '', email: '', password: '' });
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#22A555] bg-white"
                      required
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="HR">HR</option>
                      <option value="PESO">PESO</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({ role: 'ADMIN', fullName: '', email: '', password: '' });
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="success"
                      icon={UserPlus}
                      loading={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && userToDelete && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Delete User Account</h3>
                        <p className="text-sm text-white/90">This action cannot be undone</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setUserToDelete(null);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Warning Message */}
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800 mb-1">Warning: Permanent Deletion</p>
                        <p className="text-sm text-red-700">
                          You are about to permanently delete this user account. This will:
                        </p>
                        <ul className="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                          <li>Remove all user data from the system</li>
                          <li>Revoke all access permissions</li>
                          <li>Delete associated activity logs</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Account to be deleted:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{userToDelete.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{userToDelete.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <Badge variant={getRoleBadgeVariant(userToDelete.role)} size="sm">
                          {userToDelete.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setUserToDelete(null);
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      icon={Trash2}
                      loading={isSubmitting}
                      onClick={handleDeleteUser}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Change Confirmation Modal */}
          {showStatusChangeModal && userToChangeStatus && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Modal Header */}
                <div className={`bg-gradient-to-r ${
                  statusChangeType === 'activate'
                    ? 'from-blue-500 to-blue-600'
                    : 'from-amber-500 to-amber-600'
                } p-6 rounded-t-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {statusChangeType === 'activate' ? 'Activate' : 'Deactivate'} User Account
                        </h3>
                        <p className="text-sm text-white/90">Confirm status change action</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowStatusChangeModal(false);
                        setUserToChangeStatus(null);
                        setStatusChangeReason('');
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Warning Message */}
                  <div className={`${
                    statusChangeType === 'deactivate'
                      ? 'bg-amber-50 border-l-4 border-amber-500'
                      : 'bg-blue-50 border-l-4 border-blue-500'
                  } p-4 rounded`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 ${
                        statusChangeType === 'deactivate' ? 'text-amber-600' : 'text-blue-600'
                      } flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className={`font-semibold ${
                          statusChangeType === 'deactivate' ? 'text-amber-800' : 'text-blue-800'
                        } mb-1`}>
                          {statusChangeType === 'activate' ? 'Restore Access' : 'Warning: Remove Access'}
                        </p>
                        <p className={`text-sm ${
                          statusChangeType === 'deactivate' ? 'text-amber-700' : 'text-blue-700'
                        }`}>
                          {statusChangeType === 'activate'
                            ? 'This will restore full system access for this user account. They will be able to log in and perform all role-based actions.'
                            : 'This will immediately revoke system access. The user will be logged out and unable to access the system until reactivated.'}
                        </p>
                        {statusChangeType === 'deactivate' && (
                          <ul className="text-sm text-amber-700 list-disc list-inside mt-2 space-y-1">
                            <li>User will lose access immediately</li>
                            <li>Active sessions will be terminated</li>
                            <li>Data will be preserved</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">User account to {statusChangeType}:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{userToChangeStatus.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{userToChangeStatus.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <Badge variant={getRoleBadgeVariant(userToChangeStatus.role)} size="sm">
                          {userToChangeStatus.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Optional Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Optional)
                    </label>
                    <Input
                      type="text"
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      placeholder={`Why ${statusChangeType} this account?`}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be recorded in the activity logs
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowStatusChangeModal(false);
                        setUserToChangeStatus(null);
                        setStatusChangeReason('');
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={statusChangeType === 'activate' ? 'success' : 'warning'}
                      icon={statusChangeType === 'activate' ? CheckCircle2 : UserX}
                      loading={isSubmitting}
                      onClick={handleConfirmStatusChange}
                      className="flex-1"
                    >
                      {isSubmitting
                        ? `${statusChangeType === 'activate' ? 'Activating' : 'Deactivating'}...`
                        : `${statusChangeType === 'activate' ? 'Activate' : 'Deactivate'} Account`
                      }
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Details Modal */}
          {showDetailsModal && selectedUser && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-xl sticky top-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                        <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">User Account Details</h3>
                        <p className="text-sm text-white/90">Complete user information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setSelectedUser(null);
                      }}
                      className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-[#22A555]" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900">{selectedUser.full_name}</p>
                          {isNewUser(selectedUser.created_at) && (
                            <Badge variant="created" size="sm">NEW</Badge>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Email Address</p>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900">{selectedUser.email}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Role</p>
                        <div className="flex items-center gap-2">
                          {React.createElement(getRoleIcon(selectedUser.role), { className: "w-4 h-4 text-gray-400" })}
                          <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Account Status</p>
                        <div className="flex items-center gap-2">
                          <StatusIndicator
                            severity={selectedUser.status === 'active' ? 'low' : 'medium'}
                            pulse={selectedUser.status === 'active'}
                            size="sm"
                          />
                          <Badge
                            variant={selectedUser.status === 'active' ? 'success' : 'default'}
                            icon={selectedUser.status === 'active' ? CheckCircle2 : AlertCircle}
                          >
                            {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Timeline */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#22A555]" />
                      Account Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Account Created</p>
                            <p className="text-xs text-gray-500">
                              {new Date(selectedUser.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {isNewUser(selectedUser.created_at) && (
                          <Badge variant="created" size="sm">Within 24h</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                            <p className="text-xs text-gray-500">
                              {new Date(selectedUser.updated_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#22A555]" />
                      System Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">User ID</span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                          {selectedUser.id}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auth UID</span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                          {selectedUser.id}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDetailsModal(false);
                        setSelectedUser(null);
                      }}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
