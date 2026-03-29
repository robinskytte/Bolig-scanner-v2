// RiskScore — environmental and safety risk assessment
// Combines contamination, noise, flood risk, radon, and food safety data

import { RiskScore, RiskLevel, SmileyData, ClimateData } from '../types';

/**
 * Approximate radon risk by latitude (proxy for region in Denmark).
 *
 * Western Jutland (roughly lng < 9.5) and parts of central Jutland have
 * elevated radon due to geological composition. The rest of Denmark is
 * moderate-to-low risk.
 *
 * lat/lng are used as a rough regional proxy:
 *   - Western Jutland: lng < 9.5 → 'high'
 *   - Rest of Jutland: lat > 55.5 AND lng < 10.5 → 'moderate'
 *   - Islands (Funen, Zealand, Bornholm): → 'low'
 */
function estimateRadonRisk(lat: number, lng: number): 'low' | 'moderate' | 'high' {
  // Western Jutland — elevated radon belt
  if (lng < 9.5 && lat > 55.0 && lat < 57.5) return 'high';
  // Central/northern Jutland
  if (lng < 10.5 && lat > 55.4) return 'moderate';
  // Islands, coastal areas, Copenhagen
  return 'low';
}

/**
 * Normalise floodRisk string to a comparable level.
 * Accepts the ClimateData enum values or legacy strings.
 */
function parseFloodRisk(
  floodRisk: string
): 'low' | 'moderate' | 'high' | 'unknown' {
  switch (floodRisk?.toLowerCase()) {
    case 'high':
    case 'høj':
      return 'high';
    case 'moderate':
    case 'moderat':
      return 'moderate';
    case 'low':
    case 'lav':
      return 'low';
    default:
      return 'unknown';
  }
}

/**
 * Determine the overall risk level.
 *
 * HØJ:     V2 contamination  OR  noise > 65 dB  OR  (flood AND coast < 5 km)
 * MODERAT: V1 contamination  OR  noise 55–65 dB  OR  moderate flood risk
 * LAV:     clean             AND noise < 55 dB   (or data missing)
 */
function overallLevel(
  contamination: 'clean' | 'V1' | 'V2' | 'unknown',
  noiseLden: number | undefined,
  flood: 'low' | 'moderate' | 'high' | 'unknown',
  coastDistanceKm: number | undefined
): RiskLevel {
  const highContamination = contamination === 'V2';
  const highNoise = noiseLden !== undefined && noiseLden > 65;
  const coastClose = coastDistanceKm !== undefined && coastDistanceKm < 5;
  const floodAndCoast = flood === 'high' && coastClose;

  if (highContamination || highNoise || floodAndCoast) return 'HØJ';

  const moderateContamination = contamination === 'V1';
  const moderateNoise = noiseLden !== undefined && noiseLden >= 55 && noiseLden <= 65;
  const moderateFlood = flood === 'moderate' || flood === 'high';

  if (moderateContamination || moderateNoise || moderateFlood) return 'MODERAT';

  return 'LAV';
}

export function calculateRiskScore(
  lat: number,
  lng: number,
  contamination: 'clean' | 'V1' | 'V2' | 'unknown',
  noiseLden: number | undefined,
  floodRisk: string,
  smileyData: SmileyData | null,
  coastDistanceKm: number | undefined
): RiskScore {
  const flood = parseFloodRisk(floodRisk);
  const radonRisk = estimateRadonRisk(lat, lng);
  const level = overallLevel(contamination, noiseLden, flood, coastDistanceKm);

  return {
    level,
    contamination,
    noiseLden,
    radonRisk,
    floodRisk: flood,
    smileyAverage: smileyData?.averageRating ?? undefined,
  };
}
