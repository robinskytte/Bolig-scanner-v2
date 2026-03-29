// Plandata.dk — zone status and local plans via WMS/WFS
// Free WMS — no API key needed

import { DataResult, PlandataInfo, AddressData } from '../types';
import { errorResult, successResult } from '../fallback';
import { getMunicipalInfo } from '../archives';

const SOURCE_NAME = 'Plandata.dk';
const SOURCE_URL = 'https://plandata.dk';
const WMS_BASE = 'https://geoserver.plandata.dk/geoserver/wms';

interface WMSFeatureInfo {
  features?: Array<{
    properties: Record<string, unknown>;
  }>;
}

async function getWMSFeatureInfo(
  lat: number,
  lng: number,
  layer: string,
  signal?: AbortSignal
): Promise<Record<string, unknown> | null> {
  // Convert lat/lng to a small BBOX around the point
  const delta = 0.0001;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layer,
    QUERY_LAYERS: layer,
    BBOX: bbox,
    WIDTH: '101',
    HEIGHT: '101',
    X: '50',
    Y: '50',
    INFO_FORMAT: 'application/json',
    SRS: 'EPSG:4326',
  });

  const url = `${WMS_BASE}?${params}`;
  const response = await fetch(url, { signal });

  if (!response.ok) return null;

  try {
    const data: WMSFeatureInfo = await response.json();
    const features = data.features;
    if (features && features.length > 0) {
      return features[0].properties;
    }
  } catch {
    // WMS may return non-JSON
  }
  return null;
}

export async function fetchPlandata(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<PlandataInfo>> {
  const [lng, lat] = address.koordinater;
  const municipalInfo = getMunicipalInfo(address.kommuneKode);

  const kommuneplanUrl = municipalInfo?.plandataUrl ||
    `https://plandata.dk/kort?municipality=${address.kommuneKode}`;
  const plandataUrl = `https://plandata.dk/kort?lat=${lat}&lon=${lng}&zoom=15`;

  try {
    const [lokalplan, kommuneplan] = await Promise.allSettled([
      getWMSFeatureInfo(lat, lng, 'pdk:theme_lokalplan', signal),
      getWMSFeatureInfo(lat, lng, 'pdk:theme_kommuneplanramme', signal),
    ]);

    const lp = lokalplan.status === 'fulfilled' ? lokalplan.value : null;
    const kp = kommuneplan.status === 'fulfilled' ? kommuneplan.value : null;

    // Determine zone status
    let zonestatus: PlandataInfo['zonestatus'] = 'ukendt';
    if (kp && kp['zoneStatus']) {
      const z = String(kp['zoneStatus']).toLowerCase();
      if (z.includes('byzone') || z === '1') zonestatus = 'byzone';
      else if (z.includes('landzone') || z === '3') zonestatus = 'landzone';
      else if (z.includes('sommerhus') || z === '2') zonestatus = 'sommerhuszone';
    }

    return successResult<PlandataInfo>(SOURCE_NAME, SOURCE_URL, 'matrikel', {
      lokalplanNummer: lp ? String(lp['planId'] || lp['plannr'] || '') : undefined,
      lokalplanNavn: lp ? String(lp['planNavn'] || lp['plannavn'] || '') : undefined,
      lokalplanUrl: lp ? `https://plandata.dk/plan/${lp['planId'] || ''}` : undefined,
      zonestatus,
      bebyggelsesprocent: kp && kp['bebyggelsespct'] ? Number(kp['bebyggelsespct']) : undefined,
      maxEtager: kp && kp['maxEtager'] ? Number(kp['maxEtager']) : undefined,
      kommuneplanUrl,
      plandataUrl,
    });
  } catch (error) {
    // Return minimal info even on error (we always have the URLs)
    return successResult<PlandataInfo>(SOURCE_NAME, SOURCE_URL, 'matrikel', {
      zonestatus: 'ukendt',
      kommuneplanUrl,
      plandataUrl,
    });
  }
}
