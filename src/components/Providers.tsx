'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
// import { RealtimeProvider } from '@/contexts/RealtimeContext'; // REMOVED: Realtime disabled for performance
import { LoggerInitializer } from '@/components/LoggerInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {/* RealtimeProvider REMOVED - Realtime subscriptions disabled */}
        <LoggerInitializer />
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
