'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { X, Briefcase, User, TrendingUp, Calendar, FileText } from 'lucide-react';
import Image from 'next/image';

interface Application {
  id: string;
  applicantName: string;
  jobTitle: string;
  rank: number | null;
  matchScore: number | null;
}

interface MarkAsHiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: (next_steps: string, hr_notes?: string) => Promise<void>;
  submitting: boolean;
}

export const MarkAsHiredModal: React.FC<MarkAsHiredModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
  submitting
}) => {
  const [nextSteps, setNextSteps] = useState('Welcome aboard! HR will contact you with onboarding details and your start date.');
  const [hrNotes, setHrNotes] = useState('');

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    await onConfirm(nextSteps, hrNotes || undefined);

    // Reset form
    setNextSteps('Welcome aboard! HR will contact you with onboarding details and your start date.');
    setHrNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] overflow-y-auto">
        {/* Teal Gradient Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Mark as Hired</h3>
                <p className="text-sm text-white/90">Welcome to the team!</p>
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
          {/* Success Message */}
          <div className="bg-teal-50 border-l-4 border-teal-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-teal-800 mb-1">Mark as Hired</p>
                <p className="text-sm text-teal-700">
                  Confirm that this applicant has been officially hired. They will receive a welcome notification.
                </p>
              </div>
            </div>
          </div>

          {/* Applicant Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">New Employee Details:</p>
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
                    <span className="text-sm font-semibold text-teal-600">Score: {application.matchScore.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Onboarding Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Onboarding Instructions <span className="text-red-600">*</span>
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Provide onboarding details and next steps for the new hire..."
              rows={4}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">This will be shown to the new hire in their notification</p>
          </div>

          {/* HR Internal Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Internal Notes (Optional)
            </label>
            <textarea
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Add internal notes (start date, department, reporting to, etc.)..."
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">For HR records only, not visible to employee</p>
          </div>

          {/* Celebration Message */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-gray-800">Welcome to the Municipality of Asuncion team!</p>
              <p className="text-xs text-gray-600 mt-1">They'll be notified about their successful hiring</p>
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
              variant="primary"
              icon={Briefcase}
              loading={submitting}
              onClick={handleConfirm}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              disabled={submitting || !nextSteps.trim()}
            >
              {submitting ? 'Marking as Hired...' : 'Mark as Hired'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
