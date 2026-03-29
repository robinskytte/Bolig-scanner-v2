// ClimateScore — long-term climate risk assessment
// Based on elevation, coast distance, flood risk, and groundwater risk

import { ClimateScore, ClimateData, RiskLevel } from '../types';

/**
 * Determine climate risk level.
 *
 * HØJ:     elevation < 3 m  OR  coast < 5 km  OR  confirmed flood risk (high)
 * MODERAT: elevation 3–10 m  OR  coast 5–10 km  OR  moderate flood/groundwater risk
 * LAV:     elevation > 10 m  AND  coast > 10 km  (or data missing and no other risk)
 */
function climateLevel(climate: ClimateData): RiskLevel {
  const { elevation, coastDistanceKm, floodRisk, groundwaterRisk } = climate;

  // HØJ conditions
  const veryLowElevation = elevation !== undefined && elevation < 3;
  const veryCloseCoast = coastDistanceKm !== undefined && coastDistanceKm < 5;
  const confirmedFlood = floodRisk === 'high';

  if (veryLowElevation || veryCloseCoast || confirmedFlood) return 'HØJ';

  // MODERAT conditions
  const lowElevation = elevation !== undefined && elevation >= 3 && elevation <= 10;
  const closeCoast = coastDistanceKm !== undefined && coastDistanceKm >= 5 && coastDistanceKm <= 10;
  const moderateFlood = floodRisk === 'moderate';
  const moderateGroundwater = groundwaterRisk === 'moderate' || groundwaterRisk === 'high';

  if (lowElevation || closeCoast || moderateFlood || moderateGroundwater) return 'MODERAT';

  return 'LAV';
}

/**
 * Build a human-readable timeline string describing projected risk horizon.
 */
function buildTimeline(level: RiskLevel, climate: ClimateData): string {
  const { elevation, coastDistanceKm, floodRisk } = climate;

  if (level === 'HØJ') {
    if (floodRisk === 'high' || (elevation !== undefined && elevation < 3)) {
      return 'Øget risiko nu og frem til 2050 — havniveau stigning forventes 0.5–1 m';
    }
    if (coastDistanceKm !== undefined && coastDistanceKm < 5) {
      return 'Kystrisiko stiger markant efter 2040 ved ekstreme vejrhændelser';
    }
    return 'Høj klimarisiko — kræver opmærksomhed allerede nu';
  }

  if (level === 'MODERAT') {
    return 'Moderat risiko — klimaændringer kan påvirke ejendommen efter 2050';
  }

  return 'Lav klimarisiko i en 30-årig tidshorisont';
}

export function calculateClimateScore(climate: ClimateData | null): ClimateScore {
  if (!climate) {
    return {
      level: 'LAV',
      elevation: undefined,
      coastDistanceKm: undefined,
      floodRisk: 'unknown',
      groundwaterRisk: 'unknown',
      timeline: 'Klimadata ikke tilgængelig',
    };
  }

  const level = climateLevel(climate);
  const timeline = buildTimeline(level, climate);

  return {
    level,
    elevation: climate.elevation,
    coastDistanceKm: climate.coastDistanceKm,
    floodRisk: climate.floodRisk,
    groundwaterRisk: climate.groundwaterRisk,
    timeline,
  };
}
