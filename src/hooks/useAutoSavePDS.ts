'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PDSData } from '@/types/pds.types';

interface UseAutoSavePDSOptions {
  debounceMs?: number;
  onSaveSuccess?: (data?: any) => void;
  onSaveError?: (error: string) => void;
}

interface UseAutoSavePDSReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  triggerSave: () => void;
  lastSavedAt: Date | null;
}

export function useAutoSavePDS(
  pdsData: Partial<PDSData>,
  options: UseAutoSavePDSOptions = {}
): UseAutoSavePDSReturn {
  const {
    debounceMs = 2000,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousDataRef = useRef<string>('');

  const savePDS = useCallback(async () => {
    // Skip if data hasn't changed
    const currentDataStr = JSON.stringify(pdsData);
    if (currentDataStr === previousDataRef.current) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setSaveStatus('saving');
    setSaveError(null);

    try {
      // Use POST if no id (create), PUT if id exists (update)
      const method = pdsData.id ? 'PUT' : 'POST';

      // VALIDATION: Ensure completion_percentage is always 0-100 (database constraint)
      const sanitizedData = {
        ...pdsData,
        completionPercentage: typeof pdsData.completionPercentage === 'number'
          ? Math.max(0, Math.min(100, Math.round(pdsData.completionPercentage)))
          : 0,
      };

      const response = await fetch('/api/pds', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save PDS');
      }

      const result = await response.json();

      if (result.success) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        previousDataRef.current = currentDataStr;

        // Pass the returned data to parent (especially important for POST to get the id)
        onSaveSuccess?.(result.data);

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to save PDS');
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Auto-save error:', error);
      setSaveStatus('error');
      setSaveError(error.message || 'Failed to save PDS');
      onSaveError?.(error.message || 'Failed to save PDS');

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveError(null);
      }, 5000);
    }
  }, [pdsData, onSaveSuccess, onSaveError]);

  // Trigger save manually
  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    savePDS();
  }, [savePDS]);

  // Auto-save with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Skip if data is empty or hasn't changed
    const currentDataStr = JSON.stringify(pdsData);
    if (!pdsData || Object.keys(pdsData).length === 0 || currentDataStr === previousDataRef.current) {
      return;
    }

    // IMPORTANT: Skip auto-save on initial load of completed PDS
    // This prevents unnecessary updates when just viewing a completed PDS
    if (pdsData.isCompleted && previousDataRef.current === '') {
      // First load of completed PDS - set as previous but don't trigger save
      previousDataRef.current = currentDataStr;
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      savePDS();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pdsData, debounceMs, savePDS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    saveError,
    triggerSave,
    lastSavedAt,
  };
}
