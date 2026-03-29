// CVR — business registrations via datacvr.virk.dk
// Requires API key — N/A until configured

import { DataResult, CVRData, AddressData } from '../types';
import { getApiKey } from '../config';
import { unavailableResult, errorResult, successResult } from '../fallback';

const SOURCE_NAME = 'CVR – Erhvervsstyrelsen';
const SOURCE_URL = 'https://datacvr.virk.dk';

export async function fetchCVR(
  address: AddressData,
  signal?: AbortSignal
): Promise<DataResult<CVRData>> {
  const apiKey = await getApiKey('CVR');

  if (!apiKey) {
    return unavailableResult<CVRData>(
      SOURCE_NAME,
      SOURCE_URL,
      'postnummer',
      'kræver API-adgang fra datacvr.virk.dk'
    );
  }

  try {
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    const fromDate = oneYearAgo.toISOString().split('T')[0];

    const query = {
      query: {
        bool: {
          must: [
            { term: { 'beliggenhedsadresse.postnummer': address.postnr } },
            { term: { 'virksomhedsstatus': 'NORMAL' } },
          ],
        },
      },
      size: 0,
      aggs: {
        total: { value_count: { field: '_id' } },
        sektorer: {
          terms: { field: 'branchekode', size: 5 },
        },
        nye: {
          filter: { range: { 'registreringsdato': { gte: fromDate } } },
        },
        lukkede: {
          filter: {
            bool: {
              must: [
                { term: { 'virksomhedsstatus': 'OPHOERT' } },
                { range: { 'ophørsdato': { gte: fromDate } } },
              ],
            },
          },
        },
      },
    };

    const response = await fetch('https://cvrapi.erpublish.industriens.dk/CVRData/public/cvr-permanent/virksomhed/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}`,
      },
      body: JSON.stringify(query),
      signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw = await response.json();
    const aggs = raw.aggregations;

    return successResult<CVRData>(SOURCE_NAME, SOURCE_URL, 'postnummer', {
      activeBusinesses: aggs?.total?.value ?? 0,
      newLast12Months: aggs?.nye?.doc_count ?? 0,
      closedLast12Months: aggs?.lukkede?.doc_count ?? 0,
      topSectors: (aggs?.sektorer?.buckets ?? []).map((b: { key: string; doc_count: number }) => ({
        name: b.key,
        count: b.doc_count,
      })),
    });
  } catch (error) {
    return errorResult<CVRData>(SOURCE_NAME, SOURCE_URL, 'postnummer', error);
  }
}
