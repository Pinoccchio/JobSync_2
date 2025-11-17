'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TrainingStatusBadge } from '@/components/TrainingStatusBadge';
import { Award, CheckCircle, XCircle, Clock, CheckSquare, Square, AlertTriangle } from 'lucide-react';

interface TrainingApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  attendance_marked_at: string | null;
  completion_status?: 'passed' | 'failed' | 'pending' | null;
  training_hours_awarded?: number | null;
}

interface CompletionData {
  applicantId: string;
  completionStatus: 'passed' | 'failed' | 'pending';
  hoursAwarded: number;
  notes: string;
}

interface AwardCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: string;
    title: string;
    duration: string; // e.g., "40 hours"
  };
  applications: TrainingApplication[];
  onSubmit: (completionData: CompletionData[]) => Promise<void>;
}

export const AwardCompletionModal: React.FC<AwardCompletionModalProps> = ({
  isOpen,
  onClose,
  program,
  applications,
  onSubmit,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'passed' | 'failed' | 'pending'>('passed');
  const [bulkHours, setBulkHours] = useState<number>(0);
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [individualData, setIndividualData] = useState<Map<string, CompletionData>>(new Map());

  // Parse default hours from program duration (e.g., "40 hours" -> 40)
  useEffect(() => {
    if (isOpen && program.duration) {
      const match = program.duration.match(/(\d+(?:\.\d+)?)/);
      const defaultHours = match ? parseFloat(match[1]) : 0;
      setBulkHours(defaultHours);
    }
  }, [isOpen, program.duration]);

  // Pre-select already completed applicants
  useEffect(() => {
    if (isOpen && applications.length > 0) {
      const completedIds = applications
        .filter(app =>
          app.completion_status !== null &&
          ['passed', 'failed', 'pending'].includes(app.completion_status || '')
        )
        .map(app => app.id);
      setSelectedIds(new Set(completedIds));

      // Pre-fill individual data for already completed applicants
      const dataMap = new Map<string, CompletionData>();
      applications.forEach(app => {
        if (app.completion_status) {
          dataMap.set(app.id, {
            applicantId: app.id,
            completionStatus: app.completion_status,
            hoursAwarded: app.training_hours_awarded || 0,
            notes: '',
          });
        }
      });
      setIndividualData(dataMap);
    }
  }, [isOpen, applications]);

  const handleSelectAll = () => {
    const allIds = applications.map(app => app.id);
    setSelectedIds(new Set(allIds));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      // Remove individual data when unselected
      const newDataMap = new Map(individualData);
      newDataMap.delete(id);
      setIndividualData(newDataMap);
    } else {
      newSet.add(id);
      // Initialize with bulk defaults when selected
      if (!individualData.has(id)) {
        const newDataMap = new Map(individualData);
        newDataMap.set(id, {
          applicantId: id,
          completionStatus: bulkStatus,
          hoursAwarded: bulkHours,
          notes: bulkNotes,
        });
        setIndividualData(newDataMap);
      }
    }
    setSelectedIds(newSet);
  };

  // Apply bulk settings to all selected applicants
  const handleApplyBulkSettings = () => {
    const newDataMap = new Map(individualData);
    selectedIds.forEach(id => {
      newDataMap.set(id, {
        applicantId: id,
        completionStatus: bulkStatus,
        hoursAwarded: bulkHours,
        notes: bulkNotes,
      });
    });
    setIndividualData(newDataMap);
  };

  // Update individual applicant data
  const updateIndividualData = (id: string, field: keyof CompletionData, value: any) => {
    const newDataMap = new Map(individualData);
    const current = newDataMap.get(id) || {
      applicantId: id,
      completionStatus: bulkStatus,
      hoursAwarded: bulkHours,
      notes: bulkNotes,
    };
    newDataMap.set(id, { ...current, [field]: value });
    setIndividualData(newDataMap);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const completionData = Array.from(selectedIds).map(id => {
        return individualData.get(id) || {
          applicantId: id,
          completionStatus: bulkStatus,
          hoursAwarded: bulkHours,
          notes: bulkNotes,
        };
      });
      await onSubmit(completionData);
      onClose();
    } catch (error) {
      console.error('Error awarding completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedIds.size;
  const passedCount = Array.from(selectedIds).filter(id => individualData.get(id)?.completionStatus === 'passed').length;
  const failedCount = Array.from(selectedIds).filter(id => individualData.get(id)?.completionStatus === 'failed').length;
  const pendingCount = Array.from(selectedIds).filter(id => individualData.get(id)?.completionStatus === 'pending').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Award Training Completion"
      size="xl"
      showFooter={false}
    >
      <div className="space-y-6">
        {/* Program Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">Training Program:</span> {program.title}
          </p>
          <p className="text-sm text-purple-700 mt-1">
            Select applicants and set their completion status, hours awarded, and optional notes.
          </p>
        </div>

        {/* Bulk Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bulk Settings (Apply to All Selected)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Completion Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as 'passed' | 'failed' | 'pending')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hours Awarded</label>
              <Input
                type="number"
                min="0"
                max="720"
                step="0.5"
                value={bulkHours}
                onChange={(e) => setBulkHours(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyBulkSettings}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Apply to Selected ({selectedCount})
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Completion Notes (Optional)</label>
            <Textarea
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              placeholder="e.g., Excellent performance throughout the training program..."
              rows={2}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">{passedCount} Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-900">{failedCount} Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">{pendingCount} Pending</span>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedCount === applications.length}
            >
              Select All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedCount === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Applicant List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applicants found with marked attendance for this training program.
            </div>
          ) : (
            applications.map((app) => {
              const isSelected = selectedIds.has(app.id);
              const appData = individualData.get(app.id);
              const isAlreadyCompleted = app.completion_status !== null;

              return (
                <div
                  key={app.id}
                  className={`
                    border-2 rounded-lg transition-all
                    ${isSelected
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  {/* Header - Click to select */}
                  <div
                    onClick={() => handleToggle(app.id)}
                    className={`
                      flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-70
                      ${isSelected ? 'hover:bg-purple-100' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Checkbox */}
                      <div className={`flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
                        {isSelected ? (
                          <CheckSquare className="w-6 h-6" />
                        ) : (
                          <Square className="w-6 h-6" />
                        )}
                      </div>

                      {/* Applicant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{app.full_name}</p>
                          {isAlreadyCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <Award className="w-3 h-3" />
                              Previously Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{app.email}</p>
                      </div>

                      {/* Current Status */}
                      <div className="flex-shrink-0">
                        <TrainingStatusBadge status={app.status as any} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details - Show when selected */}
                  {isSelected && (
                    <div className="border-t border-purple-200 p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Completion Status</label>
                          <select
                            value={appData?.completionStatus || bulkStatus}
                            onChange={(e) => updateIndividualData(app.id, 'completionStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hours Awarded</label>
                          <Input
                            type="number"
                            min="0"
                            max="720"
                            step="0.5"
                            value={appData?.hoursAwarded ?? bulkHours}
                            onChange={(e) => updateIndividualData(app.id, 'hoursAwarded', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <div className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg w-full justify-center
                            ${appData?.completionStatus === 'passed' ? 'bg-green-100 text-green-800' :
                              appData?.completionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'}
                          `}>
                            {appData?.completionStatus === 'passed' ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Passed</span>
                              </>
                            ) : appData?.completionStatus === 'failed' ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Failed</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Pending</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <Textarea
                          value={appData?.notes || bulkNotes}
                          onChange={(e) => updateIndividualData(app.id, 'notes', e.target.value)}
                          placeholder="Add specific notes for this applicant..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Warning for Failed */}
        {failedCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Warning:</span>{' '}
              {failedCount} applicant{failedCount !== 1 ? 's' : ''} will be marked as "Failed" and will not receive certification.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading || selectedCount === 0}
            loading={loading}
            icon={Award}
          >
            {loading ? 'Saving...' : `Award Completion (${selectedCount})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
