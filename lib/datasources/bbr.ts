// BBR building registry via Datafordeler
// Requires MitID Erhverv registration — shows N/A until configured

import { DataResult, BBRData } from '../types';
import { getApiKey } from '../config';
import { unavailableResult, errorResult, successResult } from '../fallback';
import { AddressData } from '../types';

const SOURCE_NAME = 'BBR – Bygnings- og Boligregistret';
const SOURCE_URL = 'https://datafordeler.dk';

export async function fetchBBR(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<BBRData>> {
  const apiKey = await getApiKey('Datafordeler_BBR');

  if (!apiKey) {
    return unavailableResult<BBRData>(
      SOURCE_NAME,
      SOURCE_URL,
      'adresse',
      'kræver MitID Erhverv-certifikat fra Datafordeler'
    );
  }

  try {
    // BBR REST API via Datafordeler
    // Query by access address ID
    const url = `https://services.datafordeler.dk/BBR/BBRPublic/1/rest/bygning?AdresseIdentificerer=${encodeURIComponent(address.id)}&username=${encodeURIComponent(apiKey.split(':')[0])}&password=${encodeURIComponent(apiKey.split(':')[1] || '')}&format=JSON`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();

    if (!raw || (Array.isArray(raw) && raw.length === 0)) {
      return errorResult<BBRData>(SOURCE_NAME, SOURCE_URL, 'adresse', 'Ingen BBR-data fundet for adressen');
    }

    const building = Array.isArray(raw) ? raw[0] : raw;

    return successResult<BBRData>(SOURCE_NAME, SOURCE_URL, 'adresse', {
      bygningId: building.id_lokalId,
      byggeaar: building.byg021BygningensAnvendelse ? undefined : building.byg026Opførelsesår,
      boligareal: building.byg038SamletBoligAreal,
      erhvervsareal: building.byg039SamletErhvervsAreal,
      samletAreal: building.byg041BebyggetAreal,
      antalEtager: building.byg054AntalEtager,
      tagType: building.byg033Tagdækning,
      ydervaeggeMateriale: building.byg032YdervæggensMateriale,
      opvarmningsform: building.byg056Varmeinstallation,
      vandforsyning: building.byg029Vandforsyningsanlæg,
      afloebsforhold: building.byg031Afløbsforhold,
      grundareal: building.byg004Koordinatsystem,
    });
  } catch (error) {
    return errorResult<BBRData>(SOURCE_NAME, SOURCE_URL, 'adresse', error);
  }
}
