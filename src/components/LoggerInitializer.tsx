'use client';

import { useEffect } from 'react';
import { clientLogger } from '@/lib/logger/client';

/**
 * LoggerInitializer Component
 * Initializes the client-side logger that intercepts console methods
 * and sends logs to the terminal via API
 */
export function LoggerInitializer() {
  useEffect(() => {
    // Initialize logger on mount
    clientLogger.init();

    // Cleanup on unmount
    return () => {
      clientLogger.destroy();
    };
  }, []);

  return null;
}
