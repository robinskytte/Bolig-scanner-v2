// HverdagsScore — Danish "WalkScore" equivalent
// Calculates a 0-100 walkability score based on proximity to key amenities

import {
  AmenitiesData,
  FacilitiesData,
  HverdagsScore,
  HverdagsScoreCategory,
  PlaceResult,
  GTFSStop,
} from '../types';
import { haversineDistance, roadDistance, walkingMinutes } from '../fallback';

// Category definitions: weights must sum to 1.0
const CATEGORIES = [
  {
    name: 'dagligvarer',
    nameDA: 'Dagligvarer',
    icon: '🛒',
    weight: 0.20,
    maxDistance: 1500,
    amenityKey: 'supermarkets' as keyof AmenitiesData,
  },
  {
    name: 'folkeskole',
    nameDA: 'Folkeskole',
    icon: '🏫',
    weight: 0.15,
    maxDistance: 2000,
    amenityKey: 'schools' as keyof AmenitiesData,
  },
  {
    name: 'transport',
    nameDA: 'Offentlig transport',
    icon: '🚌',
    weight: 0.20,
    maxDistance: 800,
    amenityKey: 'transit' as keyof AmenitiesData, // virtual key — handled specially
  },
  {
    name: 'laege',
    nameDA: 'Læge/apotek',
    icon: '⚕️',
    weight: 0.10,
    maxDistance: 1500,
    amenityKey: 'healthcare' as keyof AmenitiesData, // virtual — combines doctors + pharmacies
  },
  {
    name: 'cafe',
    nameDA: 'Café/restaurant',
    icon: '☕',
    weight: 0.10,
    maxDistance: 1000,
    amenityKey: 'cafes' as keyof AmenitiesData,
  },
  {
    name: 'park',
    nameDA: 'Park/grønt område',
    icon: '🌳',
    weight: 0.10,
    maxDistance: 800,
    amenityKey: 'parks' as keyof AmenitiesData,
  },
  {
    name: 'boernehave',
    nameDA: 'Børnehave/vuggestue',
    icon: '👶',
    weight: 0.10,
    maxDistance: 1500,
    amenityKey: 'kindergartens' as keyof AmenitiesData,
  },
  {
    name: 'bibliotek',
    nameDA: 'Bibliotek/kultur',
    icon: '📚',
    weight: 0.05,
    maxDistance: 2000,
    amenityKey: 'libraries' as keyof AmenitiesData,
  },
] as const;

/**
 * Score for a single category.
 * Returns 100 if distance ≤ 200 m, then linearly decays to 0 at maxDistance.
 */
function categoryScore(distanceM: number, maxDistance: number): number {
  if (distanceM <= 200) return 100;
  if (distanceM >= maxDistance) return 0;
  // Linear interpolation between (200, 100) and (maxDistance, 0)
  return Math.round(100 * (1 - (distanceM - 200) / (maxDistance - 200)));
}

/** Return the nearest PlaceResult from a list, or null if the list is empty. */
function nearest(
  lat: number,
  lng: number,
  places: PlaceResult[]
): PlaceResult | null {
  if (!places || places.length === 0) return null;
  let best: PlaceResult | null = null;
  let bestDist = Infinity;
  for (const p of places) {
    const d = haversineDistance(lat, lng, p.lat, p.lng);
    if (d < bestDist) {
      bestDist = d;
      best = { ...p, distance: Math.round(d) };
    }
  }
  return best;
}

/** Convert GTFS stops to synthetic PlaceResult objects. */
function gtfsToPlaceResults(stops: GTFSStop[]): PlaceResult[] {
  return stops.map((s) => ({
    placeId: s.stopId,
    name: s.stopName,
    type: s.type,
    lat: s.lat,
    lng: s.lng,
  }));
}

export function calculateHverdagsScore(
  lat: number,
  lng: number,
  amenities: AmenitiesData | null,
  facilities: FacilitiesData | null,
  gtfsStops: GTFSStop[]
): HverdagsScore {
  const sources: string[] = [];
  if (amenities) sources.push(amenities.source === 'google' ? 'Google Places' : amenities.source === 'osm' ? 'OpenStreetMap' : 'Google Places + OSM');
  if (gtfsStops.length > 0) sources.push('Rejseplanen GTFS');

  const scoredCategories: HverdagsScoreCategory[] = CATEGORIES.map((cat) => {
    let nearestPlace: PlaceResult | null = null;
    let distanceM: number | undefined;

    if (!amenities) {
      return {
        name: cat.name,
        nameDA: cat.nameDA,
        icon: cat.icon,
        weight: cat.weight,
        maxDistance: cat.maxDistance,
        nearest: null,
        distanceM: undefined,
        walkMinutes: undefined,
        score: 0,
      };
    }

    if (cat.name === 'transport') {
      // Combine bus/train stations from amenities AND GTFS stops
      const amenityTransit: PlaceResult[] = [
        ...(amenities.busStations ?? []),
        ...(amenities.trainStations ?? []),
      ];
      const gtfsPlaces = gtfsToPlaceResults(gtfsStops);
      const allTransit = [...amenityTransit, ...gtfsPlaces];
      nearestPlace = nearest(lat, lng, allTransit);
    } else if (cat.name === 'laege') {
      // Combine doctors and pharmacies
      const healthcare: PlaceResult[] = [
        ...(amenities.doctors ?? []),
        ...(amenities.pharmacies ?? []),
      ];
      nearestPlace = nearest(lat, lng, healthcare);
    } else if (cat.name === 'cafe') {
      // Combine cafes and restaurants
      const dining: PlaceResult[] = [
        ...(amenities.cafes ?? []),
        ...(amenities.restaurants ?? []),
      ];
      nearestPlace = nearest(lat, lng, dining);
    } else {
      // Direct amenity key mapping
      const keyMap: Record<string, keyof AmenitiesData> = {
        dagligvarer: 'supermarkets',
        folkeskole: 'schools',
        boernehave: 'kindergartens',
        park: 'parks',
        bibliotek: 'libraries',
      };
      const key = keyMap[cat.name];
      if (key) {
        const list = amenities[key];
        if (Array.isArray(list)) {
          nearestPlace = nearest(lat, lng, list as PlaceResult[]);
        }
      }
    }

    if (nearestPlace) {
      distanceM = nearestPlace.distance ?? Math.round(haversineDistance(lat, lng, nearestPlace.lat, nearestPlace.lng));
      // Use road distance estimate for score calculation
      const roadDist = roadDistance(distanceM);
      const score = categoryScore(roadDist, cat.maxDistance);
      const mins = walkingMinutes(roadDist);
      return {
        name: cat.name,
        nameDA: cat.nameDA,
        icon: cat.icon,
        weight: cat.weight,
        maxDistance: cat.maxDistance,
        nearest: nearestPlace,
        distanceM,
        walkMinutes: mins,
        score,
      };
    }

    return {
      name: cat.name,
      nameDA: cat.nameDA,
      icon: cat.icon,
      weight: cat.weight,
      maxDistance: cat.maxDistance,
      nearest: null,
      distanceM: undefined,
      walkMinutes: undefined,
      score: 0,
    };
  });

  // Weighted total
  const total = Math.round(
    scoredCategories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );

  return {
    total,
    grade: getScoreGrade(total),
    description: getScoreDescription(total),
    categories: scoredCategories,
    sources: sources.length > 0 ? sources : ['Ingen data'],
  };
}

function getScoreDescription(total: number): string {
  if (total >= 90) return 'Walker\'s Paradise — næsten alt kan klares til fods';
  if (total >= 70) return 'Meget gangvenligt — de fleste ærinder kan klares til fods';
  if (total >= 50) return 'Gangvenligt — noget kan klares til fods';
  if (total >= 25) return 'Bil nyttig — nogle ærinder kræver bil';
  return 'Bil afhængigt — næsten alle ærinder kræver bil';
}

function getScoreGrade(total: number): string {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B';
  if (total >= 55) return 'C';
  if (total >= 40) return 'D';
  if (total >= 25) return 'E';
  return 'F';
}
