'use client';

import { ScoreGrade, RiskLevel, TrendLevel } from '@/lib/types';

interface ScoreBadgeProps {
  grade?: ScoreGrade;
  risk?: RiskLevel;
  trend?: TrendLevel;
  size?: 'sm' | 'md' | 'lg';
}

const gradeColors: Record<ScoreGrade, string> = {
  A: 'bg-score-excellent text-white',
  B: 'bg-score-good text-white',
  C: 'bg-score-moderate text-white',
  D: 'bg-orange-500 text-white',
  E: 'bg-score-poor text-white',
  F: 'bg-red-700 text-white',
};

const riskColors: Record<RiskLevel, string> = {
  LAV: 'bg-score-excellent text-white',
  MODERAT: 'bg-score-moderate text-white',
  HØJ: 'bg-score-poor text-white',
};

const trendColors: Record<TrendLevel, string> = {
  STIGENDE: 'bg-score-good text-white',
  STABIL: 'bg-blue-500 text-white',
  FALDENDE: 'bg-score-poor text-white',
};

const trendIcons: Record<TrendLevel, string> = {
  STIGENDE: '↗',
  STABIL: '→',
  FALDENDE: '↘',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 rounded',
  md: 'text-sm px-3 py-1 rounded-md font-semibold',
  lg: 'text-2xl px-4 py-2 rounded-lg font-bold font-mono',
};

export function ScoreBadge({ grade, risk, trend, size = 'md' }: ScoreBadgeProps) {
  const sizeClass = sizeClasses[size];

  if (grade) {
    return (
      <span className={`inline-flex items-center ${gradeColors[grade]} ${sizeClass}`}>
        {grade}
      </span>
    );
  }

  if (risk) {
    return (
      <span className={`inline-flex items-center ${riskColors[risk]} ${sizeClass}`}>
        {risk}
      </span>
    );
  }

  if (trend) {
    return (
      <span className={`inline-flex items-center gap-1 ${trendColors[trend]} ${sizeClass}`}>
        {trendIcons[trend]} {trend}
      </span>
    );
  }

  return null;
}

// Grade scale display
export function GradeScale({ current }: { current: ScoreGrade }) {
  const grades: ScoreGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div className="flex gap-1 text-xs font-mono mt-1">
      {grades.map((g) => (
        <span
          key={g}
          className={`px-1.5 py-0.5 rounded ${g === current ? gradeColors[g] + ' ring-2 ring-offset-1 ring-gray-800' : 'bg-gray-100 text-gray-400'}`}
        >
          {g}
        </span>
      ))}
    </div>
  );
}
