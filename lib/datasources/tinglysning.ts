// Tinglysning — owner, purchase price, mortgage
// Via Datafordeler (requires MitID Erhverv) — N/A until configured

import { DataResult, OwnerData, AddressData } from '../types';
import { getApiKey } from '../config';
import { unavailableResult, errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'Tinglysning – Datafordeler';
const SOURCE_URL = 'https://datafordeler.dk';

export async function fetchOwner(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<OwnerData>> {
  const apiKey = await getApiKey('Tinglysning');

  if (!apiKey) {
    return unavailableResult<OwnerData>(
      SOURCE_NAME,
      SOURCE_URL,
      'adresse',
      'kræver MitID Erhverv-certifikat fra Datafordeler'
    );
  }

  try {
    const [username, password] = apiKey.split(':');
    const url = `https://services.datafordeler.dk/TINGVIS/TingbogVisning/1/rest/tinglysteHandler?AdresseIdentificerer=${encodeURIComponent(address.id)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password || '')}&format=JSON`;

    const response = await fetch(url, { signal });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw = await response.json();

    return successResult<OwnerData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      ejer: raw?.ejer?.[0]?.navn,
      koebesum: raw?.koebesum,
      handelsdato: raw?.handelsdato,
      tinglystGaeld: raw?.gaeld?.total,
    });
  } catch (error) {
    return errorResult<OwnerData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
