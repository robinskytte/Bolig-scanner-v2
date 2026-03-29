// TrajectoryScore — area development trend
// Based on property price trends, population, and income data

import { TrajectoryScore, PropertyPriceData, PopulationData, IncomeData } from '../types';

function pricesTrend(data: PropertyPriceData | null): 'rising' | 'stable' | 'falling' {
  if (!data || !data.byYear) return 'stable';
  return data.trend;
}

function populationTrend(data: PopulationData | null): 'growing' | 'stable' | 'declining' {
  if (!data || !data.byYear) return 'stable';
  const years = Object.keys(data.byYear).sort();
  if (years.length < 3) return 'stable';

  const first = data.byYear[years[0]] ?? 0;
  const last = data.byYear[years[years.length - 1]] ?? 0;
  if (first === 0) return 'stable';

  const change = (last - first) / first;
  if (change > 0.02) return 'growing';
  if (change < -0.02) return 'declining';
  return 'stable';
}

function incomeTrend(data: IncomeData | null): 'rising' | 'stable' | 'falling' {
  if (!data || !data.byYear) return 'stable';
  const years = Object.keys(data.byYear).sort();
  if (years.length < 3) return 'stable';

  const first = data.byYear[years[0]] ?? 0;
  const last = data.byYear[years[years.length - 1]] ?? 0;
  if (first === 0) return 'stable';

  // Adjust for inflation — roughly 2% per year
  const nominalChange = (last - first) / first;
  const inflationAdjusted = nominalChange - (years.length * 0.02);
  if (inflationAdjusted > 0.05) return 'rising';
  if (inflationAdjusted < -0.05) return 'falling';
  return 'stable';
}

function calculatePriceChange5yr(data: PropertyPriceData | null): number | undefined {
  if (!data?.byYear) return undefined;
  const years = Object.keys(data.byYear).sort();
  if (years.length < 5) return undefined;

  const yr5ago = data.byYear[years[years.length - 5]];
  const yrNow = data.byYear[years[years.length - 1]];
  if (!yr5ago || !yrNow || yr5ago === 0) return undefined;

  return Math.round(((yrNow - yr5ago) / yr5ago) * 1000) / 10; // percentage with 1 decimal
}

function calculatePopChange5yr(data: PopulationData | null): number | undefined {
  if (!data?.byYear) return undefined;
  const years = Object.keys(data.byYear).sort();
  if (years.length < 5) return undefined;

  const yr5ago = data.byYear[years[years.length - 5]];
  const yrNow = data.byYear[years[years.length - 1]];
  if (!yr5ago || !yrNow || yr5ago === 0) return undefined;

  return Math.round(((yrNow - yr5ago) / yr5ago) * 1000) / 10;
}

export function calculateTrajectoryScore(
  priceData: PropertyPriceData | null,
  populationData: PopulationData | null,
  incomeData: IncomeData | null
): TrajectoryScore {
  const pt = pricesTrend(priceData);
  const popT = populationTrend(populationData);
  const incT = incomeTrend(incomeData);

  // Overall trend: majority rules
  const positives = [pt === 'rising', popT === 'growing', incT === 'rising'].filter(Boolean).length;
  const negatives = [pt === 'falling', popT === 'declining', incT === 'falling'].filter(Boolean).length;

  let trend: TrajectoryScore['trend'] = 'STABIL';
  if (positives >= 2) trend = 'STIGENDE';
  if (negatives >= 2) trend = 'FALDENDE';

  return {
    trend,
    priceTrend: pt,
    populationTrend: popT,
    incomeTrend: incT,
    priceChange5yr: calculatePriceChange5yr(priceData),
    populationChange5yr: calculatePopChange5yr(populationData),
  };
}
