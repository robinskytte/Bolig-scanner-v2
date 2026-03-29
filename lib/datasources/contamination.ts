// Jordforurening — soil contamination V1/V2 via Miljøportal WMS
// Free WMS — no API key needed

import { DataResult, AddressData, ContaminationData } from '../types';
import { successResult, errorResult } from '../fallback';

const SOURCE_NAME = 'Jordforurening – Miljøstyrelsen';
const SOURCE_URL = 'https://arealinformation.miljoeportal.dk';
const WMS_BASE = 'https://arealinformation.miljoeportal.dk/gis/services/public/MapServer/WMSServer';

async function queryContaminationLayer(
  lat: number,
  lng: number,
  layer: string,
  signal?: AbortSignal
): Promise<boolean> {
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

  try {
    const response = await fetch(`${WMS_BASE}?${params}`, {
      signal,
      headers: { Accept: 'application/json, text/plain' },
    });

    if (!response.ok) return false;

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      const features = data.features || [];
      return features.length > 0;
    } catch {
      // Check if text contains feature indicators
      return text.includes('"type"') && text.includes('"Feature"');
    }
  } catch {
    return false;
  }
}

export async function fetchContamination(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<ContaminationData>> {
  const [lng, lat] = address.koordinater;

  try {
    // V1 = known contamination, V2 = suspected contamination
    const [v2Found, v1Found] = await Promise.all([
      queryContaminationLayer(lat, lng, 'Kortlagte_V2', signal),
      queryContaminationLayer(lat, lng, 'Kortlagte_V1', signal),
    ]);

    let status: ContaminationData['status'] = 'clean';
    if (v2Found) status = 'V2';
    else if (v1Found) status = 'V1';

    return successResult<ContaminationData>(SOURCE_NAME, SOURCE_URL, 'matrikel', {
      status,
      v1Details: v1Found ? 'Adressen er kortlagt på vidensniveau 1 (mistanke om forurening)' : undefined,
      v2Details: v2Found ? 'Adressen er kortlagt på vidensniveau 2 (dokumenteret forurening)' : undefined,
    });
  } catch (error) {
    return errorResult<ContaminationData>(SOURCE_NAME, SOURCE_URL, 'matrikel', error);
  }
}
