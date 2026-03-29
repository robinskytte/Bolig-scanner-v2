// DAWA address lookup - always available, no API key needed
// Autocomplete: GET https://api.dataforsyningen.dk/adresser/autocomplete?q={query}&per_side=7
// Full lookup: GET https://api.dataforsyningen.dk/adresser/{id}
// Nearby addresses: GET https://api.dataforsyningen.dk/adgangsadresser?matrikelnr={nr}&ejerlav={ejerlav}

import { AddressData, DAWAAutocompleteResult } from '../types';

const BASE_URL = 'https://api.dataforsyningen.dk';

interface DAWAAddressResponse {
  id: string;
  vejnavn?: string;
  vejstykke?: { navn: string };
  husnr: string;
  etage?: string;
  dør?: string;
  postnummer?: { nr: string; navn: string };
  adgangsadresse?: {
    id: string;
    vejstykke?: { navn: string };
    husnr: string;
    postnummer?: { nr: string; navn: string };
    kommune?: { kode: string; navn: string };
    region?: { kode: string; navn: string };
    sogn?: { kode: string; navn: string };
    matrikel?: { matrikelnr: string; ejerlav: { navn: string } };
    adgangspunkt?: { koordinater: [number, number] };
  };
  kommune?: { kode: string; navn: string };
  region?: { kode: string; navn: string };
  sogn?: { kode: string; navn: string };
  matrikel?: { matrikelnr: string; ejerlav: { navn: string } };
  adgangspunkt?: { koordinater: [number, number] };
}

function mapDAWAResponse(raw: DAWAAddressResponse): AddressData {
  // Support both adresse and adgangsadresse structures
  const adg = raw.adgangsadresse ?? raw;
  const vejnavn = adg.vejstykke?.navn ?? raw.vejnavn ?? '';
  const postnr = adg.postnummer?.nr ?? '';
  const postnrnavn = adg.postnummer?.navn ?? '';
  const kommuneKode = adg.kommune?.kode ?? '';
  const kommuneNavn = adg.kommune?.navn ?? '';
  const regionKode = adg.region?.kode ?? '';
  const regionNavn = adg.region?.navn ?? '';
  const sognKode = adg.sogn?.kode;
  const sognNavn = adg.sogn?.navn;
  const matrikelnr = adg.matrikel?.matrikelnr;
  const ejerlav = adg.matrikel?.ejerlav?.navn;
  const koordinater: [number, number] = adg.adgangspunkt?.koordinater ?? [0, 0];

  return {
    id: raw.id,
    tekst: `${vejnavn} ${raw.husnr}${raw.etage ? ', ' + raw.etage + '.' : ''}${raw.dør ? ' ' + raw.dør : ''}, ${postnr} ${postnrnavn}`,
    vejnavn,
    husnr: raw.husnr,
    etage: raw.etage,
    doer: raw.dør,
    postnr,
    postnrnavn,
    kommuneKode,
    kommuneNavn,
    regionKode,
    regionNavn,
    sognKode,
    sognNavn,
    matrikelnr,
    ejerlav,
    koordinater,
  };
}

export async function fetchAddressById(
  id: string,
  signal?: AbortSignal
): Promise<AddressData> {
  const url = `${BASE_URL}/adresser/${encodeURIComponent(id)}?struktur=mini`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`DAWA svarede med HTTP ${response.status}`);
  }
  const raw: DAWAAddressResponse = await response.json();
  return mapDAWAResponse(raw);
}

export async function searchAddresses(
  query: string,
  signal?: AbortSignal
): Promise<DAWAAutocompleteResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `${BASE_URL}/adresser/autocomplete?q=${encodeURIComponent(query.trim())}&per_side=7`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`DAWA autocomplete svarede med HTTP ${response.status}`);
  }

  const raw: Array<{
    tekst: string;
    adresse: {
      id: string;
      vejnavn: string;
      husnr: string;
      etage?: string;
      dør?: string;
      postnr: string;
      postnrnavn: string;
    };
  }> = await response.json();

  return raw.map((item) => ({
    tekst: item.tekst,
    adresse: {
      id: item.adresse.id,
      vejnavn: item.adresse.vejnavn,
      husnr: item.adresse.husnr,
      etage: item.adresse.etage,
      dør: item.adresse.dør,
      postnr: item.adresse.postnr,
      postnrnavn: item.adresse.postnrnavn,
    },
  }));
}

export async function fetchNearbyAddresses(
  matrikelnr: string,
  ejerlav: string
): Promise<AddressData[]> {
  const url = `${BASE_URL}/adgangsadresser?matrikelnr=${encodeURIComponent(matrikelnr)}&ejerlav=${encodeURIComponent(ejerlav)}&struktur=mini`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DAWA naboer svarede med HTTP ${response.status}`);
  }
  const raw: DAWAAddressResponse[] = await response.json();
  return raw.map(mapDAWAResponse);
}

export async function fetchAddressesInBBox(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<AddressData[]> {
  const bbox = `${west},${south},${east},${north}`;
  const url = `${BASE_URL}/adgangsadresser?bbox=${bbox}&struktur=mini&per_side=100`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DAWA bbox-søgning svarede med HTTP ${response.status}`);
  }
  const raw: DAWAAddressResponse[] = await response.json();
  return raw.map(mapDAWAResponse);
}
