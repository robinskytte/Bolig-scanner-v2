// Fødevarestyrelsen Smiley data - always available
// Download from https://www.findsmiley.dk/Sider/Download.aspx
// XML file with smiley ratings for restaurants, cafes, etc.
// Parse and aggregate by postal code
//
// The XML has elements like:
// <row><Navn1>name</Navn1><Virksomhedstype>type</Virksomhedstype>
//      <Postnr>1234</Postnr><SenesteSmiley>1</SenesteSmiley><EliteBonus>0</EliteBonus></row>
// SenesteSmiley: 1=happy, 2=ok, 3=meh, 4=sad (1 is best)

import { DataResult, SmileyData } from '../types';
import { successResult, errorResult } from '../fallback';

const SMILEY_XML_URL =
  'https://www.findsmiley.dk/Sider/Download.aspx';
const SOURCE_NAME = 'Fødevarestyrelsen – Smiley';

// In-memory cache
let cachedByPostnr: Map<string, SmileyData> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SmileyRow {
  postnr: string;
  senesteSmiley: number;
  eliteBonus: number;
}

function extractTagValue(xml: string, tag: string): string {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const start = xml.indexOf(startTag);
  if (start === -1) return '';
  const end = xml.indexOf(endTag, start);
  if (end === -1) return '';
  return xml.slice(start + startTag.length, end).trim();
}

function parseXML(xmlText: string): SmileyRow[] {
  const rows: SmileyRow[] = [];
  const rowRegex = /<row>([\s\S]*?)<\/row>/g;
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(xmlText)) !== null) {
    const rowContent = match[1];
    const postnr = extractTagValue(rowContent, 'Postnr');
    const smileyStr = extractTagValue(rowContent, 'SenesteSmiley');
    const eliteStr = extractTagValue(rowContent, 'EliteBonus');

    if (!postnr || !smileyStr) continue;

    const smiley = parseInt(smileyStr, 10);
    const elite = parseInt(eliteStr, 10);

    if (isNaN(smiley) || smiley < 1 || smiley > 4) continue;

    rows.push({
      postnr: postnr.padStart(4, '0'),
      senesteSmiley: smiley,
      eliteBonus: isNaN(elite) ? 0 : elite,
    });
  }

  return rows;
}

function aggregateByPostnr(rows: SmileyRow[]): Map<string, SmileyData> {
  const map = new Map<string, SmileyData>();

  for (const row of rows) {
    const existing = map.get(row.postnr);
    if (!existing) {
      map.set(row.postnr, {
        postnummer: row.postnr,
        averageRating: row.senesteSmiley,
        totalCount: 1,
        eliteCount: row.eliteBonus === 1 ? 1 : 0,
        smileyCounts: {
          smiley1: row.senesteSmiley === 1 ? 1 : 0,
          smiley2: row.senesteSmiley === 2 ? 1 : 0,
          smiley3: row.senesteSmiley === 3 ? 1 : 0,
          smiley4: row.senesteSmiley === 4 ? 1 : 0,
        },
      });
    } else {
      existing.totalCount += 1;
      if (row.eliteBonus === 1) existing.eliteCount += 1;
      existing.smileyCounts.smiley1 += row.senesteSmiley === 1 ? 1 : 0;
      existing.smileyCounts.smiley2 += row.senesteSmiley === 2 ? 1 : 0;
      existing.smileyCounts.smiley3 += row.senesteSmiley === 3 ? 1 : 0;
      existing.smileyCounts.smiley4 += row.senesteSmiley === 4 ? 1 : 0;
      // Recalculate average
      const { smiley1, smiley2, smiley3, smiley4 } = existing.smileyCounts;
      existing.averageRating =
        Math.round(
          ((smiley1 * 1 + smiley2 * 2 + smiley3 * 3 + smiley4 * 4) /
            existing.totalCount) *
            100
        ) / 100;
    }
  }

  return map;
}

async function loadSmileyCache(): Promise<Map<string, SmileyData>> {
  const now = Date.now();
  if (cachedByPostnr && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedByPostnr;
  }

  const response = await fetch(SMILEY_XML_URL, {
    headers: { Accept: 'application/xml, text/xml, */*' },
  });

  if (!response.ok) {
    throw new Error(`Smiley-download svarede med HTTP ${response.status}`);
  }

  const xmlText = await response.text();
  const rows = parseXML(xmlText);

  if (rows.length === 0) {
    throw new Error('Ingen smiley-data fundet i XML-filen');
  }

  cachedByPostnr = aggregateByPostnr(rows);
  cacheTimestamp = now;
  return cachedByPostnr;
}

export async function fetchSmileyData(
  postnummer: string
): Promise<DataResult<SmileyData>> {
  const normalizedPostnr = postnummer.padStart(4, '0');
  try {
    const cache = await loadSmileyCache();
    const data = cache.get(normalizedPostnr);

    if (!data) {
      return successResult<SmileyData>(SOURCE_NAME, SMILEY_XML_URL, 'postnummer', {
        postnummer: normalizedPostnr,
        averageRating: 0,
        totalCount: 0,
        eliteCount: 0,
        smileyCounts: { smiley1: 0, smiley2: 0, smiley3: 0, smiley4: 0 },
      });
    }

    return successResult<SmileyData>(SOURCE_NAME, SMILEY_XML_URL, 'postnummer', data);
  } catch (err) {
    return errorResult<SmileyData>(SOURCE_NAME, SMILEY_XML_URL, 'postnummer', err);
  }
}
