'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

interface TrendLineProps {
  data: Record<string, number>;
  nationalData?: Record<string, number>;
  label: string;
  unit?: string;
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

export function TrendLine({
  data,
  nationalData,
  label,
  unit = '',
  color = '#2563EB',
  formatValue,
  height = 200,
}: TrendLineProps) {
  const chartData = Object.keys(data)
    .sort()
    .map((year) => ({
      year,
      value: data[year],
      national: nationalData?.[year],
    }))
    .filter((d) => d.value > 0);

  const formatter = formatValue || ((v: number) => `${v.toLocaleString('da-DK')}${unit}`);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatter}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatter(value),
              name === 'value' ? label : 'Landsgennemsnit',
            ]}
            labelFormatter={(label) => `År ${label}`}
            contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}
          />
          {nationalData && <Legend formatter={(v) => v === 'value' ? label : 'Landsgennemsnit'} />}

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            name="value"
          />
          {nationalData && (
            <Line
              type="monotone"
              dataKey="national"
              stroke="#CBD5E1"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="national"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 text-center mt-1">
        Data gælder for kommuneniveau. Stiplede linje = landsgennemsnit.
      </p>
    </div>
  );
}
