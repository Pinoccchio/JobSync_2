'use client';
import React from 'react';
import { Button } from '@/components/ui';
import { X, RotateCcw, User, Briefcase, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Application {
  id: string;
  applicantName: string;
  jobTitle: string;
  rank: number | null;
  matchScore: number | null;
  status: string;
}

interface ReverseToPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

export const ReverseToPendingModal: React.FC<ReverseToPendingModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
  submitting
}) => {
  if (!isOpen || !application) return null;

  // Get readable status name
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'denied': return 'Denied';
      case 'shortlisted': return 'Shortlisted';
      case 'interviewed': return 'Interviewed';
      case 'hired': return 'Hired';
      case 'archived': return 'Archived';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Orange Gradient Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Reverse to Pending</h3>
                <p className="text-sm text-white/90">Reset application status</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/30 hover:text-gray-100 rounded-lg p-2 transition-all duration-200"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800 mb-1">Confirm Status Reversal</p>
                <p className="text-sm text-orange-700">
                  This will reset the application status from <span className="font-bold">{getStatusDisplay(application.status)}</span> back to <span className="font-bold">Pending</span>. The applicant will be notified of this change.
                </p>
              </div>
            </div>
          </div>

          {/* Applicant Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Applicant Details:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{application.applicantName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{application.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <RotateCcw className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-orange-600">{getStatusDisplay(application.status)}</span> → <span className="font-semibold text-gray-700">Pending</span>
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Use this to correct mistakes or re-evaluate applications. The applicant will receive a notification about the status change.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              icon={RotateCcw}
              loading={submitting}
              onClick={onConfirm}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Reversing...' : 'Reverse to Pending'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
