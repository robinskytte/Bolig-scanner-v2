// Støjkort — road and rail noise levels via WMS
// Free WMS — no API key needed

import { DataResult, AddressData, NoiseData } from '../types';
import { successResult, errorResult } from '../fallback';

const SOURCE_NAME = 'Støjkort – Miljøministeriet';
const SOURCE_URL = 'https://miljoegis.mim.dk';
const WMS_BASE = 'https://miljoegis.mim.dk/wms';

// Noise layers and their Lden thresholds (dB)
const NOISE_LAYERS = [
  { layer: 'theme-noise-vej-lden', type: 'vej', label: 'Vejstøj' },
  { layer: 'theme-noise-jernbane-lden', type: 'jernbane', label: 'Jernbanestøj' },
];

// Estimate noise level from WMS GetFeatureInfo
async function queryNoiseLayer(
  lat: number,
  lng: number,
  layer: string,
  signal?: AbortSignal
): Promise<number | null> {
  const delta = 0.0002;
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

    if (!response.ok) return null;

    const text = await response.text();

    // Try to parse JSON
    try {
      const data = JSON.parse(text);
      const features = data.features || [];
      if (features.length > 0) {
        const props = features[0].properties;
        // Noise bands are often encoded as Lden values or class names
        // Common classes: 55-60, 60-65, 65-70, 70+
        const lden = props?.Lden || props?.lden || props?.LDEN || props?.noise_level;
        if (lden) return Number(lden);

        // Try to extract from class name
        const className = props?.GRAY_INDEX || props?.noise_class || '';
        const match = String(className).match(/(\d+)/);
        if (match) return Number(match[1]);
      }
    } catch {
      // Non-JSON response — parse text for noise values
      const match = text.match(/(\d{2,3})\s*(?:dB|Lden)/i);
      if (match) return Number(match[1]);
    }
  } catch {
    // Network error or timeout
  }
  return null;
}

export async function fetchNoise(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<NoiseData>> {
  const [lng, lat] = address.koordinater;

  try {
    const [roadNoise, railNoise] = await Promise.all([
      queryNoiseLayer(lat, lng, NOISE_LAYERS[0].layer, signal),
      queryNoiseLayer(lat, lng, NOISE_LAYERS[1].layer, signal),
    ]);

    const maxLden = roadNoise !== null || railNoise !== null
      ? Math.max(roadNoise ?? 0, railNoise ?? 0) || null
      : null;

    let classification: NoiseData['classification'] = 'unknown';
    if (maxLden !== null) {
      if (maxLden < 55) classification = 'quiet';
      else if (maxLden < 65) classification = 'moderate';
      else if (maxLden < 70) classification = 'loud';
      else classification = 'very_loud';
    }

    return successResult<NoiseData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      roadNoiseLden: roadNoise,
      railNoiseLden: railNoise,
      maxLden,
      classification,
    });
  } catch (error) {
    return errorResult<NoiseData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
