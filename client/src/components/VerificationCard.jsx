import React from 'react';

function VerificationRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-44 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">
        {value || <span className="text-gray-400 italic">Not detected</span>}
      </span>
    </div>
  );
}

export default function VerificationCard({ verification, onConfirm, onBack }) {
  const {
    detectedClientName,
    detectedProjectType,
    keyDeliverables,
    estimatedTimeline,
    estimatedBudget,
    transcriptCount,
  } = verification || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-navy-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Here's what we found</h2>
              <p className="text-navy-200 text-xs mt-0.5">
                Claude analyzed your transcripts. Does this look right?
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <VerificationRow label="Client" value={detectedClientName} />
          <VerificationRow label="Project Type" value={detectedProjectType} />

          {/* Key deliverables */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-44 shrink-0 pt-0.5">
              Key Deliverables
            </span>
            <div className="flex-1">
              {keyDeliverables && keyDeliverables.length > 0 ? (
                <ul className="space-y-1">
                  {keyDeliverables.slice(0, 6).map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-navy-500 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-gray-400 italic">Not detected</span>
              )}
            </div>
          </div>

          <VerificationRow label="Timeline" value={estimatedTimeline} />
          <VerificationRow label="Budget" value={estimatedBudget} />
          <VerificationRow
            label="Transcripts Processed"
            value={transcriptCount != null ? `${transcriptCount} transcript${transcriptCount !== 1 ? 's' : ''}` : undefined}
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            Looks good, generate SOW
          </button>
          <button
            onClick={onBack}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Go back and edit
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
