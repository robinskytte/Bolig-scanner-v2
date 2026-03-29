'use client';

import { AnalysisResult } from '@/lib/types';
import { DataSourceLabel } from '../DataSourceLabel';
import { TrendLine } from '../charts/TrendLine';
import { RadarScore } from '../charts/RadarScore';
import { SkeletonCard } from '../StreamingProgress';

interface NaboScoreProps {
  result: Partial<AnalysisResult>;
}

function formatIncome(v: number) {
  return `${Math.round(v / 1000)}k kr.`;
}

function formatCrime(v: number) {
  return `${v.toFixed(1)}‰`;
}

export function NaboScore({ result }: NaboScoreProps) {
  const { demographics, income, crime, tax, education, amenities } = result;
  const kommuneNavn = result.address?.kommuneNavn || 'kommunen';

  const demographicsData = demographics?.status === 'success' ? demographics.data : null;
  const incomeData = income?.status === 'success' ? income.data : null;
  const crimeData = crime?.status === 'success' ? crime.data : null;
  const taxData = tax?.status === 'success' ? tax.data : null;
  const educationData = education?.status === 'success' ? education.data : null;
  const amenitiesData = amenities?.status === 'success' ? amenities.data : null;

  // Build radar chart data
  const radarData = [];
  if (incomeData) {
    radarData.push({
      subject: 'Indkomst',
      score: Math.min(10, Math.round((incomeData.medianIncome / incomeData.nationalMedian) * 10 * 10) / 10),
      fullMark: 10,
    });
  }
  if (educationData) {
    radarData.push({
      subject: 'Uddannelse',
      score: Math.min(10, Math.round((educationData.higherPct / (educationData.nationalHigherPct || 30)) * 10 * 10) / 10),
      fullMark: 10,
    });
  }
  if (crimeData) {
    // Invert: lower crime = higher score
    const crimeRatio = crimeData.nationalAverage > 0 ? crimeData.crimePer1000 / crimeData.nationalAverage : 1;
    radarData.push({
      subject: 'Tryghed',
      score: Math.min(10, Math.max(1, Math.round((2 - crimeRatio) * 5 * 10) / 10)),
      fullMark: 10,
    });
  }
  if (amenitiesData) {
    const totalAmenities = amenitiesData.supermarkets.length + amenitiesData.restaurants.length + amenitiesData.parks.length;
    radarData.push({
      subject: 'Byliv',
      score: Math.min(10, Math.round(totalAmenities / 3)),
      fullMark: 10,
    });
  }
  if (taxData) {
    // Lower tax = higher score (inverted)
    const taxRatio = taxData.nationalAverage > 0 ? taxData.kommuneskat / (taxData.nationalAverage - taxData.kirkeskat) : 1;
    radarData.push({
      subject: 'Skatter',
      score: Math.min(10, Math.max(1, Math.round((2 - taxRatio) * 5 * 10) / 10)),
      fullMark: 10,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <h2 className="text-xl font-serif font-semibold text-ink mb-1">Nabolagsprofil</h2>
      <p className="text-sm text-gray-500 mb-5">
        Data for {kommuneNavn} — kommuneniveau
      </p>

      {/* Radar chart */}
      {radarData.length >= 3 && (
        <div className="mb-6">
          <RadarScore data={radarData} />
        </div>
      )}

      {/* Demographics */}
      {demographicsData ? (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Befolkning</h3>
          <p className="text-2xl font-mono font-bold text-ink">
            {demographicsData.total.toLocaleString('da-DK')}
          </p>
          <p className="text-xs text-gray-500 mb-3">Indbyggere i {kommuneNavn}</p>

          {/* Age breakdown */}
          <div className="space-y-1">
            {Object.entries(demographicsData.ageGroups).map(([age, pct]) => (
              <div key={age} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-16">{age} år</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-ocean h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-gray-600 w-10 text-right font-mono">{pct}%</span>
              </div>
            ))}
          </div>

          {/* Population trend */}
          {Object.keys(demographicsData.byYear).length >= 3 && (
            <div className="mt-4">
              <TrendLine
                data={demographicsData.byYear}
                label="Befolkning"
                unit=" pers."
                formatValue={(v) => (v / 1000).toFixed(1) + 'k'}
                height={160}
              />
            </div>
          )}
          <DataSourceLabel result={demographics} />
        </div>
      ) : (
        demographics?.status === 'loading' && <SkeletonCard lines={5} />
      )}

      {/* Income */}
      {incomeData ? (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Indkomstniveau</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-2xl font-mono font-bold text-ink">{formatIncome(incomeData.medianIncome)}</p>
              <p className="text-xs text-gray-500">Medianindkomst — {kommuneNavn}</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-gray-400">{formatIncome(incomeData.nationalMedian)}</p>
              <p className="text-xs text-gray-400">Landsmedian</p>
            </div>
          </div>
          {incomeData.medianIncome > 0 && incomeData.nationalMedian > 0 && (
            <div className={`text-sm font-medium ${incomeData.medianIncome > incomeData.nationalMedian ? 'text-score-excellent' : 'text-score-moderate'}`}>
              {incomeData.medianIncome > incomeData.nationalMedian
                ? `${Math.round(((incomeData.medianIncome - incomeData.nationalMedian) / incomeData.nationalMedian) * 100)}% over landsgennemsnit`
                : `${Math.round(((incomeData.nationalMedian - incomeData.medianIncome) / incomeData.nationalMedian) * 100)}% under landsgennemsnit`}
            </div>
          )}
          {Object.keys(incomeData.byYear).length >= 3 && (
            <div className="mt-4">
              <TrendLine
                data={incomeData.byYear}
                label="Medianindkomst"
                formatValue={formatIncome}
                height={160}
              />
            </div>
          )}
          <DataSourceLabel result={income} />
        </div>
      ) : income?.status === 'loading' && <SkeletonCard />}

      {/* Education */}
      {educationData && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Uddannelsesniveau</h3>
          <div className="space-y-2">
            {[
              { label: 'Grundskole', pct: educationData.primaryPct, color: 'bg-gray-300' },
              { label: 'Gymnasial/erhverv', pct: educationData.secondaryPct, color: 'bg-blue-300' },
              { label: 'Videregående', pct: educationData.higherPct, color: 'bg-ocean' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-36">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-gray-600 w-10 text-right font-mono">{item.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Videregående uddannelse landsgennemsnit: {educationData.nationalHigherPct}%
          </p>
          <DataSourceLabel result={education} />
        </div>
      )}

      {/* Crime */}
      {crimeData && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Kriminalitetsindeks</h3>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <p className="text-2xl font-mono font-bold text-ink">{formatCrime(crimeData.crimePer1000)}</p>
              <p className="text-xs text-gray-500">Anmeldelser pr. 1.000 — {kommuneNavn}</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-gray-400">{formatCrime(crimeData.nationalAverage)}</p>
              <p className="text-xs text-gray-400">Landsgennemsnit</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Anmeldte forbrydelser pr. 1.000 indbyggere i {kommuneNavn}, sammenlignet med landsgennemsnittet
          </p>
          <DataSourceLabel result={crime} />
        </div>
      )}

      {/* Tax */}
      {taxData && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Kommuneskat</h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-mono font-bold text-ink">{taxData.kommuneskat}%</p>
              <p className="text-xs text-gray-500">Kommuneskat — {kommuneNavn}</p>
            </div>
            {taxData.kirkeskat > 0 && (
              <div>
                <p className="text-lg font-mono text-gray-600">+{taxData.kirkeskat}%</p>
                <p className="text-xs text-gray-400">Kirkeskat</p>
              </div>
            )}
          </div>
          <DataSourceLabel result={tax} />
        </div>
      )}

      {/* Restaurants */}
      {amenitiesData && amenitiesData.restaurants.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-ink mb-3">Restauranter og caféer i nærheden</h3>
          <div className="space-y-1.5">
            {[...amenitiesData.restaurants, ...amenitiesData.cafes]
              .filter(p => p.rating)
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5)
              .map((place, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink truncate flex-1 mr-2">{place.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-yellow-400">★</span>
                    <span className="text-gray-600 font-mono text-xs">{place.rating?.toFixed(1)}</span>
                    {place.ratingCount && (
                      <span className="text-gray-400 text-xs">({place.ratingCount})</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <DataSourceLabel result={amenities} />
        </div>
      )}
    </div>
  );
}
