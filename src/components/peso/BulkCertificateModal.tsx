'use client';

import React, { useState, useEffect } from 'react';
import { ModernModal, Button } from '@/components/ui';
import { Award, CheckCircle, XCircle, Loader2, Eye, AlertCircle, FileCheck, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';

interface TrainingApplication {
  id: string;
  full_name: string;
  email: string;
  training_programs?: {
    title: string;
  };
}

interface BulkCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: TrainingApplication[];
  programTitle: string;
  onComplete: () => void;
}

interface GenerationProgress {
  current: number;
  total: number;
  successes: string[];
  failures: { id: string; name: string; error: string }[];
}

/**
 * BulkCertificateModal Component
 *
 * Allows PESO officers to generate certificates for multiple completed applications at once.
 * Features:
 * - Checkbox selection (Select All / Individual)
 * - Global signature toggle
 * - Individual certificate preview
 * - Sequential generation with progress tracking
 * - Success/failure summary
 */
export default function BulkCertificateModal({
  isOpen,
  onClose,
  applications,
  programTitle,
  onComplete,
}: BulkCertificateModalProps) {
  const { showToast } = useToast();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Settings
  const [includeSignature, setIncludeSignature] = useState(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [signatureLoading, setSignatureLoading] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    successes: [],
    failures: [],
  });
  const [showSummary, setShowSummary] = useState(false);

  // Fetch signature status on mount
  useEffect(() => {
    if (isOpen) {
      fetchSignatureStatus();
    }
  }, [isOpen]);

  // Fetch signature status
  const fetchSignatureStatus = async () => {
    try {
      setSignatureLoading(true);
      const response = await fetch('/api/peso/signature');
      const result = await response.json();

      if (response.ok && result.success) {
        setHasSignature(!!result.signatureUrl);
      } else {
        setHasSignature(false);
      }
    } catch (error: any) {
      console.error('Error fetching signature status:', error);
      setHasSignature(false);
    } finally {
      setSignatureLoading(false);
    }
  };

  // Toggle individual selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all / deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  };

  // Preview individual certificate
  const handlePreview = async (applicationId: string) => {
    try {
      const response = await fetch('/api/training/certificates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          include_signature: includeSignature,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to generate preview');
      }

      // Open PDF in new tab
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up after opening
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Error previewing certificate:', error);
      showToast(getErrorMessage(error), 'error');
    }
  };

  // Generate certificates sequentially
  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      showToast('Please select at least one application', 'error');
      return;
    }

    const selectedArray = Array.from(selectedIds);

    setIsGenerating(true);
    setProgress({
      current: 0,
      total: selectedArray.length,
      successes: [],
      failures: [],
    });

    const successes: string[] = [];
    const failures: { id: string; name: string; error: string }[] = [];

    // Generate certificates sequentially
    for (const appId of selectedArray) {
      const application = applications.find((a) => a.id === appId);

      try {
        const response = await fetch('/api/training/certificates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: appId,
            include_signature: includeSignature,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate certificate');
        }

        successes.push(appId);
        setProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          successes: [...prev.successes, appId],
        }));
      } catch (error: any) {
        console.error(`Error generating certificate for ${appId}:`, error);
        failures.push({
          id: appId,
          name: application?.full_name || 'Unknown',
          error: error.message || 'Unknown error',
        });
        setProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          failures: [...prev.failures, { id: appId, name: application?.full_name || 'Unknown', error: error.message }],
        }));
      }
    }

    setIsGenerating(false);
    setShowSummary(true);

    // Show summary toast
    if (failures.length === 0) {
      showToast(`Successfully generated ${successes.length} certificate(s)!`, 'success');
    } else if (successes.length === 0) {
      showToast('Failed to generate all certificates', 'error');
    } else {
      showToast(
        `Generated ${successes.length} certificate(s) with ${failures.length} failure(s)`,
        'warning'
      );
    }

    // Call onComplete to refresh data
    onComplete();
  };

  // Close and reset
  const handleClose = () => {
    if (!isGenerating) {
      setSelectedIds(new Set());
      setIncludeSignature(false);
      setProgress({
        current: 0,
        total: 0,
        successes: [],
        failures: [],
      });
      setShowSummary(false);
      onClose();
    }
  };

  // Close summary and reset
  const handleCloseSummary = () => {
    setShowSummary(false);
    handleClose();
  };

  // Render summary modal
  if (showSummary) {
    return (
      <ModernModal
        isOpen={isOpen}
        onClose={handleCloseSummary}
        title="Certificate Generation Summary"
        subtitle={`${programTitle} - Bulk Certificate Issuance`}
        colorVariant="green"
        icon={FileCheck}
        size="lg"
      >
        <div className="space-y-6">
          {/* Success Section */}
          {progress.successes.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  Successfully Generated ({progress.successes.length})
                </h3>
              </div>
              <p className="text-sm text-green-800">
                Certificates have been generated and applications moved to "certified" status.
              </p>
            </div>
          )}

          {/* Failure Section */}
          {progress.failures.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Failed to Generate ({progress.failures.length})
                </h3>
              </div>
              <div className="space-y-2">
                {progress.failures.map((failure) => (
                  <div key={failure.id} className="text-sm text-red-800">
                    <span className="font-medium">{failure.name}:</span>{' '}
                    <span className="text-red-700">{failure.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleCloseSummary} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </ModernModal>
    );
  }

  // Render main modal
  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Issue Certificates (Bulk)"
      subtitle={`${programTitle} - ${applications.length} completed application(s)`}
      colorVariant="green"
      icon={Award}
      size="xl"
    >
      <div className="flex flex-col h-[600px]">
        {/* Top Controls */}
        <div className="flex-shrink-0 space-y-4 mb-4">
          {/* Signature Toggle */}
          <div
            className={`${
              hasSignature ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
            } border rounded-lg p-4`}
          >
            <label
              className={`flex items-start gap-3 ${hasSignature ? 'cursor-pointer' : 'cursor-not-allowed'} group`}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  disabled={!hasSignature || signatureLoading || isGenerating}
                  className={`w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                    hasSignature ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                />
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${hasSignature ? 'text-gray-900 group-hover:text-blue-700' : 'text-amber-900'}`}
                >
                  Include my digital signature on all certificates
                </span>
                <p className={`text-xs mt-0.5 ${hasSignature ? 'text-gray-600' : 'text-amber-700'}`}>
                  {signatureLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 inline animate-spin" />
                      Checking signature status...
                    </span>
                  ) : hasSignature ? (
                    'Your signature will be embedded on all selected certificates'
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Upload signature in Settings first
                    </>
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              disabled={isGenerating}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedIds.size === applications.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedIds.size} of {applications.length} selected
            </span>
          </div>
        </div>

        {/* Applicants List */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          <div className="divide-y divide-gray-200">
            {applications.map((application) => {
              const isSelected = selectedIds.has(application.id);

              return (
                <div
                  key={application.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleToggleSelect(application.id)}
                        disabled={isGenerating}
                        className="focus:outline-none disabled:cursor-not-allowed"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-teal-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{application.full_name}</div>
                      <div className="text-sm text-gray-600">{application.email}</div>
                    </div>

                    {/* Preview Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handlePreview(application.id)}
                        disabled={isGenerating}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="flex-shrink-0 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-900">
                Generating certificates... ({progress.current} of {progress.total})
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-3 mt-4 pt-4 border-t">
          <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="success"
            icon={Award}
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={selectedIds.size === 0 || isGenerating}
            className="flex-1"
          >
            Generate {selectedIds.size} Certificate{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </ModernModal>
  );
}
