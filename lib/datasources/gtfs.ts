// GTFS transit stop data — pre-processed from Rejseplanen
// The raw GTFS is processed by scripts/process-gtfs.ts into data/gtfs/stops.json
// This module loads the pre-processed stops and finds nearby ones

import { GTFSStop } from '../types';
import { haversineDistance } from '../fallback';
import * as fs from 'fs';
import * as path from 'path';

let cachedStops: GTFSStop[] | null = null;

function loadStops(): GTFSStop[] {
  if (cachedStops) return cachedStops;

  try {
    const filePath = path.join(process.cwd(), 'data', 'gtfs', 'stops.json');
    if (!fs.existsSync(filePath)) {
      console.warn('[gtfs] stops.json not found — run npm run setup:gtfs to generate');
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    cachedStops = JSON.parse(raw) as GTFSStop[];
    return cachedStops;
  } catch (err) {
    console.error('[gtfs] Failed to load stops:', err);
    return [];
  }
}

export function findNearbyStops(
  lat: number,
  lng: number,
  radiusM: number = 2000
): GTFSStop[] {
  const stops = loadStops();
  return stops
    .filter((stop) => haversineDistance(lat, lng, stop.lat, stop.lng) <= radiusM)
    .map((stop) => ({
      ...stop,
      distance: Math.round(haversineDistance(lat, lng, stop.lat, stop.lng)),
    }))
    .sort((a, b) => (a as GTFSStop & { distance: number }).distance - (b as GTFSStop & { distance: number }).distance)
    .slice(0, 20);
}

export function getAllStops(): GTFSStop[] {
  return loadStops();
}
