'use client';

import { AnalysisResult } from '@/lib/types';
import { ScoreBadge } from '../ScoreBadge';
import { DataSourceLabel } from '../DataSourceLabel';

interface KlimaRisikoProps {
  result: Partial<AnalysisResult>;
}

const floodRiskLabels = {
  low: { label: 'Lav', color: 'text-score-excellent' },
  moderate: { label: 'Moderat', color: 'text-score-moderate' },
  high: { label: 'Høj', color: 'text-score-poor' },
  unknown: { label: 'Ukendt', color: 'text-gray-400' },
};

export function KlimaRisiko({ result }: KlimaRisikoProps) {
  const { climateScore, climate } = result;
  const climateData = climate?.status === 'success' ? climate.data : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink">Klimarisiko 2050</h2>
          <p className="text-sm text-gray-500 mt-0.5">Klimarelaterede risici på lang sigt</p>
        </div>
        {climateScore ? (
          <ScoreBadge risk={climateScore.level} size="md" />
        ) : (
          <div className="w-24 h-8 bg-gray-100 rounded-md animate-pulse" />
        )}
      </div>

      {climateScore && (
        <>
          {/* Timeline */}
          <div className="bg-surface-1 rounded-xl p-4 mb-4 border border-border">
            <p className="text-sm text-ink font-medium">Tidslinje</p>
            <p className="text-sm text-gray-600 mt-1">{climateScore.timeline}</p>
          </div>

          {/* Risk grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {climateData?.elevation !== undefined && (
              <div className="p-3 bg-surface-1 rounded-lg border border-border">
                <p className="text-xs text-gray-400">Højde over havet</p>
                <p className="text-lg font-mono font-bold text-ink mt-0.5">
                  ca. {Math.round(climateData.elevation)} m
                </p>
                <p className="text-xs text-gray-400">Estimat</p>
              </div>
            )}
            {climateData?.coastDistanceKm !== undefined && (
              <div className="p-3 bg-surface-1 rounded-lg border border-border">
                <p className="text-xs text-gray-400">Afstand til kyst</p>
                <p className="text-lg font-mono font-bold text-ink mt-0.5">
                  {climateData.coastDistanceKm} km
                </p>
                <p className="text-xs text-gray-400">Fra nærmeste kystlinje</p>
              </div>
            )}
          </div>

          {/* Risk breakdown */}
          <div className="space-y-2">
            {[
              { label: 'Oversvømmelsesrisiko', value: climateScore.floodRisk },
              { label: 'Grundvandsrisiko', value: climateScore.groundwaterRisk },
            ].map((item) => {
              const risk = item.value as keyof typeof floodRiskLabels;
              const info = floodRiskLabels[risk] || floodRiskLabels.unknown;
              return (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
                </div>
              );
            })}
            {climateData?.stormSurgeRisk && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">Stormflod</span>
                <span className={`text-sm font-semibold ${floodRiskLabels[climateData.stormSurgeRisk].color}`}>
                  {floodRiskLabels[climateData.stormSurgeRisk].label}
                </span>
              </div>
            )}
          </div>

          <DataSourceLabel result={climate || null} className="mt-4" />
        </>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Klimarisikovurdering baseret på koordinatanalyse og afstandsberegninger.
          For præcis oversvømmelseskortlægning, se{' '}
          <a href="https://klimatilpasning.dk" target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline">
            klimatilpasning.dk
          </a>.
        </p>
      </div>
    </div>
  );
}
