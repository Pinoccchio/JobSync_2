'use client';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/auth';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription context
 * Manages Supabase real-time subscriptions for critical data
 */
interface RealtimeContextType {
  isConnected: boolean;
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Track channels to prevent duplicates
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const subscriptionInitialized = useRef(false);

  /**
   * Fetch unread notifications count
   */
  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadNotificationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [user]);

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    // Only subscribe if authenticated and not already subscribed
    // CRITICAL: Also check that auth is not loading to prevent race conditions
    if (!isAuthenticated || !user || subscriptionInitialized.current) {
      console.log('⏭️ Skipping realtime setup:', {
        isAuthenticated,
        hasUser: !!user,
        alreadyInitialized: subscriptionInitialized.current
      });
      return;
    }

    console.log('🔄 Setting up real-time subscriptions for user:', user.email);
    subscriptionInitialized.current = true;

    // Generate unique channel names using timestamp
    const timestamp = Date.now();
    const notificationsChannelName = `notifications-${user.id}-${timestamp}`;
    const applicationsChannelName = `applications-${user.id}-${timestamp}`;

    /**
     * Subscribe to notifications table
     */
    const notificationsChannel = supabase
      .channel(notificationsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📬 New notification received:', payload);
          const notification = payload.new as any;

          // Increment unread count
          setUnreadNotificationsCount(prev => prev + 1);

          // Show toast for new notification
          showToast(notification.title || 'New Notification', 'info');
        }
      )
      .subscribe((status, err) => {
        console.log(`🔔 Notifications channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Fetch initial count
          refreshNotifications();
        }
        if (err) {
          console.error('Notifications subscription error:', err);
        }
      });

    channelsRef.current.push(notificationsChannel);

    /**
     * Subscribe to applications table (for applicants and HR)
     */
    if (role === 'APPLICANT' || role === 'HR') {
      const applicationsChannel = supabase
        .channel(applicationsChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'applications',
            filter: role === 'APPLICANT' ? `applicant_id=eq.${user.id}` : undefined
          },
          (payload) => {
            console.log('📝 Application updated:', payload);
            const application = payload.new as any;

            // Show toast if status changed
            if (payload.old && (payload.old as any).status !== application.status) {
              showToast(
                `Application ${application.status}`,
                application.status === 'approved' ? 'success' : application.status === 'denied' ? 'error' : 'info'
              );
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`📄 Applications channel status: ${status}`);
          if (err) {
            console.error('Applications subscription error:', err);
          }
        });

      channelsRef.current.push(applicationsChannel);
    }

    /**
     * Subscribe to training_applications table (for applicants and PESO)
     */
    if (role === 'APPLICANT' || role === 'PESO') {
      const trainingChannelName = `training-${user.id}-${timestamp}`;
      const trainingChannel = supabase
        .channel(trainingChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'training_applications',
            filter: role === 'APPLICANT' ? `applicant_id=eq.${user.id}` : undefined
          },
          (payload) => {
            console.log('🎓 Training application updated:', payload);
            const application = payload.new as any;

            // Show toast if status changed
            if (payload.old && (payload.old as any).status !== application.status) {
              showToast(
                `Training application ${application.status}`,
                application.status === 'approved' ? 'success' : application.status === 'denied' ? 'error' : 'info'
              );
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`🎓 Training channel status: ${status}`);
          if (err) {
            console.error('Training subscription error:', err);
          }
        });

      channelsRef.current.push(trainingChannel);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      subscriptionInitialized.current = false;
      setIsConnected(false);
    };
  }, [isAuthenticated, user, role, showToast]); // Removed refreshNotifications to prevent unnecessary re-renders

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadNotificationsCount,
        refreshNotifications
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
