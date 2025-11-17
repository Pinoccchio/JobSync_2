'use client';
import React from 'react';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  steps: Array<{
    id: string;
    title: string;
    isComplete: boolean;
  }>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  completionPercentage,
  steps,
}) => {
  return (
    <div className="mb-8">
      {/* Progress Percentage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-[#22A555]">
            {Math.round(completionPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-[#22A555] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              {/* Circle Indicator */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 font-semibold text-sm
                  ${
                    step.isComplete
                      ? 'bg-[#22A555] text-white'
                      : index === currentStep
                      ? 'bg-[#22A555]/20 text-[#22A555] ring-2 ring-[#22A555]'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {step.isComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Title */}
              <span
                className={`
                  text-xs font-medium text-center max-w-[80px]
                  ${
                    index === currentStep
                      ? 'text-[#22A555]'
                      : step.isComplete
                      ? 'text-gray-700'
                      : 'text-gray-500'
                  }
                `}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 rounded transition-all duration-300
                  ${step.isComplete ? 'bg-[#22A555]' : 'bg-gray-200'}
                `}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Title */}
      <div className="mt-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {steps[currentStep]?.title || 'Loading...'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Step {currentStep + 1} of {totalSteps}
        </p>
      </div>
    </div>
  );
};
