'use client';

import { AnalysisResult } from '@/lib/types';
import { ScoreBadge } from '../ScoreBadge';
import { DataSourceLabel } from '../DataSourceLabel';
import { TrendLine } from '../charts/TrendLine';

interface OmraadeUdviklingProps {
  result: Partial<AnalysisResult>;
}

function TrendArrow({ trend }: { trend: string }) {
  if (trend === 'rising' || trend === 'growing') return <span className="text-score-excellent">↗ Stigende</span>;
  if (trend === 'falling' || trend === 'declining') return <span className="text-score-poor">↘ Faldende</span>;
  return <span className="text-blue-500">→ Stabil</span>;
}

export function OmraadeUdvikling({ result }: OmraadeUdviklingProps) {
  const { trajectoryScore, prices, demographics, income, cvr } = result;
  const kommuneNavn = result.address?.kommuneNavn || 'kommunen';

  const pricesData = prices?.status === 'success' ? prices.data : null;
  const demographicsData = demographics?.status === 'success' ? demographics.data : null;
  const incomeData = income?.status === 'success' ? income.data : null;
  const cvrData = cvr?.status === 'success' ? cvr.data : null;

  // Create national reference data for price chart
  const nationalPricesByYear: Record<string, number> = {};
  if (pricesData?.byYear && pricesData.nationalAverage) {
    // We only have the current national average — show as flat reference line
    Object.keys(pricesData.byYear).forEach(y => {
      nationalPricesByYear[y] = pricesData.nationalAverage;
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink">BoligPuls</h2>
          <p className="text-sm text-gray-500 mt-0.5">Områdets udvikling og tendens</p>
        </div>
        {trajectoryScore ? (
          <ScoreBadge trend={trajectoryScore.trend} size="md" />
        ) : (
          <div className="w-28 h-8 bg-gray-100 rounded-md animate-pulse" />
        )}
      </div>

      {trajectoryScore && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Ejendomspriser', trend: trajectoryScore.priceTrend, change: trajectoryScore.priceChange5yr },
            { label: 'Befolkning', trend: trajectoryScore.populationTrend, change: trajectoryScore.populationChange5yr },
            { label: 'Indkomst', trend: trajectoryScore.incomeTrend, change: undefined },
          ].map(item => (
            <div key={item.label} className="p-3 bg-surface-1 rounded-lg border border-border text-center">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <div className="text-sm font-semibold">
                <TrendArrow trend={item.trend} />
              </div>
              {item.change !== undefined && (
                <p className={`text-xs font-mono mt-1 ${item.change >= 0 ? 'text-score-good' : 'text-score-poor'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}% (5 år)
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Price trend */}
      {pricesData && Object.keys(pricesData.byYear).length >= 3 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">
            Ejendomspriser — {kommuneNavn}
          </h3>
          <TrendLine
            data={pricesData.byYear}
            nationalData={nationalPricesByYear}
            label="Kr./m²"
            formatValue={(v) => `${Math.round(v / 1000)}k`}
            unit=" kr/m²"
            height={180}
          />
          <DataSourceLabel result={prices} />
        </div>
      )}

      {/* Population trend */}
      {demographicsData && Object.keys(demographicsData.byYear).length >= 3 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">
            Befolkningsudvikling — {kommuneNavn}
          </h3>
          <TrendLine
            data={demographicsData.byYear}
            label="Befolkning"
            formatValue={(v) => `${Math.round(v / 1000)}k`}
            color="#10B981"
            height={160}
          />
          <DataSourceLabel result={demographics} />
        </div>
      )}

      {/* Income trend */}
      {incomeData && Object.keys(incomeData.byYear).length >= 3 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">
            Indkomstudvikling — {kommuneNavn}
          </h3>
          <TrendLine
            data={incomeData.byYear}
            label="Medianindkomst"
            formatValue={(v) => `${Math.round(v / 1000)}k`}
            unit=" kr."
            color="#F59E0B"
            height={160}
          />
          <DataSourceLabel result={income} />
        </div>
      )}

      {/* CVR business data */}
      {cvrData ? (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Erhvervsaktivitet</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-surface-1 rounded-lg">
              <p className="text-2xl font-mono font-bold text-ink">{cvrData.activeBusinesses.toLocaleString('da-DK')}</p>
              <p className="text-xs text-gray-400 mt-0.5">Aktive virksomheder</p>
            </div>
            <div className="p-3 bg-surface-1 rounded-lg">
              <p className="text-2xl font-mono font-bold text-score-good">+{cvrData.newLast12Months}</p>
              <p className="text-xs text-gray-400 mt-0.5">Nye (12 mdr.)</p>
            </div>
            <div className="p-3 bg-surface-1 rounded-lg">
              <p className="text-2xl font-mono font-bold text-score-poor">-{cvrData.closedLast12Months}</p>
              <p className="text-xs text-gray-400 mt-0.5">Lukkede (12 mdr.)</p>
            </div>
          </div>
          <DataSourceLabel result={cvr} />
        </div>
      ) : cvr?.status === 'unavailable' && (
        <div className="mt-2 text-sm text-unavailable italic flex items-center gap-1.5">
          <span>ℹ️</span>
          <span>Erhvervsdata ikke tilgængeligt — {cvr.message}</span>
        </div>
      )}
    </div>
  );
}
