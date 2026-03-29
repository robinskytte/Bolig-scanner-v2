'use client';

import { AnalysisResult, ContaminationData, NoiseData } from '@/lib/types';
import { ScoreBadge } from '../ScoreBadge';
import { DataSourceLabel } from '../DataSourceLabel';

interface BoligRisikoProps {
  result: Partial<AnalysisResult>;
}

const radonLabels = {
  low: { label: 'Lav', color: 'text-score-excellent' },
  moderate: { label: 'Moderat', color: 'text-score-moderate' },
  high: { label: 'Forhøjet', color: 'text-score-poor' },
};

const contaminationLabels = {
  clean: { label: 'Ren', color: 'text-score-excellent', icon: '✓' },
  V1: { label: 'Kortlagt V1 (mistanke)', color: 'text-score-moderate', icon: '⚠️' },
  V2: { label: 'Kortlagt V2 (dokumenteret)', color: 'text-score-poor', icon: '❌' },
  unknown: { label: 'Ikke undersøgt', color: 'text-gray-400', icon: '?' },
};

export function BoligRisiko({ result }: BoligRisikoProps) {
  const { riskScore, contamination, noise, foodSafety } = result;
  const contaminationData = contamination?.status === 'success' ? contamination.data as ContaminationData : null;
  const noiseData = noise?.status === 'success' ? noise.data as NoiseData : null;
  const smileyData = foodSafety?.status === 'success' ? foodSafety.data : null;

  const contStatus = contaminationData?.status ?? 'unknown';
  const contInfo = contaminationLabels[contStatus];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink">BoligRisiko</h2>
          <p className="text-sm text-gray-500 mt-0.5">Risikoscreening af ejendommen</p>
        </div>
        {riskScore ? (
          <ScoreBadge risk={riskScore.level} size="md" />
        ) : (
          <div className="w-24 h-8 bg-gray-100 rounded-md animate-pulse" />
        )}
      </div>

      <div className="space-y-4">
        {/* Contamination */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-ink">Jordforurening</h3>
            <span className={`text-sm font-semibold ${contInfo.color}`}>
              {contInfo.icon} {contInfo.label}
            </span>
          </div>
          {contaminationData?.v1Details && (
            <p className="text-xs text-score-moderate mt-1">{contaminationData.v1Details}</p>
          )}
          {contaminationData?.v2Details && (
            <p className="text-xs text-score-poor mt-1">{contaminationData.v2Details}</p>
          )}
          {contStatus === 'clean' && (
            <p className="text-xs text-gray-500 mt-1">Ingen registreret forurening på matriklen</p>
          )}
          <DataSourceLabel result={contamination || null} className="mt-2" />
        </div>

        {/* Noise */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-ink">Støjniveau</h3>
            {noiseData?.maxLden !== null && noiseData?.maxLden !== undefined ? (
              <span className={`text-sm font-semibold ${
                noiseData.maxLden > 65 ? 'text-score-poor' :
                noiseData.maxLden > 55 ? 'text-score-moderate' :
                'text-score-excellent'
              }`}>
                {noiseData.maxLden} dB (Lden)
              </span>
            ) : (
              <span className="text-sm text-gray-400">Ikke målt</span>
            )}
          </div>
          {noiseData?.classification && (
            <p className="text-xs text-gray-500">
              {noiseData.classification === 'quiet' && 'Stille område — under 55 dB Lden'}
              {noiseData.classification === 'moderate' && 'Moderat støj — 55-65 dB Lden'}
              {noiseData.classification === 'loud' && 'Støjbelastet — 65-70 dB Lden'}
              {noiseData.classification === 'very_loud' && 'Meget støjbelastet — over 70 dB Lden'}
              {noiseData.classification === 'unknown' && 'Støjdata ikke tilgængeligt for adressen'}
            </p>
          )}
          {noiseData?.roadNoiseLden !== null && noiseData?.roadNoiseLden !== undefined && (
            <p className="text-xs text-gray-400 mt-1">Vejstøj: {noiseData.roadNoiseLden} dB</p>
          )}
          {noiseData?.railNoiseLden !== null && noiseData?.railNoiseLden !== undefined && (
            <p className="text-xs text-gray-400">Jernbanestøj: {noiseData.railNoiseLden} dB</p>
          )}
          <DataSourceLabel result={noise || null} className="mt-2" />
        </div>

        {/* Radon */}
        {riskScore && (
          <div className="p-4 rounded-xl bg-surface-1 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Radonrisiko</h3>
              <span className={`text-sm font-semibold ${radonLabels[riskScore.radonRisk].color}`}>
                {radonLabels[riskScore.radonRisk].label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Regionalt estimat baseret på koordinater.
              {riskScore.radonRisk === 'high' && ' Vestjylland har forhøjet radonforekomst pga. jordbundsforhold.'}
              {riskScore.radonRisk === 'moderate' && ' Midtjylland og Nordjylland har moderat radonrisiko.'}
              {riskScore.radonRisk === 'low' && ' Øerne og kystområder har generelt lav radonrisiko.'}
            </p>
          </div>
        )}

        {/* Food safety */}
        {smileyData && smileyData.totalCount > 0 && (
          <div className="p-4 rounded-xl bg-surface-1 border border-border">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-ink">Fødevarekontrol i området</h3>
              <span className={`text-sm font-semibold ${
                smileyData.averageRating <= 1.5 ? 'text-score-excellent' :
                smileyData.averageRating <= 2.5 ? 'text-score-good' :
                'text-score-moderate'
              }`}>
                {smileyData.averageRating.toFixed(1)} / 4
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {smileyData.totalCount} kontrollerede virksomheder i {result.address?.postnr}
              {smileyData.eliteCount > 0 && ` — ${smileyData.eliteCount} med Elite-smiley`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Skala 1–4, hvor 1 er bedst (glad smiley)
            </p>
            <DataSourceLabel result={foodSafety || null} className="mt-2" />
          </div>
        )}
      </div>
    </div>
  );
}
