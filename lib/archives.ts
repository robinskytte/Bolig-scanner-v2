// Municipal archive lookup table
// Returns direct search URL for building documentation

import municipalities from '../data/municipalities.json';
import { MunicipalInfo } from './types';

const municipalMap = new Map<string, MunicipalInfo>(
  (municipalities as MunicipalInfo[]).map((m) => [m.code, m])
);

export function getMunicipalInfo(kommuneKode: string): MunicipalInfo | null {
  // Normalize: ensure 4-digit code
  const code = kommuneKode.padStart(4, '0');
  return municipalMap.get(code) || null;
}

export function getArchiveSearchUrl(kommuneKode: string, address: string): string | null {
  const info = getMunicipalInfo(kommuneKode);
  if (!info || !info.archiveSearchUrl) return null;
  return info.archiveSearchUrl.replace('{address}', encodeURIComponent(address));
}

export function getAllMunicipalities(): MunicipalInfo[] {
  return municipalities as MunicipalInfo[];
}
