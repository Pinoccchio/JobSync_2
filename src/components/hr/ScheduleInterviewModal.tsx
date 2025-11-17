'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { X, Calendar, User, Briefcase, TrendingUp, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';

interface Application {
  id: string;
  applicantName: string;
  jobTitle: string;
  rank: number | null;
  matchScore: number | null;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: (interview_date: string, location: string, instructions: string) => Promise<void>;
  submitting: boolean;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirm,
  submitting
}) => {
  const [interviewDate, setInterviewDate] = useState('');
  const [location, setLocation] = useState('Municipality of Asuncion - HR Office');
  const [instructions, setInstructions] = useState('Please bring valid ID and original documents.');

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    if (!interviewDate) return;

    await onConfirm(interviewDate, location, instructions);

    // Reset form
    setInterviewDate('');
    setLocation('Municipality of Asuncion - HR Office');
    setInstructions('Please bring valid ID and original documents.');
  };

  // Get minimum date (today)
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[90vh] overflow-y-auto">
        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1.5">
                <Image src="/JS-logo.png" alt="JobSync" width={40} height={40} className="rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Schedule Interview</h3>
                <p className="text-sm text-white/90">Set date and instructions</p>
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
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 mb-1">Schedule Interview</p>
                <p className="text-sm text-blue-700">
                  The applicant will be notified with the interview details you provide.
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
                    <span className="text-sm font-semibold text-blue-600">Score: {application.matchScore.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interview Date & Time (Required) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Date & Time <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={submitting}
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Location <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter interview location..."
                className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={submitting}
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Instructions for Applicant */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instructions for Applicant
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="What should the applicant bring or prepare for the interview?"
              rows={4}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">This will be included in the notification to the applicant</p>
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
              icon={Calendar}
              loading={submitting}
              onClick={handleConfirm}
              className="flex-1"
              disabled={submitting || !interviewDate || !location}
            >
              {submitting ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
