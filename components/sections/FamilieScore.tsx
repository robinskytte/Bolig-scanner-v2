'use client';

import { AnalysisResult } from '@/lib/types';
import { HverdagsScoreDisplay } from '../HverdagsScore';
import { ScoreBadge, GradeScale } from '../ScoreBadge';
import { DataSourceLabel } from '../DataSourceLabel';
import { SkeletonCard } from '../StreamingProgress';
import { formatDistance } from '@/lib/fallback';

interface FamilieScoreProps {
  result: Partial<AnalysisResult>;
}

export function FamilieScore({ result }: FamilieScoreProps) {
  const { hverdagsScore, familyScore, amenities, facilities } = result;
  const amenitiesData = amenities?.status === 'success' ? amenities.data : null;
  const facilitiesData = facilities?.status === 'success' ? facilities.data : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink">FamilieScore</h2>
          <p className="text-sm text-gray-500 mt-0.5">Egnethed for familier med børn</p>
        </div>
        {familyScore ? (
          <div className="text-right">
            <ScoreBadge grade={familyScore.grade} size="lg" />
            <GradeScale current={familyScore.grade} />
          </div>
        ) : (
          <div className="w-16 h-12 bg-gray-100 rounded-lg animate-pulse" />
        )}
      </div>

      {/* HverdagsScore */}
      {hverdagsScore ? (
        <div className="mb-6">
          <HverdagsScoreDisplay score={hverdagsScore} />
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-gray-100 overflow-hidden">
          <SkeletonCard lines={6} />
        </div>
      )}

      {/* Schools & kindergartens */}
      {amenitiesData && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Skoler og institutioner</h3>
          <div className="space-y-2">
            {amenitiesData.schools.slice(0, 3).map((school, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>🏫</span>
                  <span className="text-ink">{school.name}</span>
                </div>
                <span className="text-gray-500 font-mono text-xs">
                  {school.distance !== undefined ? formatDistance(school.distance) : '—'}
                </span>
              </div>
            ))}
            {amenitiesData.kindergartens.slice(0, 2).map((k, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>👶</span>
                  <span className="text-ink">{k.name}</span>
                </div>
                <span className="text-gray-500 font-mono text-xs">
                  {k.distance !== undefined ? formatDistance(k.distance) : '—'}
                </span>
              </div>
            ))}
          </div>
          <DataSourceLabel result={amenities || null} />
        </div>
      )}

      {/* Facilities */}
      {facilitiesData && (facilitiesData.legepladser.length > 0 || facilitiesData.idraetsbaner.length > 0) && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Parker og faciliteter (2 km radius)</h3>
          <div className="flex flex-wrap gap-2">
            {facilitiesData.legepladser.length > 0 && (
              <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                🛝 {facilitiesData.legepladser.length} legepladser
              </span>
            )}
            {facilitiesData.idraetsbaner.length > 0 && (
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                ⚽ {facilitiesData.idraetsbaner.length} sportsbaner
              </span>
            )}
            {facilitiesData.svoemmehal.length > 0 && (
              <span className="bg-cyan-50 text-cyan-700 text-xs px-2.5 py-1 rounded-full">
                🏊 {facilitiesData.svoemmehal.length} svømmebad
              </span>
            )}
            {amenitiesData && amenitiesData.parks.length > 0 && (
              <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                🌳 {amenitiesData.parks.length} parker
              </span>
            )}
          </div>
          <DataSourceLabel result={facilities || null} />
        </div>
      )}

      {/* City distances */}
      {familyScore?.cityDistances && familyScore.cityDistances.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Afstand til nærmeste byer</h3>
          <div className="space-y-2">
            {familyScore.cityDistances.map((city, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink">🏙️ {city.name}</span>
                <div className="text-right">
                  <span className="text-gray-700 font-mono">{city.distanceKm} km</span>
                  <span className="text-gray-400 ml-2 text-xs">ca. {city.driveMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Estimeret baseret på afstand i fugleflugt × 1,3 vejfaktor. Faktisk rejsetid kan variere.
          </p>
        </div>
      )}
    </div>
  );
}
