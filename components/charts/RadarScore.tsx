'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarScoreProps {
  data: Array<{ subject: string; score: number; fullMark?: number }>;
  color?: string;
  height?: number;
}

export function RadarScore({
  data,
  color = '#2563EB',
  height = 280,
}: RadarScoreProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(v: number) => [`${v}/10`, 'Score']}
            contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 text-center">
        Score 1–10, hvor 10 er bedst. Baseret på kommunedata fra Danmarks Statistik.
      </p>
    </div>
  );
}
