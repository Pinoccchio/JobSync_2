'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { X, AlertCircle, User, Briefcase, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface Application {
  id: string;
  applicantName: string;
  jobTitle: string;
  rank: number | null;
  matchScore: number | null;
}

interface DenyModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: (denial_reason: string, hr_notes?: string) => Promise<void>;
  submitting: boolean;
}

const DENIAL_REASONS = [
  'Lacks required qualification',
  'Insufficient work experience',
  'Position already filled',
  'Does not meet minimum requirements',
  'Failed to meet eligibility criteria',
  'Other'
];

export const DenyModal: React.FC<DenyModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
  submitting
}) => {
  const [denialReason, setDenialReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [hrNotes, setHrNotes] = useState('');

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    const finalReason = denialReason === 'Other' ? customReason : denialReason;
    if (!finalReason.trim()) return;

    await onConfirm(finalReason, hrNotes || undefined);

    // Reset form
    setDenialReason('');
    setCustomReason('');
    setHrNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        {/* Red Gradient Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Deny Application</h3>
                <p className="text-sm text-white/90">Provide reason for denial</p>
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
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 mb-1">Deny Application</p>
                <p className="text-sm text-red-700">
                  The applicant will be notified with the reason you provide. This action can be reversed later if needed.
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
                    <span className="text-sm font-semibold text-orange-600">Score: {application.matchScore.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Denial Reason (Required) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Denial <span className="text-red-600">*</span>
            </label>
            <select
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 bg-white"
              disabled={submitting}
            >
              <option value="">Select a reason...</option>
              {DENIAL_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Custom Reason (if Other selected) */}
          {denialReason === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">This will be shown to the applicant</p>
            </div>
          )}

          {/* HR Internal Notes (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Internal Notes (Optional)
            </label>
            <textarea
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Add internal notes for HR team (not shown to applicant)..."
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">For HR reference only, not visible to applicant</p>
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
              variant="danger"
              icon={AlertCircle}
              loading={submitting}
              onClick={handleConfirm}
              className="flex-1"
              disabled={submitting || !denialReason || (denialReason === 'Other' && !customReason.trim())}
            >
              {submitting ? 'Denying...' : 'Deny Application'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
