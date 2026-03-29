/**
 * Data source tests — verifies each data source returns proper DataResult structure
 * and handles missing API keys gracefully
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';

// Mock config to return no API keys by default
jest.mock('../lib/config', () => ({
  getApiKey: jest.fn().mockResolvedValue(null),
  isSourceAvailable: jest.fn().mockResolvedValue(false),
  getConfig: jest.fn().mockResolvedValue(new Map()),
  resetConfigCache: jest.fn(),
}));

describe('DAWA', () => {
  it('searchAddresses returns results for "Aarhus"', async () => {
    const { searchAddresses } = await import('../lib/datasources/dawa');
    const results = await searchAddresses('Aarhus');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('tekst');
    expect(results[0]).toHaveProperty('adresse.id');
  }, 10000);

  it('fetchAddressById returns coordinates for a valid ID', async () => {
    const { fetchAddressById } = await import('../lib/datasources/dawa');
    // Aarhus Rådhus
    const address = await fetchAddressById('0a3f507a-0f62-32b8-e044-0003ba298018');
    expect(address).toHaveProperty('koordinater');
    expect(Array.isArray(address.koordinater)).toBe(true);
    expect(address.koordinater).toHaveLength(2);
    expect(address.kommuneKode).toBeTruthy();
  }, 10000);
});

describe('StatBank', () => {
  it('fetchPopulation returns data for Aarhus (0751)', async () => {
    const { fetchPopulation } = await import('../lib/datasources/statbank');
    const result = await fetchPopulation('0751');
    expect(result.status).toBe('success');
    expect(result.data).toBeTruthy();
    expect(result.data!.total).toBeGreaterThan(0);
    expect(result.scope).toBe('kommune');
    expect(result.source).toContain('FOLK1A');
  }, 15000);

  it('fetchPropertyPrices returns data with byYear map', async () => {
    const { fetchPropertyPrices } = await import('../lib/datasources/statbank');
    const result = await fetchPropertyPrices('0751');
    expect(result.status).toBe('success');
    expect(result.data).toBeTruthy();
    expect(result.data!.pricePerSqm).toBeGreaterThan(0);
    expect(typeof result.data!.byYear).toBe('object');
  }, 15000);

  it('fetchIncome returns data with nationalMedian', async () => {
    const { fetchIncome } = await import('../lib/datasources/statbank');
    const result = await fetchIncome('0101'); // Copenhagen
    expect(result.status).toBe('success');
    expect(result.data!.nationalMedian).toBeGreaterThan(0);
  }, 15000);
});

describe('Smiley', () => {
  it('fetchSmileyData returns DataResult for postnummer', async () => {
    const { fetchSmileyData } = await import('../lib/datasources/smiley');
    const result = await fetchSmileyData('8000'); // Aarhus C
    // Status can be success or error depending on connectivity
    expect(['success', 'error']).toContain(result.status);
    expect(result.source).toContain('Fødevarestyrelsen');
    expect(result.scope).toBe('postnummer');
  }, 15000);
});

describe('BBR', () => {
  it('returns unavailable when API key is not configured', async () => {
    const { fetchBBR } = await import('../lib/datasources/bbr');
    const mockAddress = {
      id: 'test-id',
      tekst: 'Test 1, 8000 Aarhus C',
      vejnavn: 'Test',
      husnr: '1',
      postnr: '8000',
      postnrnavn: 'Aarhus C',
      kommuneKode: '0751',
      kommuneNavn: 'Aarhus',
      regionKode: '1082',
      regionNavn: 'Midtjylland',
      koordinater: [10.2039, 56.1629] as [number, number],
    };
    const result = await fetchBBR(mockAddress);
    expect(result.status).toBe('unavailable');
    expect(result.data).toBeNull();
    expect(result.message).toBeTruthy();
  });
});

describe('Google Places', () => {
  it('falls back to OSM when no API key is configured', async () => {
    const { fetchGooglePlaces } = await import('../lib/datasources/googleplaces');
    const mockAddress = {
      id: 'test-id',
      tekst: 'Vestergade 1, 8000 Aarhus C',
      vejnavn: 'Vestergade',
      husnr: '1',
      postnr: '8000',
      postnrnavn: 'Aarhus C',
      kommuneKode: '0751',
      kommuneNavn: 'Aarhus',
      regionKode: '1082',
      regionNavn: 'Midtjylland',
      koordinater: [10.2039, 56.1629] as [number, number],
    };
    const result = await fetchGooglePlaces(mockAddress);
    // Should use OSM fallback
    expect(['success', 'error']).toContain(result.status);
    if (result.status === 'success') {
      expect(result.data!.source).toBe('osm');
    }
  }, 20000);
});

describe('DataResult structure', () => {
  it('all results have required fields', async () => {
    const { fetchEducation } = await import('../lib/datasources/statbank');
    const result = await fetchEducation('0751');

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('sourceUrl');
    expect(result).toHaveProperty('scope');
    expect(['success', 'error', 'unavailable']).toContain(result.status);
  }, 10000);
});
