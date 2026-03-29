'use client';

import { HverdagsScore as HverdagsScoreType } from '@/lib/types';
import { formatDistance } from '@/lib/fallback';

interface HverdagsScoreProps {
  score: HverdagsScoreType;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-score-excellent';
  if (score >= 60) return 'text-score-good';
  if (score >= 40) return 'text-score-moderate';
  return 'text-score-poor';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-score-excellent';
  if (score >= 60) return 'bg-score-good';
  if (score >= 40) return 'bg-score-moderate';
  return 'bg-score-poor';
}

export function HverdagsScoreDisplay({ score }: HverdagsScoreProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-ink">HverdagsScore</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tilgængelighed til fods og cykel</p>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-mono font-bold ${getScoreColor(score.total)}`}>
            {score.total}
          </div>
          <div className="text-sm text-gray-400 font-mono">/ 100</div>
        </div>
      </div>

      {/* Main progress bar */}
      <div className="mb-2">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-in-out ${getBarColor(score.total)}`}
            style={{ width: `${score.total}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 italic mb-6">
        &ldquo;{score.description}&rdquo;
      </p>

      {/* Category breakdown */}
      <div className="space-y-2">
        {score.categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-3">
            <span className="text-xl w-8 text-center flex-shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-gray-700 font-medium">{cat.nameDA}</span>
                <span className="text-gray-500 font-mono flex-shrink-0 ml-2">
                  {cat.distanceM !== undefined && cat.walkMinutes !== undefined
                    ? `${formatDistance(cat.distanceM)} · ${cat.walkMinutes} min`
                    : '—'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(cat.score)}`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
            <span className={`text-xs font-mono w-8 text-right flex-shrink-0 ${getScoreColor(cat.score)}`}>
              {cat.score}
            </span>
          </div>
        ))}
      </div>

      {/* Scale explanation */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Skala: 0–100. 100 = alt inden for kort gåafstand. Under 50 = bil nødvendig til de fleste ærinder.
        </p>
        {score.sources.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Baseret på: {score.sources.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
