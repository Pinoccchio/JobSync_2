'use client';
import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';

interface PDSViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdsUrl: string;
  applicantName: string;
}

export function PDSViewerModal({
  isOpen,
  onClose,
  pdsUrl,
  applicantName,
}: PDSViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    window.open(pdsUrl, '_blank');
  };

  // Reset loading state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, pdsUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Personal Data Sheet"
      showFooter={false}
    >
      <div className="relative">
        {/* Header Info */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{applicantName}</h3>
              <p className="text-sm text-gray-600">Civil Service Form 212 - Revised 2025</p>
            </div>
          </div>

          <Button onClick={handleDownload} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {/* PDF Viewer Container */}
        <div className="relative bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading PDS document...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center max-w-md px-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to Display PDF
                </h3>
                <p className="text-gray-600 mb-4">
                  The PDF couldn't be displayed in the browser. Please use the download button to view it.
                </p>
                <Button onClick={handleDownload} variant="primary">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDS
                </Button>
              </div>
            </div>
          )}

          {/* PDF iFrame */}
          {pdsUrl && (
            <iframe
              src={`${pdsUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-[75vh] border-0"
              title={`PDS - ${applicantName}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}

          {/* Fallback for browsers that don't support iframe PDFs */}
          {!hasError && (
            <object
              data={pdsUrl}
              type="application/pdf"
              className="w-full h-[75vh] hidden"
              aria-label={`PDS Document for ${applicantName}`}
            >
              <p className="p-4 text-center">
                Your browser doesn't support PDF viewing.
                <button
                  onClick={handleDownload}
                  className="text-blue-600 hover:underline ml-1"
                >
                  Click here to download the PDF.
                </button>
              </p>
            </object>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-1">About Personal Data Sheet</p>
              <p className="text-xs text-gray-600">
                This is the official Civil Service Commission Form 212 (Revised 2025).
                It contains personal information, education, work experience, eligibilities, and other relevant data submitted by the applicant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
