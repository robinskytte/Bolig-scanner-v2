// Tjekditnet broadband data
// Requires API key — shows N/A until configured

import { DataResult, BroadbandData, AddressData } from '../types';
import { getApiKey } from '../config';
import { unavailableResult, errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'Tjekditnet – Energistyrelsen';
const SOURCE_URL = 'https://tjekditnet.dk';

export async function fetchBroadband(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<BroadbandData>> {
  const apiKey = await getApiKey('Tjekditnet');

  if (!apiKey) {
    return unavailableResult<BroadbandData>(
      SOURCE_NAME,
      SOURCE_URL,
      'adresse',
      'kræver API-adgang fra Tjekditnet/Energistyrelsen'
    );
  }

  try {
    const url = `https://api.tjekditnet.dk/api/v1/address/${encodeURIComponent(address.id)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();

    return successResult<BroadbandData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      maxDownload: raw.maxDownload || 0,
      maxUpload: raw.maxUpload || 0,
      technologies: raw.technologies || [],
      providers: raw.providers || [],
    });
  } catch (error) {
    return errorResult<BroadbandData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
