// GeoFA facilities — playgrounds, sports, swimming pools
// Free WFS — no API key needed

import { DataResult, FacilitiesData, AddressData } from '../types';
import { errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'GeoFA – Geodatastyrelsen';
const SOURCE_URL = 'https://geofa.geodanmark.dk';
const WFS_BASE = 'https://wfs.geofa.geodanmark.dk/wfs_DAF';

interface WFSFeature {
  properties: {
    navn?: string;
    facilitet_type_kode?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: number[];
  };
}

async function fetchWFSFeatures(
  featureType: string,
  lat: number,
  lng: number,
  radiusKm: number,
  signal?: AbortSignal
): Promise<WFSFeature[]> {
  // Build BBOX from center + radius
  const deg = radiusKm / 111; // rough degree approximation
  const bbox = `${lng - deg},${lat - deg},${lng + deg},${lat + deg},EPSG:4326`;

  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: featureType,
    SRSNAME: 'EPSG:4326',
    BBOX: bbox,
    COUNT: '50',
    OUTPUTFORMAT: 'application/json',
  });

  const url = `${WFS_BASE}?${params}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`GeoFA WFS HTTP ${response.status} for ${featureType}`);
  }

  const data = await response.json();
  return data.features || [];
}

function featureToItem(feature: WFSFeature, lat: number, lng: number): { name: string; lat: number; lng: number; distance: number } {
  const coords = feature.geometry?.coordinates;
  let fLat = lat, fLng = lng;

  if (coords && coords.length >= 2) {
    // GeoJSON: [lng, lat]
    fLng = coords[0];
    fLat = coords[1];
  }

  const dLat = (fLat - lat) * 111000;
  const dLng = (fLng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
  const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

  return {
    name: feature.properties?.navn || 'Ukendt',
    lat: fLat,
    lng: fLng,
    distance,
  };
}

export async function fetchGeoFA(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<FacilitiesData>> {
  const [lng, lat] = address.koordinater;

  try {
    const [legepladser, idraetsbaner, svoemmehal] = await Promise.allSettled([
      fetchWFSFeatures('DAF:Legeplads', lat, lng, 2, signal),
      fetchWFSFeatures('DAF:Idraetsbane', lat, lng, 2, signal),
      fetchWFSFeatures('DAF:Svoemmehal', lat, lng, 5, signal),
    ]);

    const legepladserItems = (legepladser.status === 'fulfilled' ? legepladser.value : [])
      .map((f) => featureToItem(f, lat, lng))
      .sort((a, b) => a.distance - b.distance);

    const idraetstypeItems = (idraetsbaner.status === 'fulfilled' ? idraetsbaner.value : [])
      .map((f) => ({
        ...featureToItem(f, lat, lng),
        type: String(f.properties?.facilitet_type_kode || 'Sportsbane'),
      }))
      .sort((a, b) => a.distance - b.distance);

    const svoemmeItems = (svoemmehal.status === 'fulfilled' ? svoemmehal.value : [])
      .map((f) => featureToItem(f, lat, lng))
      .sort((a, b) => a.distance - b.distance);

    return successResult<FacilitiesData>(SOURCE_NAME, SOURCE_URL, '2km_radius', {
      legepladser: legepladserItems,
      idraetsbaner: idraetstypeItems,
      svoemmehal: svoemmeItems,
    });
  } catch (error) {
    return errorResult<FacilitiesData>(SOURCE_NAME, SOURCE_URL, '2km_radius', error);
  }
}
