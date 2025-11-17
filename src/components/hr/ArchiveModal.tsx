'use client';
import React from 'react';
import { Button } from '@/components/ui';
import { X, Archive, User, Briefcase, TrendingUp, Info } from 'lucide-react';
import Image from 'next/image';

interface Application {
  id: string;
  applicantName: string;
  jobTitle: string;
  rank: number | null;
  matchScore: number | null;
}

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
  submitting
}) => {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Gray Gradient Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Archive Application</h3>
                <p className="text-sm text-white/90">Move to archive</p>
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
          {/* Info Message */}
          <div className="bg-gray-50 border-l-4 border-gray-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800 mb-1">Archive Application</p>
                <p className="text-sm text-gray-700">
                  This will mark the application as archived. The record will be kept for future reference but will no longer appear in active applications.
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
              {application.rank && application.matchScore && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Rank: #{application.rank}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm font-semibold text-gray-600">Score: {application.matchScore.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Archived applications can be viewed in the archives section and are maintained for record-keeping purposes.
              </p>
            </div>
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
              variant="secondary"
              icon={Archive}
              loading={submitting}
              onClick={onConfirm}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              disabled={submitting}
            >
              {submitting ? 'Archiving...' : 'Archive Application'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
