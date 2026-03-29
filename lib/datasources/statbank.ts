// Danmarks Statistik StatBank - always available, no API key needed
// POST https://api.statbank.dk/v1/data/{table}/JSONSTAT with JSON body

import {
  DataResult,
  PopulationData,
  IncomeData,
  PropertyPriceData,
  CrimeData,
  MunicipalTaxData,
  EducationData,
} from '../types';
import { successResult, errorResult } from '../fallback';

const BASE_URL = 'https://api.statbank.dk/v1/data';

// ---- JSONSTAT helpers ----

interface JSONStatResponse {
  dataset: {
    value: (number | null)[];
    dimension: Record<
      string,
      {
        label: string;
        category: {
          index: Record<string, number>;
          label: Record<string, string>;
        };
      }
    >;
    id: string[];
    size: number[];
  };
}

async function postJSONStat(
  table: string,
  variables: Array<{ code: string; values: string[] }>
): Promise<JSONStatResponse> {
  const body = { table, format: 'JSONSTAT', variables };
  const response = await fetch(`${BASE_URL}/${table}/JSONSTAT`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`StatBank svarede med HTTP ${response.status} for tabel ${table}`);
  }
  return response.json() as Promise<JSONStatResponse>;
}

/** Returns the flat value array mapped by the last dimension's labels */
function extractValuesByLastDim(
  ds: JSONStatResponse['dataset']
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  const lastDimId = ds.id[ds.id.length - 1];
  const lastDim = ds.dimension[lastDimId];
  const lastSize = ds.size[ds.size.length - 1];
  // Assumes a single slice in all dimensions except the last
  const offset = 0;
  for (const [label, idx] of Object.entries(lastDim.category.index)) {
    result[label] = ds.value[offset + idx] ?? null;
  }
  return result;
}

/** Get the last N years as strings like "2014", "2015", ... up to current */
function lastNYearStrings(n: number): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) =>
    String(currentYear - n + 1 + i)
  );
}

// ---- Population (FOLK1A) ----

export async function fetchPopulation(
  kommuneKode: string
): Promise<DataResult<PopulationData>> {
  const sourceUrl = `https://www.statistikbanken.dk/FOLK1A`;
  try {
    const years = lastNYearStrings(10);
    // FOLK1A variables: OMRÅDE (municipality), Tid (quarter), ALDER (age group), KØN (sex)
    // We fetch total (sex=TOT) across age groups
    const data = await postJSONStat('FOLK1A', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] }, // municipality + national
      { code: 'KØN', values: ['TOT'] },
      { code: 'ALDER', values: ['IALT', '0-14', '15-29', '30-49', '50-64', '65+'] },
      // Use Q1 of each year
      {
        code: 'Tid',
        values: years.map((y) => `${y}Q1`),
      },
    ]);

    const ds = data.dataset;
    const vals = ds.value;

    // Dimensions: OMRÅDE(2) x KØN(1) x ALDER(6) x Tid(10)
    // We need to navigate the index carefully.
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const alderIdx = ds.dimension['ALDER'].category.index;
    const tidIdx = ds.dimension['Tid'].category.index;

    const dimSizes = ds.size; // [2, 1, 6, 10]
    const [dOmr, dKon, dAlder, dTid] = dimSizes;

    const getVal = (omr: number, alder: number, tid: number): number | null => {
      const flatIdx = omr * (dKon * dAlder * dTid) + 0 * (dAlder * dTid) + alder * dTid + tid;
      return vals[flatIdx] ?? null;
    }

    const muniOmrIdx = omrIdx[kommuneKode] ?? 0;
    const natOmrIdx = omrIdx['000'] ?? 1;
    const ialltAlderIdx = alderIdx['IALT'] ?? 0;

    // Total population for most recent year
    const lastTidIdx = tidIdx[`${years[years.length - 1]}Q1`] ?? years.length - 1;
    const total = getVal(muniOmrIdx, ialltAlderIdx, lastTidIdx) ?? 0;
    const nationalTotal = getVal(natOmrIdx, ialltAlderIdx, lastTidIdx) ?? 0;

    // By year
    const byYear: Record<string, number> = {};
    for (const year of years) {
      const tidI = tidIdx[`${year}Q1`] ?? 0;
      byYear[year] = getVal(muniOmrIdx, ialltAlderIdx, tidI) ?? 0;
    }

    // Age groups (latest year)
    const agePct = (ageKey: string): number => {
      const ai = alderIdx[ageKey] ?? 0;
      const v = getVal(muniOmrIdx, ai, lastTidIdx) ?? 0;
      return total > 0 ? Math.round((v / total) * 10000) / 100 : 0;
    }

    const ageGroups = {
      '0-14': agePct('0-14'),
      '15-29': agePct('15-29'),
      '30-49': agePct('30-49'),
      '50-64': agePct('50-64'),
      '65+': agePct('65+'),
    };

    return successResult<PopulationData>(
      'Danmarks Statistik – FOLK1A',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        kommuneNavn: ds.dimension['OMRÅDE'].category.label[kommuneKode] ?? kommuneKode,
        total,
        byYear,
        ageGroups,
        nationalAverage: nationalTotal,
      }
    );
  } catch (err) {
    return errorResult<PopulationData>('Danmarks Statistik – FOLK1A', sourceUrl, 'kommune', err);
  }
}

// ---- Income (INDKP101) ----

export async function fetchIncome(
  kommuneKode: string
): Promise<DataResult<IncomeData>> {
  const sourceUrl = `https://www.statistikbanken.dk/INDKP101`;
  try {
    const years = lastNYearStrings(10);
    const data = await postJSONStat('INDKP101', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      { code: 'ENHED', values: ['107'] }, // median personal income
      { code: 'Tid', values: years },
    ]);

    const ds = data.dataset;
    const vals = ds.value;
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const tidIdx = ds.dimension['Tid'].category.index;
    const dimSizes = ds.size; // [2, 1, N]
    const [dOmr, dEnhed, dTid] = dimSizes;

    const getVal = (omr: number, tid: number): number | null => {
      return vals[omr * (dEnhed * dTid) + 0 * dTid + tid] ?? null;
    }

    const muniOmrIdx = omrIdx[kommuneKode] ?? 0;
    const natOmrIdx = omrIdx['000'] ?? 1;

    const lastYear = years[years.length - 1];
    const lastTidIdx = tidIdx[lastYear] ?? years.length - 1;

    const medianIncome = getVal(muniOmrIdx, lastTidIdx) ?? 0;
    const nationalMedian = getVal(natOmrIdx, lastTidIdx) ?? 0;

    const byYear: Record<string, number> = {};
    for (const year of years) {
      const ti = tidIdx[year] ?? 0;
      byYear[year] = getVal(muniOmrIdx, ti) ?? 0;
    }

    // Average income: fetch ENHED 106
    const dataAvg = await postJSONStat('INDKP101', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      { code: 'ENHED', values: ['106'] }, // average
      { code: 'Tid', values: [lastYear] },
    ]);
    const dsAvg = dataAvg.dataset;
    const avgVals = dsAvg.value;
    const avgOmrIdx = dsAvg.dimension['OMRÅDE'].category.index;
    const avgMuniI = avgOmrIdx[kommuneKode] ?? 0;
    const avgNatI = avgOmrIdx['000'] ?? 1;
    const averageIncome = avgVals[avgMuniI * 1] ?? 0;
    const nationalAverage = avgVals[avgNatI * 1] ?? 0;

    return successResult<IncomeData>(
      'Danmarks Statistik – INDKP101',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        medianIncome: medianIncome ?? 0,
        averageIncome: typeof averageIncome === 'number' ? averageIncome : 0,
        nationalMedian: nationalMedian ?? 0,
        nationalAverage: typeof nationalAverage === 'number' ? nationalAverage : 0,
        byYear,
      }
    );
  } catch (err) {
    return errorResult<IncomeData>('Danmarks Statistik – INDKP101', sourceUrl, 'kommune', err);
  }
}

// ---- Property Prices (EJEN55) ----

export async function fetchPropertyPrices(
  kommuneKode: string
): Promise<DataResult<PropertyPriceData>> {
  const sourceUrl = `https://www.statistikbanken.dk/EJEN55`;
  try {
    const years = lastNYearStrings(10);
    const data = await postJSONStat('EJEN55', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      { code: 'EJENDOMSTYPE', values: ['10'] }, // all residential
      { code: 'ENHED', values: ['KPM2'] }, // price per m2
      { code: 'Tid', values: years },
    ]);

    const ds = data.dataset;
    const vals = ds.value;
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const tidIdx = ds.dimension['Tid'].category.index;
    const dimSizes = ds.size;
    const [dOmr, dEjd, dEnhed, dTid] = dimSizes;

    const getVal = (omr: number, tid: number): number | null => {
      return vals[omr * (dEjd * dEnhed * dTid) + 0 * (dEnhed * dTid) + 0 * dTid + tid] ?? null;
    }

    const muniI = omrIdx[kommuneKode] ?? 0;
    const natI = omrIdx['000'] ?? 1;
    const lastTidI = tidIdx[years[years.length - 1]] ?? years.length - 1;

    const pricePerSqm = getVal(muniI, lastTidI) ?? 0;
    const nationalAverage = getVal(natI, lastTidI) ?? 0;

    const byYear: Record<string, number> = {};
    for (const year of years) {
      const ti = tidIdx[year] ?? 0;
      byYear[year] = getVal(muniI, ti) ?? 0;
    }

    // Trend: compare last 3 years
    const recentYears = years.slice(-3);
    const prices3 = recentYears.map((y) => byYear[y] ?? 0).filter((v) => v > 0);
    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (prices3.length >= 2) {
      const delta = prices3[prices3.length - 1] - prices3[0];
      const pct = prices3[0] > 0 ? delta / prices3[0] : 0;
      if (pct > 0.03) trend = 'rising';
      else if (pct < -0.03) trend = 'falling';
    }

    return successResult<PropertyPriceData>(
      'Danmarks Statistik – EJEN55',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        pricePerSqm: pricePerSqm ?? 0,
        nationalAverage: nationalAverage ?? 0,
        byYear,
        trend,
      }
    );
  } catch (err) {
    return errorResult<PropertyPriceData>('Danmarks Statistik – EJEN55', sourceUrl, 'kommune', err);
  }
}

// ---- Crime (STRAF10) ----

export async function fetchCrime(
  kommuneKode: string
): Promise<DataResult<CrimeData>> {
  const sourceUrl = `https://www.statistikbanken.dk/STRAF10`;
  try {
    const years = lastNYearStrings(10);
    const data = await postJSONStat('STRAF10', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      { code: 'OVERTRÆDELSE', values: ['IALT'] },
      { code: 'Tid', values: years },
    ]);

    const ds = data.dataset;
    const vals = ds.value;
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const tidIdx = ds.dimension['Tid'].category.index;
    const dimSizes = ds.size;
    const [dOmr, dOvt, dTid] = dimSizes;

    const getVal = (omr: number, tid: number): number | null => {
      return vals[omr * (dOvt * dTid) + 0 * dTid + tid] ?? null;
    }

    const muniI = omrIdx[kommuneKode] ?? 0;
    const natI = omrIdx['000'] ?? 1;
    const lastTidI = tidIdx[years[years.length - 1]] ?? years.length - 1;

    const crimePer1000 = getVal(muniI, lastTidI) ?? 0;
    const nationalAverage = getVal(natI, lastTidI) ?? 0;

    const byYear: Record<string, number> = {};
    for (const year of years) {
      const ti = tidIdx[year] ?? 0;
      byYear[year] = getVal(muniI, ti) ?? 0;
    }

    return successResult<CrimeData>(
      'Danmarks Statistik – STRAF10',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        crimePer1000: crimePer1000 ?? 0,
        nationalAverage: nationalAverage ?? 0,
        byYear,
      }
    );
  } catch (err) {
    return errorResult<CrimeData>('Danmarks Statistik – STRAF10', sourceUrl, 'kommune', err);
  }
}

// ---- Tax (PSKAT) ----

export async function fetchTax(
  kommuneKode: string
): Promise<DataResult<MunicipalTaxData>> {
  const sourceUrl = `https://www.statistikbanken.dk/PSKAT`;
  try {
    const currentYear = String(new Date().getFullYear());
    const data = await postJSONStat('PSKAT', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      { code: 'SKAT', values: ['KOMSKAT', 'KIRKESKAT'] },
      { code: 'Tid', values: [currentYear] },
    ]);

    const ds = data.dataset;
    const vals = ds.value;
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const skatIdx = ds.dimension['SKAT'].category.index;
    const dimSizes = ds.size; // [2, 2, 1]
    const [dOmr, dSkat] = dimSizes;

    const getVal = (omr: number, skat: number): number | null => {
      return vals[omr * dSkat + skat] ?? null;
    }

    const muniI = omrIdx[kommuneKode] ?? 0;
    const natI = omrIdx['000'] ?? 1;
    const komI = skatIdx['KOMSKAT'] ?? 0;
    const kirI = skatIdx['KIRKESKAT'] ?? 1;

    const kommuneskat = getVal(muniI, komI) ?? 0;
    const kirkeskat = getVal(muniI, kirI) ?? 0;
    const natKom = getVal(natI, komI) ?? 0;
    const natKir = getVal(natI, kirI) ?? 0;

    return successResult<MunicipalTaxData>(
      'Danmarks Statistik – PSKAT',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        kommuneskat: kommuneskat ?? 0,
        kirkeskat: kirkeskat ?? 0,
        total: ((kommuneskat ?? 0) + (kirkeskat ?? 0)),
        nationalAverage: ((natKom ?? 0) + (natKir ?? 0)),
      }
    );
  } catch (err) {
    return errorResult<MunicipalTaxData>('Danmarks Statistik – PSKAT', sourceUrl, 'kommune', err);
  }
}

// ---- Education (HFUDD11) ----

export async function fetchEducation(
  kommuneKode: string
): Promise<DataResult<EducationData>> {
  const sourceUrl = `https://www.statistikbanken.dk/HFUDD11`;
  try {
    const currentYear = String(new Date().getFullYear() - 1); // usually 1 year lag
    const data = await postJSONStat('HFUDD11', [
      { code: 'OMRÅDE', values: [kommuneKode, '000'] },
      // HFUDD: H10=primary, H20=lower secondary, H30=upper secondary, H35=vocational, H40=short higher, H50=medium, H60=long higher, H99=unknown
      { code: 'HFUDD', values: ['H10', 'H30', 'H40', 'H50', 'H60'] },
      { code: 'Tid', values: [currentYear] },
    ]);

    const ds = data.dataset;
    const vals = ds.value;
    const omrIdx = ds.dimension['OMRÅDE'].category.index;
    const uddIdx = ds.dimension['HFUDD'].category.index;
    const dimSizes = ds.size; // [2, 5, 1]
    const [dOmr, dUdd] = dimSizes;

    const getVal = (omr: number, udd: number): number | null => {
      return vals[omr * dUdd + udd] ?? null;
    }

    const muniI = omrIdx[kommuneKode] ?? 0;
    const natI = omrIdx['000'] ?? 1;

    const h10I = uddIdx['H10'] ?? 0;
    const h30I = uddIdx['H30'] ?? 1;
    const h40I = uddIdx['H40'] ?? 2;
    const h50I = uddIdx['H50'] ?? 3;
    const h60I = uddIdx['H60'] ?? 4;

    const primary = getVal(muniI, h10I) ?? 0;
    const secondary = (getVal(muniI, h30I) ?? 0);
    const shortHigher = getVal(muniI, h40I) ?? 0;
    const mediumHigher = getVal(muniI, h50I) ?? 0;
    const longHigher = getVal(muniI, h60I) ?? 0;
    const totalMuni = primary + secondary + shortHigher + mediumHigher + longHigher;

    const natH40 = getVal(natI, h40I) ?? 0;
    const natH50 = getVal(natI, h50I) ?? 0;
    const natH60 = getVal(natI, h60I) ?? 0;
    const natPrimary = getVal(natI, h10I) ?? 0;
    const natSecondary = getVal(natI, h30I) ?? 0;
    const natTotal = natPrimary + natSecondary + natH40 + natH50 + natH60;

    const pct = (v: number, total: number) =>
      total > 0 ? Math.round((v / total) * 1000) / 10 : 0;

    return successResult<EducationData>(
      'Danmarks Statistik – HFUDD11',
      sourceUrl,
      'kommune',
      {
        kommuneKode,
        primaryPct: pct(primary, totalMuni),
        secondaryPct: pct(secondary, totalMuni),
        higherPct: pct(shortHigher + mediumHigher + longHigher, totalMuni),
        nationalHigherPct: pct(natH40 + natH50 + natH60, natTotal),
      }
    );
  } catch (err) {
    return errorResult<EducationData>(
      'Danmarks Statistik – HFUDD11',
      sourceUrl,
      'kommune',
      err
    );
  }
}
