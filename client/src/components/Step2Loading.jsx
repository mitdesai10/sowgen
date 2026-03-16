import React, { useState, useEffect } from 'react';

const STATUS_MESSAGES = [
  'Analyzing meeting transcripts...',
  'Extracting project details...',
  'Drafting SOW sections...',
  'Formatting document structure...',
  'Almost done...',
];

export default function Step2Loading() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Cycle through status messages every 3 seconds
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    // Fake progress: go from 0 to 90% over ~40 seconds with easing
    // Uses small increments that slow down near the end
    let progress = 0;
    const progressInterval = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        // Slow down as we approach 90%
        const remaining = 90 - prev;
        const increment = Math.max(0.3, remaining * 0.025);
        return Math.min(90, prev + increment);
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="card max-w-md w-full text-center p-10">
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-navy-100" />
            {/* Spinning ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-navy-800 spin-ring"
              style={{ animationDuration: '1s' }}
            />
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-navy-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-navy-800 mb-2">Generating Your SOW</h2>

        {/* Cycling status message */}
        <p
          key={messageIndex}
          className="text-gray-600 text-sm mb-6 transition-opacity duration-500"
        >
          {STATUS_MESSAGES[messageIndex]}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-navy-700 to-navy-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">This may take 30–60 seconds</p>

        {/* Dots animation */}
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-navy-400 rounded-full"
              style={{
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
