// Energimærkning via EMOData API (Energistyrelsen)
// Requires email registration — shows N/A until configured

import { DataResult, EnergyLabelData, AddressData } from '../types';
import { getApiKey } from '../config';
import { unavailableResult, errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'Energimærkning – Energistyrelsen';
const SOURCE_URL = 'https://emoweb.dk';

export async function fetchEnergyLabel(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<EnergyLabelData>> {
  const apiKey = await getApiKey('Energimærkning');

  if (!apiKey) {
    return unavailableResult<EnergyLabelData>(
      SOURCE_NAME,
      SOURCE_URL,
      'adresse',
      'kræver API-adgang fra Energistyrelsen (ens.dk)'
    );
  }

  try {
    const url = `https://emoweb.dk/EMOData/EMOData.svc/json/GetEnergiMaerkeForVirkeligAdresse?DeviceUserGuid=${encodeURIComponent(apiKey)}&Adresse=${encodeURIComponent(address.vejnavn)}&Husnr=${encodeURIComponent(address.husnr)}&Postnr=${encodeURIComponent(address.postnr)}`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();
    const data = raw?.EnergiMaerkeForVirkeligAdresseResult;

    if (!data || !data.length) {
      return errorResult<EnergyLabelData>(SOURCE_NAME, SOURCE_URL, 'adresse', 'Ingen energimærke fundet');
    }

    const item = data[0];
    const labelMap: Record<string, EnergyLabelData['energimaerke']> = {
      'A2020': 'A2020', 'A2015': 'A2015', 'A2010': 'A2010',
      'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
    };

    return successResult<EnergyLabelData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      energimaerke: labelMap[item.EnergiMaerke] ?? 'G',
      udloebsdato: item.GyldighedTil,
      beregningstidspunkt: item.Dato,
      samletEnergiforbrug: item.EnergiForbrugKwh,
    });
  } catch (error) {
    return errorResult<EnergyLabelData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
