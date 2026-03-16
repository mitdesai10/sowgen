import React from 'react';

const STEPS = [
  { id: 1, label: 'Input' },
  { id: 2, label: 'Processing' },
  { id: 3, label: 'Review' },
];

export default function ProgressBar({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {STEPS.map((s, idx) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          const isFuture = step < s.id;

          return (
            <React.Fragment key={s.id}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all duration-300
                    ${isCompleted
                      ? 'bg-navy-800 border-navy-800 text-white'
                      : isActive
                      ? 'bg-navy-800 border-navy-800 text-white ring-4 ring-navy-100'
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{s.id}</span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium transition-colors duration-300 ${
                    isActive || isCompleted ? 'text-navy-800' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-3 mb-5">
                  <div className="h-0.5 w-full bg-gray-200 relative overflow-hidden rounded-full">
                    <div
                      className="h-full bg-navy-800 transition-all duration-500"
                      style={{ width: step > s.id ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step subtitle */}
      <p className="text-center text-sm text-gray-500 mt-2">
        {step === 1 && 'Provide your meeting transcripts and project details'}
        {step === 2 && 'Claude is analyzing your transcripts and drafting the SOW'}
        {step === 3 && 'Review, edit, and download your Statement of Work'}
      </p>
    </div>
  );
}
