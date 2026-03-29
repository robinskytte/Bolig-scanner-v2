'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CompareBarProps {
  items: Array<{
    label: string;
    value: number;
    isHighlighted?: boolean;
  }>;
  unit?: string;
  formatValue?: (v: number) => string;
  height?: number;
  color?: string;
  highlightColor?: string;
}

export function CompareBar({
  items,
  unit = '',
  formatValue,
  height = 180,
  color = '#DBEAFE',
  highlightColor = '#2563EB',
}: CompareBarProps) {
  const formatter = formatValue || ((v: number) => `${v.toLocaleString('da-DK')}${unit}`);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={formatter} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748B' }}
          tickLine={false}
          width={80}
        />
        <Tooltip
          formatter={(v: number) => [formatter(v), '']}
          contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {items.map((item, index) => (
            <Cell
              key={index}
              fill={item.isHighlighted ? highlightColor : color}
              stroke={item.isHighlighted ? highlightColor : 'none'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
