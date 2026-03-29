// FamilyScore — suitability score for families with children
// Grades A-F based on HverdagsScore, school/kindergarten proximity, and city access

import { FamilyScore, ScoreGrade, HverdagsScore, AmenitiesData, FacilitiesData } from '../types';
import { haversineDistance, TOP_10_CITIES, estimateDriveMinutes } from '../fallback';

/** Return the distance in meters to the nearest place in a list, or undefined. */
function nearestDistanceM(
  lat: number,
  lng: number,
  places: Array<{ lat: number; lng: number }>
): number | undefined {
  if (!places || places.length === 0) return undefined;
  let best = Infinity;
  for (const p of places) {
    const d = haversineDistance(lat, lng, p.lat, p.lng);
    if (d < best) best = d;
  }
  return Math.round(best);
}

/** Determine ScoreGrade based on hverdagsScore and facility proximity. */
function gradeFamily(
  hverdagsTotal: number,
  schoolDistanceM: number | undefined,
  kindergartenDistanceM: number | undefined
): ScoreGrade {
  const schoolOk = schoolDistanceM !== undefined && schoolDistanceM <= 1000;
  const schoolNearby = schoolDistanceM !== undefined && schoolDistanceM <= 1500;
  const kindergartenNearby = kindergartenDistanceM !== undefined && kindergartenDistanceM <= 1500;

  if (hverdagsTotal >= 80 && schoolOk && kindergartenNearby) return 'A';
  if (hverdagsTotal >= 65 && schoolNearby) return 'B';
  if (hverdagsTotal >= 50) return 'C';
  if (hverdagsTotal >= 35) return 'D';
  if (hverdagsTotal >= 20) return 'E';
  return 'F';
}

export function calculateFamilyScore(
  lat: number,
  lng: number,
  hverdagsScore: HverdagsScore | null,
  amenities: AmenitiesData | null,
  facilities: FacilitiesData | null
): FamilyScore {
  const hverdagsTotal = hverdagsScore?.total ?? 0;

  // School and kindergarten distances
  const schoolDistanceM = amenities
    ? nearestDistanceM(lat, lng, amenities.schools)
    : undefined;
  const kindergartenDistanceM = amenities
    ? nearestDistanceM(lat, lng, amenities.kindergartens)
    : undefined;

  // Grade
  const grade = gradeFamily(hverdagsTotal, schoolDistanceM, kindergartenDistanceM);

  // Distances to 2 nearest cities from TOP_10_CITIES
  const citiesWithDistance = TOP_10_CITIES.map((city) => {
    const distanceKm = haversineDistance(lat, lng, city.lat, city.lng) / 1000;
    const roundedKm = Math.max(0.1, Math.round(distanceKm * 10) / 10);
    return {
      name: city.name,
      distanceKm: roundedKm,
      driveMinutes: estimateDriveMinutes(roundedKm),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestCities = citiesWithDistance.slice(0, 2);

  // Playground count from GeoFA facilities
  const playgroundCount = facilities?.legepladser?.length ?? 0;

  // Park count from amenities
  const parkCount = amenities?.parks?.length ?? 0;

  return {
    grade,
    hverdagsScore: hverdagsTotal,
    schoolDistance: schoolDistanceM,
    kindergartenDistance: kindergartenDistanceM,
    cityDistances: nearestCities,
    playgroundCount,
    parkCount,
  };
}
