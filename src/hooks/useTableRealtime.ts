'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Reusable hook for real-time table subscriptions
 *
 * @param tableName - The table to subscribe to (e.g., 'jobs', 'applications')
 * @param events - Array of events to listen for ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 * @param filter - Optional filter (e.g., 'applicant_id=eq.uuid')
 * @param onEvent - Callback function when event occurs
 * @param enabled - Whether subscription is active (default: true)
 *
 * @example
 * // Subscribe to all job updates
 * useTableRealtime('jobs', ['INSERT', 'UPDATE'], null, () => refetchJobs());
 *
 * // Subscribe to user's own applications
 * useTableRealtime('applications', ['UPDATE'], `applicant_id=eq.${user.id}`, handleUpdate);
 *
 * // Subscribe to all events on a table
 * useTableRealtime('notifications', ['*'], `user_id=eq.${user.id}`, refetch);
 */
export function useTableRealtime(
  tableName: string,
  events: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[] = ['*'],
  filter?: string | null,
  onEvent?: (payload: any) => void,
  enabled: boolean = true
) {
  const { isAuthenticated } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Use ref to store the callback to prevent unnecessary re-subscriptions
  const onEventRef = useRef(onEvent);

  // Update callback ref when it changes
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Skip if not authenticated or disabled
    if (!isAuthenticated || !enabled) {
      return;
    }

    console.log(`🔄 Setting up real-time subscription for ${tableName}`, { events, filter });

    // Generate unique channel name
    const channelName = `${tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let channel = supabase.channel(channelName);

    // Subscribe to each event type
    events.forEach(event => {
      channel = channel.on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: tableName,
          ...(filter ? { filter } : {})
        },
        (payload) => {
          console.log(`📡 ${tableName} ${event}:`, payload);
          // Use the ref to access the latest callback
          if (onEventRef.current) {
            onEventRef.current(payload);
          }
        }
      );
    });

    // Subscribe and handle status
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ ${tableName} subscription ACTIVE`);
      } else if (status === 'CLOSED') {
        console.log(`❌ ${tableName} subscription CLOSED`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`⚠️ ${tableName} subscription ERROR:`, err);
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up ${tableName} subscription...`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tableName, isAuthenticated, enabled, filter, events]); // Include all dependencies

  return { channel: channelRef.current };
}
