// Google Places API — amenity density, ratings, walk distances
// Requires API key — falls back to OpenStreetMap Overpass if unavailable

import { DataResult, AmenitiesData, PlaceResult, AddressData } from '../types';
import { getApiKey } from '../config';
import { errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'Google Places API';
const SOURCE_URL = 'https://maps.googleapis.com/maps/api/place';

interface GooglePlaceResult {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

async function fetchNearby(
  lat: number,
  lng: number,
  type: string,
  radius: number,
  apiKey: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Google Places HTTP ${response.status}`);

  const data = await response.json();

  if (data.status === 'REQUEST_DENIED') {
    throw new Error(`Google Places nægtet: ${data.error_message}`);
  }

  return (data.results || []).map((r: GooglePlaceResult): PlaceResult => ({
    placeId: r.place_id,
    name: r.name,
    type,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    rating: r.rating,
    ratingCount: r.user_ratings_total,
  }));
}

// OpenStreetMap Overpass fallback
async function fetchOverpass(
  lat: number,
  lng: number,
  tags: string[],
  radiusM: number,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const tagQuery = tags.map((t) => {
    const [k, v] = t.split('=');
    return v ? `node["${k}"="${v}"](around:${radiusM},${lat},${lng});` : `node["${k}"](around:${radiusM},${lat},${lng});`;
  }).join('');

  const query = `[out:json][timeout:10];(${tagQuery});out body;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);

  const data = await response.json();

  return (data.elements || []).map((el: { id: number; tags?: { name?: string; amenity?: string; shop?: string; leisure?: string }; lat: number; lon: number }): PlaceResult => ({
    placeId: `osm:${el.id}`,
    name: el.tags?.name || tags[0] || 'Ukendt',
    type: el.tags?.amenity || el.tags?.shop || el.tags?.leisure || tags[0],
    lat: el.lat,
    lng: el.lon,
  }));
}

export async function fetchGooglePlaces(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<AmenitiesData>> {
  const [lng, lat] = address.koordinater;
  const apiKey = await getApiKey('Google_Places');

  if (!apiKey) {
    // Fall back to OpenStreetMap Overpass API
    return fetchOSMAmenities(lat, lng, signal);
  }

  try {
    const radius = 2000;

    const [supermarkets, schools, kindergartens, pharmacies, doctors, restaurants, cafes, busStations, trainStations, parks, libraries] = await Promise.all([
      fetchNearby(lat, lng, 'supermarket', radius, apiKey, signal),
      fetchNearby(lat, lng, 'school', radius, apiKey, signal),
      fetchNearby(lat, lng, 'kindergarten', radius, apiKey, signal),
      fetchNearby(lat, lng, 'pharmacy', radius, apiKey, signal),
      fetchNearby(lat, lng, 'doctor', radius, apiKey, signal),
      fetchNearby(lat, lng, 'restaurant', radius, apiKey, signal),
      fetchNearby(lat, lng, 'cafe', radius, apiKey, signal),
      fetchNearby(lat, lng, 'bus_station', radius, apiKey, signal),
      fetchNearby(lat, lng, 'train_station', radius, apiKey, signal),
      fetchNearby(lat, lng, 'park', radius, apiKey, signal),
      fetchNearby(lat, lng, 'library', radius, apiKey, signal),
    ]);

    return successResult<AmenitiesData>(SOURCE_NAME, SOURCE_URL, '2km_radius', {
      supermarkets,
      schools,
      kindergartens,
      pharmacies,
      doctors,
      restaurants,
      cafes,
      busStations,
      trainStations,
      parks,
      libraries,
      source: 'google',
    });
  } catch (error) {
    // Fallback to OSM on error
    console.warn('[googleplaces] Falling back to OSM:', error);
    return fetchOSMAmenities(lat, lng, signal);
  }
}

async function fetchOSMAmenities(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<DataResult<AmenitiesData>> {
  const osmSource = 'OpenStreetMap – Overpass API';
  const osmUrl = 'https://overpass-api.de';

  try {
    const r = 2000;
    const [supermarkets, schools, kindergartens, pharmacies, doctors, restaurants, cafes, busStops, trainStops, parks, libraries] = await Promise.all([
      fetchOverpass(lat, lng, ['shop=supermarket', 'shop=convenience', 'shop=grocery'], r, signal),
      fetchOverpass(lat, lng, ['amenity=school'], r, signal),
      fetchOverpass(lat, lng, ['amenity=kindergarten'], r, signal),
      fetchOverpass(lat, lng, ['amenity=pharmacy'], r, signal),
      fetchOverpass(lat, lng, ['amenity=doctors', 'amenity=clinic'], r, signal),
      fetchOverpass(lat, lng, ['amenity=restaurant'], r, signal),
      fetchOverpass(lat, lng, ['amenity=cafe'], r, signal),
      fetchOverpass(lat, lng, ['highway=bus_stop'], r, signal),
      fetchOverpass(lat, lng, ['railway=station', 'railway=halt'], r, signal),
      fetchOverpass(lat, lng, ['leisure=park', 'leisure=garden'], r, signal),
      fetchOverpass(lat, lng, ['amenity=library'], r, signal),
    ]);

    return successResult<AmenitiesData>(osmSource, osmUrl, '2km_radius', {
      supermarkets,
      schools,
      kindergartens,
      pharmacies,
      doctors,
      restaurants,
      cafes,
      busStations: busStops,
      trainStations: trainStops,
      parks,
      libraries,
      source: 'osm',
    });
  } catch (error) {
    return errorResult<AmenitiesData>(osmSource, osmUrl, '2km_radius', error);
  }
}
