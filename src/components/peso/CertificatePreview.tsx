'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, FileX, RefreshCw } from 'lucide-react';

interface CertificatePreviewProps {
  applicationId: string;
  includeSignature: boolean;
  notes?: string;
  onError?: (error: string) => void;
}

/**
 * CertificatePreview Component
 *
 * Displays a real-time preview of the certificate PDF using an embedded viewer.
 * Automatically regenerates when parameters change (with 500ms debounce).
 */
export default function CertificatePreview({
  applicationId,
  includeSignature,
  notes,
  onError,
}: CertificatePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Generate preview PDF
  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Revoke previous blob URL to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const response = await fetch('/api/training/certificates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId,
          include_signature: includeSignature,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Preview generation error:', err);
      const errorMessage = err.message || 'Failed to load certificate preview';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    generatePreview();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced regeneration when params change
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for 500ms debounce
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSignature, notes]);

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Generating preview...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-10">
          <FileX className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-sm font-semibold text-gray-800 mb-2">Preview Error</p>
          <p className="text-xs text-gray-600 text-center mb-4 max-w-md">{error}</p>
          <button
            onClick={generatePreview}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* PDF Viewer */}
      {pdfUrl && !error && (
        <iframe
          src={`${pdfUrl}#toolbar=0&zoom=130`}
          className="w-full h-full"
          title="Certificate Preview"
          style={{ border: 'none', backgroundColor: '#1e293b' }}
        />
      )}

      {/* Watermark for Preview */}
      {pdfUrl && !error && !isLoading && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md opacity-80 pointer-events-none">
          PREVIEW
        </div>
      )}
    </div>
  );
}
