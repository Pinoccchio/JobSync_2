'use client';
import React from 'react';
import { CheckCircle, Circle, Clock, Eye, UserCheck, Play, CheckCircle2, XCircle, Award, AlertCircle, Archive, Info, Ban } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/config/statusConfig';

interface StatusHistoryItem {
  from: string | null;
  to: string;
  changed_at: string;
  changed_by?: string;
}

interface StatusTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ statusHistory, currentStatus }) => {
  // Format the timeline from status_history
  const timelineSteps = statusHistory.map((item, index) => {
    const config = STATUS_CONFIG[item.to as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    const timestamp = new Date(item.changed_at);
    const isLast = index === statusHistory.length - 1;
    const isCurrent = item.to === currentStatus;

    return {
      status: item.to,
      label: config.label,
      icon: Icon,
      color: config.color,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      timestamp,
      isLast,
      isCurrent,
      from: item.from,
    };
  });

  // If timeline is empty, show just the current status
  if (timelineSteps.length === 0) {
    const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Header */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-teal-600" />
        <h4 className="text-sm font-semibold text-gray-900">Training Application Status History</h4>
        <span className="text-xs text-gray-500">({timelineSteps.length} changes)</span>
      </div>

      {/* Timeline Container - Horizontal Scroll for Mobile */}
      <div className="overflow-x-auto overflow-y-visible pb-2 pt-4">
        <div className="flex items-start gap-0 min-w-max py-2">
          {timelineSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              {/* Step Node */}
              <div className="flex flex-col items-center px-3" style={{ minWidth: '140px' }}>
                {/* Icon Circle - Wrapper with padding for pulse */}
                <div className="relative p-2">
                  <div
                    className={`relative w-10 h-10 rounded-full border-2 ${
                      step.isCurrent
                        ? `${step.bgColor} ${step.borderColor} shadow-lg scale-110`
                        : `bg-white ${step.borderColor} opacity-80`
                    } flex items-center justify-center transition-all`}
                  >
                    <step.icon
                      className={`w-5 h-5 ${step.color}`}
                    />
                    {/* Current indicator pulse */}
                    {step.isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold ${step.color}`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.timestamp.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {step.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              {!step.isLast && (() => {
                const nextStep = timelineSteps[index + 1];
                const lineColor = nextStep ? nextStep.borderColor.replace('border-', 'bg-') : 'bg-gray-300';
                const arrowColor = nextStep ? nextStep.borderColor.replace('border-', 'border-l-') : 'border-l-gray-300';

                return (
                  <div className="flex items-center" style={{ width: '80px', marginTop: '20px' }}>
                    <div className={`h-0.5 w-full ${lineColor} relative opacity-60`}>
                      {/* Arrow */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <div className={`w-0 h-0 border-t-4 border-t-transparent ${arrowColor} border-b-4 border-b-transparent opacity-100`}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Legend/Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600 bg-teal-50 p-3 rounded-lg border border-teal-200">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-600" />
          <div>
            <p className="font-medium text-teal-900">Timeline shows all status changes chronologically</p>
            <p className="text-teal-700 mt-1">
              Current status: <span className="font-semibold">{STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]?.label || currentStatus}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
