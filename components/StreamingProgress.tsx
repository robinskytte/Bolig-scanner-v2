'use client';

import { ProgressEvent } from '@/lib/types';

interface StreamingProgressProps {
  events: ProgressEvent[];
  isComplete: boolean;
}

const statusIcons: Record<string, string> = {
  done: '✅',
  loading: '⏳',
  error: '❌',
  unavailable: '⬜',
  searching: '🔍',
};

export function StreamingProgress({ events, isComplete }: StreamingProgressProps) {
  if (events.length === 0 && !isComplete) return null;

  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">Dataindsamling</h3>
        {isComplete ? (
          <span className="text-xs text-score-good font-medium">Færdig ✓</span>
        ) : (
          <span className="text-xs text-ocean animate-pulse">Analyserer...</span>
        )}
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="flex-shrink-0 text-sm leading-4">
              {event.status === 'loading' ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : event.status === 'searching' ? (
                <span className="inline-block animate-pulse">🔍</span>
              ) : (
                statusIcons[event.status] || '⬜'
              )}
            </span>
            <span
              className={`leading-4 ${
                event.status === 'done' ? 'text-gray-700' :
                event.status === 'loading' ? 'text-ocean font-medium' :
                event.status === 'error' ? 'text-error-text' :
                event.status === 'unavailable' ? 'text-unavailable italic' :
                'text-gray-600'
              }`}
            >
              {event.message}
              {event.source && (
                <span className="text-gray-400 ml-1">({event.source})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {!isComplete && events.length > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ocean rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (events.filter(e => e.status === 'done' || e.status === 'unavailable' || e.status === 'error').length / Math.max(events.length, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline loading indicator
export function LoadingPulse({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ocean py-2">
      <span className="inline-flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-ocean rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}

// Skeleton placeholder for loading data cards
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
          style={{
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      ))}
    </div>
  );
}
