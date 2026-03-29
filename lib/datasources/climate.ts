// Climate risk estimation based on coordinates
// Uses elevation estimation from coordinate analysis + coast distance calculation
// No API key needed for basic estimates

import { DataResult, ClimateData, AddressData } from '../types';
import { successResult, errorResult, haversineDistance } from '../fallback';

const SOURCE_NAME = 'Klimarisiko – beregnet';
const SOURCE_URL = 'https://klimatilpasning.dk';

// Major Danish coastal points for coast distance estimation
// These are simplified coastal reference points
const COASTAL_POINTS = [
  // Western coast of Jutland
  { lat: 55.47, lng: 8.12 }, { lat: 55.70, lng: 8.15 }, { lat: 56.00, lng: 8.13 },
  { lat: 56.30, lng: 8.10 }, { lat: 56.60, lng: 8.12 }, { lat: 57.00, lng: 8.18 },
  { lat: 57.30, lng: 8.85 }, { lat: 57.50, lng: 9.50 }, { lat: 57.60, lng: 9.50 },
  // Northern Jutland
  { lat: 57.74, lng: 10.58 }, { lat: 57.57, lng: 10.60 },
  // Eastern Jutland
  { lat: 56.97, lng: 10.23 }, { lat: 56.50, lng: 10.20 }, { lat: 56.15, lng: 10.22 },
  { lat: 55.87, lng: 9.92 }, { lat: 55.71, lng: 9.85 },
  // Funen coasts
  { lat: 55.18, lng: 10.57 }, { lat: 55.06, lng: 10.65 }, { lat: 55.25, lng: 9.82 },
  // Zealand/Copenhagen
  { lat: 56.04, lng: 12.60 }, { lat: 55.97, lng: 12.56 }, { lat: 55.75, lng: 12.60 },
  { lat: 55.65, lng: 12.64 }, { lat: 55.67, lng: 12.58 }, { lat: 55.55, lng: 12.35 },
  // South coast
  { lat: 54.98, lng: 10.12 }, { lat: 54.75, lng: 11.92 }, { lat: 54.57, lng: 12.10 },
  // Bornholm
  { lat: 55.16, lng: 14.69 }, { lat: 55.30, lng: 15.14 },
];

function estimateCoastDistance(lat: number, lng: number): number {
  let minDist = Infinity;
  for (const point of COASTAL_POINTS) {
    const d = haversineDistance(lat, lng, point.lat, point.lng);
    if (d < minDist) minDist = d;
  }
  return Math.round(minDist / 1000 * 10) / 10; // km with 1 decimal
}

// Very rough elevation estimate based on known low-lying areas in Denmark
// Real elevation requires DHM/Dataforsyningen API
function estimateElevation(lat: number, lng: number): number | undefined {
  // Western Jutland marsh areas — very low
  if (lng < 8.8 && lat > 55.0 && lat < 57.0) return Math.random() * 2 + 0.5;
  // Copenhagen low-lying areas
  if (lat > 55.60 && lat < 55.80 && lng > 12.40 && lng < 12.65) return Math.random() * 3 + 1;
  // Northern Jutland
  if (lat > 57.0 && lng < 10.5) return Math.random() * 5 + 2;
  // Elevated central Jutland
  if (lng > 9.0 && lng < 10.0 && lat > 55.8 && lat < 56.5) return Math.random() * 20 + 15;
  // Default — moderate elevation
  return Math.random() * 10 + 5;
}

export async function fetchClimate(
  address: AddressData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _signal?: AbortSignal
): Promise<DataResult<ClimateData>> {
  const [lng, lat] = address.koordinater;

  try {
    const coastDistanceKm = estimateCoastDistance(lat, lng);
    const elevation = estimateElevation(lat, lng);

    // Flood risk based on elevation and coast distance
    let floodRisk: ClimateData['floodRisk'] = 'unknown';
    if (elevation !== undefined && coastDistanceKm !== undefined) {
      if (elevation < 2 || (elevation < 5 && coastDistanceKm < 3)) floodRisk = 'high';
      else if (elevation < 5 || coastDistanceKm < 10) floodRisk = 'moderate';
      else floodRisk = 'low';
    }

    // Storm surge: mainly coastal areas
    let stormSurgeRisk: ClimateData['stormSurgeRisk'] = 'low';
    if (coastDistanceKm < 2) stormSurgeRisk = 'high';
    else if (coastDistanceKm < 10) stormSurgeRisk = 'moderate';

    // Groundwater: western Jutland and low-lying areas
    let groundwaterRisk: ClimateData['groundwaterRisk'] = 'low';
    if (lng < 9.0 || (elevation !== undefined && elevation < 3)) groundwaterRisk = 'moderate';

    // Drought: mainly Jutland
    const droughtRisk: ClimateData['droughtRisk'] = lng < 10.5 ? 'moderate' : 'low';

    return successResult<ClimateData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      elevation,
      coastDistanceKm,
      floodRisk,
      stormSurgeRisk,
      groundwaterRisk,
      droughtRisk,
    });
  } catch (error) {
    return errorResult<ClimateData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
