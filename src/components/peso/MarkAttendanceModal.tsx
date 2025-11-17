'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TrainingStatusBadge } from '@/components/TrainingStatusBadge';
import { UserCheck, UserX, CheckSquare, Square } from 'lucide-react';

interface TrainingApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  attendance_marked_at: string | null;
}

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: string;
    title: string;
  };
  applications: TrainingApplication[];
  onSubmit: (selectedIds: string[]) => Promise<void>;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  program,
  applications,
  onSubmit,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Pre-select already attended users
  useEffect(() => {
    if (isOpen && applications.length > 0) {
      const attendedIds = applications
        .filter(app =>
          app.attendance_marked_at !== null ||
          ['in_progress', 'completed', 'certified'].includes(app.status)
        )
        .map(app => app.id);
      setSelectedIds(new Set(attendedIds));
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
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(Array.from(selectedIds));
      onClose();
    } catch (error) {
      console.error('Error marking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedIds.size;
  const unselectedCount = applications.length - selectedCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Training & Mark Attendance"
      size="lg"
      showFooter={false}
    >
      <div className="space-y-6">
        {/* Program Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Training Program:</span> {program.title}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Select all attendees below. <strong>This will officially start training</strong> for selected applicants.
            Unselected applicants will be marked as "No Show".
          </p>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                {selectedCount} Present
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-900">
                {unselectedCount} No Show
              </span>
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
              No approved or enrolled applicants found for this training program.
            </div>
          ) : (
            applications.map((app) => {
              const isSelected = selectedIds.has(app.id);
              const isAlreadyAttended = app.attendance_marked_at !== null;

              return (
                <div
                  key={app.id}
                  onClick={() => handleToggle(app.id)}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-green-50 border-green-300 hover:bg-green-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Checkbox Icon */}
                    <div className={`flex-shrink-0 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6" />
                      ) : (
                        <Square className="w-6 h-6" />
                      )}
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {app.full_name}
                        </p>
                        {isAlreadyAttended && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <UserCheck className="w-3 h-3" />
                            Previously Marked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{app.email}</p>
                      <p className="text-xs text-gray-500">{app.phone}</p>
                    </div>

                    {/* Current Status */}
                    <div className="flex-shrink-0">
                      <TrainingStatusBadge status={app.status as any} size="sm" />
                    </div>

                    {/* Visual Indicator */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <UserCheck className="w-6 h-6 text-green-600" />
                      ) : (
                        <UserX className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Warning */}
        {unselectedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">⚠️ Warning:</span>{' '}
              {unselectedCount} applicant{unselectedCount !== 1 ? 's' : ''} will be marked as "No Show" and their status will not change.
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
          >
            {loading ? 'Saving...' : `Mark ${selectedCount} as Present`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
