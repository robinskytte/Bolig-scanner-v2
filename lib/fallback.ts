// Fallback and N/A data handlers

import { DataResult, DataScope } from './types';

export function unavailableResult<T>(
  source: string,
  sourceUrl: string,
  scope: DataScope,
  message = 'API-adgang ikke konfigureret'
): DataResult<T> {
  return {
    status: 'unavailable',
    source,
    sourceUrl,
    scope,
    message,
    data: null,
    fetchedAt: new Date().toISOString(),
  };
}

export function errorResult<T>(
  source: string,
  sourceUrl: string,
  scope: DataScope,
  error: unknown
): DataResult<T> {
  const message = error instanceof Error ? error.message : String(error);
  return {
    status: 'error',
    source,
    sourceUrl,
    scope,
    message: `Fejl ved datahentning: ${message}`,
    data: null,
    fetchedAt: new Date().toISOString(),
  };
}

export function successResult<T>(
  source: string,
  sourceUrl: string,
  scope: DataScope,
  data: T
): DataResult<T> {
  return {
    status: 'success',
    source,
    sourceUrl,
    scope,
    data,
    fetchedAt: new Date().toISOString(),
  };
}

// Format N/A text for display
export function naText(reason?: string): string {
  if (reason) return `Ikke tilgængelig — ${reason}`;
  return 'Ikke tilgængelig';
}

// Calculate straight-line distance between two coordinates (meters)
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimated road distance from straight-line distance (factor 1.3)
export function roadDistance(straightLineMeters: number): number {
  return Math.round(straightLineMeters * 1.3);
}

// Convert meters to walking minutes (avg 5 km/h)
export function walkingMinutes(meters: number): number {
  return Math.round(meters / 83.33); // 5000m/60min = 83.33 m/min
}

// Estimate driving time in minutes based on distance
export function estimateDriveMinutes(distanceKm: number): number {
  // Simple model: motorway factor for longer distances, minimum 1 minute
  let minutes: number;
  if (distanceKm < 5) minutes = distanceKm / 50 * 60; // city speed ~50 km/h
  else if (distanceKm < 30) minutes = distanceKm / 70 * 60; // mixed ~70 km/h
  else minutes = distanceKm / 90 * 60; // motorway ~90 km/h avg
  return Math.max(1, Math.round(minutes));
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// The 10 largest Danish cities with coordinates
export const TOP_10_CITIES = [
  { name: 'København', lat: 55.6761, lng: 12.5683 },
  { name: 'Aarhus', lat: 56.1629, lng: 10.2039 },
  { name: 'Odense', lat: 55.4038, lng: 10.4024 },
  { name: 'Aalborg', lat: 57.0488, lng: 9.9217 },
  { name: 'Esbjerg', lat: 55.4765, lng: 8.4594 },
  { name: 'Randers', lat: 56.4607, lng: 10.0365 },
  { name: 'Vejle', lat: 55.7093, lng: 9.5356 },
  { name: 'Horsens', lat: 55.8607, lng: 9.8515 },
  { name: 'Kolding', lat: 55.4904, lng: 9.4721 },
  { name: 'Silkeborg', lat: 56.1496, lng: 9.5482 },
] as const;
