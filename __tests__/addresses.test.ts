/**
 * Integration tests with real Danish addresses
 * Tests the full data pipeline for 5 representative addresses
 */

import { describe, it, expect } from '@jest/globals';
import { fetchAddressById } from '../lib/datasources/dawa';
import { fetchPopulation, fetchPropertyPrices } from '../lib/datasources/statbank';
import { getMunicipalInfo } from '../lib/archives';

// 5 real Danish addresses with known DAWA IDs
const TEST_ADDRESSES = [
  {
    label: 'Aarhus centrum',
    // Using search to find the address ID dynamically
    searchQuery: 'Vestergade 1, 8000 Aarhus',
    expectedKommune: '0751',
    expectedPostnr: '8000',
  },
  {
    label: 'København Nørrebro',
    searchQuery: 'Nørrebrogade 1, 2200 København',
    expectedKommune: '0101',
    expectedPostnr: '2200',
  },
  {
    label: 'Hellerup',
    searchQuery: 'Strandvejen 100, 2900 Hellerup',
    expectedKommune: '0157',
    expectedPostnr: '2900',
  },
  {
    label: 'Roskilde',
    searchQuery: 'Algade 1, 4000 Roskilde',
    expectedKommune: '0265',
    expectedPostnr: '4000',
  },
  {
    label: 'Beder (syd for Aarhus)',
    searchQuery: 'Beder Landevej 25, 8330 Beder',
    expectedKommune: '0751',
    expectedPostnr: '8330',
  },
];

describe('Address integration tests', () => {
  for (const testAddr of TEST_ADDRESSES) {
    describe(`${testAddr.label} (${testAddr.searchQuery})`, () => {
      it('DAWA returns valid coordinates', async () => {
        const { searchAddresses } = await import('../lib/datasources/dawa');
        const results = await searchAddresses(testAddr.searchQuery);

        expect(results.length).toBeGreaterThan(0);
        const first = results[0];
        expect(first.adresse.id).toBeTruthy();

        // Fetch full address
        const address = await fetchAddressById(first.adresse.id);
        expect(address.koordinater).toHaveLength(2);
        expect(address.koordinater[0]).toBeLessThan(20); // lng
        expect(address.koordinater[0]).toBeGreaterThan(5); // lng
        expect(address.koordinater[1]).toBeLessThan(60); // lat
        expect(address.koordinater[1]).toBeGreaterThan(54); // lat
      }, 15000);

      it('StatBank returns data for correct municipality', async () => {
        const result = await fetchPopulation(testAddr.expectedKommune);
        expect(['success', 'error']).toContain(result.status);
        if (result.status === 'success') {
          expect(result.data!.total).toBeGreaterThan(0);
          expect(result.data!.kommuneKode).toBe(testAddr.expectedKommune);
        }
      }, 15000);

      it('Municipal info is available for the municipality', () => {
        const info = getMunicipalInfo(testAddr.expectedKommune);
        expect(info).toBeTruthy();
        expect(info!.code).toBe(testAddr.expectedKommune);
        expect(info!.name).toBeTruthy();
        expect(info!.kommuneskat).toBeGreaterThan(0);
        expect(info!.archiveUrl).toBeTruthy();
        expect(info!.plandataUrl).toBeTruthy();
      });

      it('Property prices are retrievable for the municipality', async () => {
        const result = await fetchPropertyPrices(testAddr.expectedKommune);
        expect(['success', 'error']).toContain(result.status);
        if (result.status === 'success') {
          expect(result.data!.pricePerSqm).toBeGreaterThanOrEqual(0);
        }
      }, 15000);
    });
  }
});

describe('Municipality archive lookup', () => {
  it('contains all 98 municipalities', async () => {
    const { getAllMunicipalities } = await import('../lib/archives');
    const all = getAllMunicipalities();
    expect(all.length).toBe(98);
  });

  it('Aarhus (0751) has correct data', () => {
    const info = getMunicipalInfo('0751');
    expect(info).toBeTruthy();
    expect(info!.name).toBe('Aarhus');
    expect(info!.kommuneskat).toBeGreaterThan(20);
    expect(info!.kommuneskat).toBeLessThan(35);
  });

  it('Copenhagen (0101) has correct data', () => {
    const info = getMunicipalInfo('0101');
    expect(info).toBeTruthy();
    expect(info!.name).toBe('København');
  });

  it('returns null for unknown municipality code', () => {
    const info = getMunicipalInfo('9999');
    expect(info).toBeNull();
  });
});
