'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Bell, LogOut, CheckCircle, XCircle, Clock, ChevronDown, Trash2, FileText, Settings } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: 'application_status' | 'training_status' | 'announcement' | 'system';
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

interface TopNavProps {
  userRole?: string;
  userName?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  userRole = 'User',
  userName = 'User',
  pageTitle,
  pageDescription
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
      } else {
        console.error('Failed to fetch notifications:', result.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // Optimistic update - update UI immediately
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      const result = await response.json();
      if (!result.success) {
        // Rollback on error
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: false, read_at: null } : n)
        );
        setUnreadCount(prev => prev + 1);
        console.error('Error marking notification as read:', result.error);
      }
    } catch (error) {
      // Rollback on error
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: false, read_at: null } : n)
      );
      setUnreadCount(prev => prev + 1);
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

    if (unreadIds.length === 0) return;

    // Optimistic update - update UI immediately
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: n.is_read ? (n as any).read_at : now })));
    setUnreadCount(0);
    showToast('All notifications marked as read', 'success');

    try {
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark notifications as read', 'error');
      // Refetch to get correct state
      fetchNotifications();
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setNotifications([]);
        setUnreadCount(0);
        showToast('All notifications cleared', 'success');
      } else {
        showToast('Failed to clear notifications', 'error');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Failed to clear notifications', 'error');
    }
  };

  // Handle notification click - simply marks as read without redirecting
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
      showToast('Notification marked as read', 'success');
    }
    // No redirect - users can continue viewing other notifications
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient();

    // Get current user ID for filtering
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notification change:', payload);

            // Handle real-time updates optimistically
            if (payload.eventType === 'INSERT') {
              const newNotif = payload.new as Notification;
              setNotifications(prev => [newNotif, ...prev]);
              if (!newNotif.is_read) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotif = payload.new as Notification;
              setNotifications(prev =>
                prev.map(n => n.id === updatedNotif.id ? updatedNotif : n)
              );
              // Recalculate unread count
              setUnreadCount(prev => {
                const oldNotif = (payload.old as Notification);
                if (!oldNotif.is_read && updatedNotif.is_read) {
                  return Math.max(0, prev - 1);
                } else if (oldNotif.is_read && !updatedNotif.is_read) {
                  return prev + 1;
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedNotif = payload.old as Notification;
              setNotifications(prev => prev.filter(n => n.id !== deletedNotif.id));
              if (!deletedNotif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_status':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'training_status':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white h-16 flex items-center justify-between px-6 shadow-sm border-b border-gray-200">
      {/* Page Title */}
      <div className="flex-1">
        {pageTitle && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
            {pageDescription && (
              <p className="text-sm text-gray-600">{pageDescription}</p>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications - Hidden for ADMIN role (they use Activity Logs & Audit Trail) */}
        {userRole !== 'System Admin' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-[#22A555] rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notif.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 flex items-center gap-2">
                      <button
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="flex-1 text-center text-sm text-[#22A555] hover:text-[#1A7F3E] font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Mark all as read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="flex items-center justify-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors px-3 py-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#22A555] to-[#1A7F3E] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-600">{userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-14 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-600">{userRole}</p>
                </div>
                <div className="py-2">
                  {userRole === 'Applicant' && (
                    <Link href="/applicant/pds">
                      <button
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Fill PDS</span>
                      </button>
                    </Link>
                  )}

                  {(userRole === 'Applicant' || userRole === 'HR Admin' || userRole === 'PESO Admin' || userRole === 'System Admin') && (
                    <Link href={
                      userRole === 'Applicant' ? '/applicant/settings' :
                      userRole === 'HR Admin' ? '/hr/settings' :
                      userRole === 'PESO Admin' ? '/peso/settings' :
                      '/admin/settings'
                    }>
                      <button
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Account Settings</span>
                      </button>
                    </Link>
                  )}

                  <button
                    onClick={async () => {
                      try {
                        setShowUserMenu(false);
                        await logout();
                        showToast('Logged out successfully', 'success');
                        router.push('/login');
                      } catch (error: any) {
                        showToast(error.message || 'Logout failed', 'error');
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
