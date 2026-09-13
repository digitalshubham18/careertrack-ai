import React from 'react';

/**
 * The product's signature visual element: an ATS score rendered as an
 * ascending arc, echoing the "trajectory" motif used across the app
 * (career progress as a line that climbs). Score is rendered in mono type
 * to read as a precise, data-driven measurement rather than a marketing
 * number.
 */
export default function ScoreDial({ score = 0, size = 120, label = 'ATS Score' }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const color = clamped >= 80 ? '#14B8A6' : clamped >= 60 ? '#F59E0B' : '#E11D48';

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-paper-line dark:text-ink-line"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="-mt-[4.5rem] flex flex-col items-center">
        <span className="font-data text-2xl font-semibold" style={{ color }}>
          {clamped}
        </span>
        <span className="font-data text-[10px] text-ink/50 dark:text-paper/50">/100</span>
      </div>
      <span className="mt-2 text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">
        {label}
      </span>
    </div>
  );
}
