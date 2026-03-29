/**
 * Score calculation tests
 */

import { describe, it, expect } from '@jest/globals';
import { calculateHverdagsScore } from '../lib/scoring/hverdagsscore';
import { calculateFamilyScore } from '../lib/scoring/familyscore';
import { calculateRiskScore } from '../lib/scoring/riskscore';
import { calculateClimateScore } from '../lib/scoring/climatescore';
import { calculateTrajectoryScore } from '../lib/scoring/trajectoryscore';
import { AmenitiesData, FacilitiesData, HverdagsScore } from '../lib/types';

const AARHUS_CENTER = { lat: 56.1629, lng: 10.2039 };

// Helper: create a PlaceResult
function place(name: string, lat: number, lng: number) {
  return { placeId: `test-${name}`, name, type: 'test', lat, lng };
}

// Full amenities at 100m distance
const NEARBY_AMENITIES: AmenitiesData = {
  supermarkets: [place('Bilka', AARHUS_CENTER.lat + 0.0009, AARHUS_CENTER.lng)],
  schools: [place('Skole', AARHUS_CENTER.lat - 0.001, AARHUS_CENTER.lng)],
  kindergartens: [place('Børnehave', AARHUS_CENTER.lat, AARHUS_CENTER.lng + 0.001)],
  pharmacies: [place('Apotek', AARHUS_CENTER.lat + 0.001, AARHUS_CENTER.lng)],
  doctors: [place('Læge', AARHUS_CENTER.lat - 0.001, AARHUS_CENTER.lng + 0.001)],
  restaurants: [place('Restaurant', AARHUS_CENTER.lat, AARHUS_CENTER.lng + 0.0009)],
  cafes: [place('Café', AARHUS_CENTER.lat + 0.0008, AARHUS_CENTER.lng)],
  busStations: [place('Busstop', AARHUS_CENTER.lat - 0.0008, AARHUS_CENTER.lng)],
  trainStations: [place('Station', AARHUS_CENTER.lat + 0.002, AARHUS_CENTER.lng)],
  parks: [place('Park', AARHUS_CENTER.lat, AARHUS_CENTER.lng + 0.0008)],
  libraries: [place('Bibliotek', AARHUS_CENTER.lat - 0.001, AARHUS_CENTER.lng + 0.001)],
  source: 'osm',
};

const EMPTY_AMENITIES: AmenitiesData = {
  supermarkets: [],
  schools: [],
  kindergartens: [],
  pharmacies: [],
  doctors: [],
  restaurants: [],
  cafes: [],
  busStations: [],
  trainStations: [],
  parks: [],
  libraries: [],
  source: 'osm',
};

const EMPTY_FACILITIES: FacilitiesData = {
  legepladser: [],
  idraetsbaner: [],
  svoemmehal: [],
};

describe('HverdagsScore', () => {
  it('returns score in 0-100 range', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, NEARBY_AMENITIES, EMPTY_FACILITIES, []);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });

  it('returns high score when all amenities are very close', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, NEARBY_AMENITIES, EMPTY_FACILITIES, []);
    expect(score.total).toBeGreaterThan(70);
  });

  it('returns near-zero score when no amenities available', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, EMPTY_AMENITIES, EMPTY_FACILITIES, []);
    expect(score.total).toBe(0);
  });

  it('returns score with all category fields', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, NEARBY_AMENITIES, EMPTY_FACILITIES, []);
    expect(score.categories).toHaveLength(8);
    for (const cat of score.categories) {
      expect(cat.score).toBeGreaterThanOrEqual(0);
      expect(cat.score).toBeLessThanOrEqual(100);
      expect(cat.weight).toBeGreaterThan(0);
      expect(cat.icon).toBeTruthy();
      expect(cat.nameDA).toBeTruthy();
    }
  });

  it('returns null result when amenities data is null', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, null, null, []);
    expect(score.total).toBe(0);
    expect(score.categories).toHaveLength(8);
  });

  it('weights sum to 1.0', () => {
    const score = calculateHverdagsScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, NEARBY_AMENITIES, EMPTY_FACILITIES, []);
    const weightSum = score.categories.reduce((sum, cat) => sum + cat.weight, 0);
    expect(Math.round(weightSum * 100) / 100).toBe(1.0);
  });
});

describe('FamilyScore', () => {
  it('returns grade A-F', () => {
    const hverdags: HverdagsScore = {
      total: 82,
      grade: 'A',
      description: 'Test',
      categories: [],
      sources: [],
    };
    const family = calculateFamilyScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, hverdags, NEARBY_AMENITIES, EMPTY_FACILITIES);
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(family.grade);
  });

  it('returns 2 nearest cities', () => {
    const family = calculateFamilyScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, null, null, null);
    expect(family.cityDistances).toHaveLength(2);
    expect(family.cityDistances[0].distanceKm).toBeGreaterThan(0);
    expect(family.cityDistances[0].driveMinutes).toBeGreaterThan(0);
  });

  it('Aarhus is nearest to itself in the list', () => {
    const family = calculateFamilyScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, null, null, null);
    expect(family.cityDistances[0].name).toBe('Aarhus');
    expect(family.cityDistances[0].distanceKm).toBeLessThan(5);
  });
});

describe('RiskScore', () => {
  it('returns LAV for clean address with no noise', () => {
    const risk = calculateRiskScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, 'clean', undefined, 'low', null, 50);
    expect(risk.level).toBe('LAV');
  });

  it('returns HØJ for V2 contamination', () => {
    const risk = calculateRiskScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, 'V2', undefined, 'low', null, 50);
    expect(risk.level).toBe('HØJ');
  });

  it('returns HØJ for noise above 65 dB', () => {
    const risk = calculateRiskScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, 'clean', 68, 'low', null, 50);
    expect(risk.level).toBe('HØJ');
  });

  it('returns MODERAT for V1 contamination', () => {
    const risk = calculateRiskScore(AARHUS_CENTER.lat, AARHUS_CENTER.lng, 'V1', undefined, 'low', null, 50);
    expect(risk.level).toBe('MODERAT');
  });

  it('estimates radon risk for Western Jutland', () => {
    // Esbjerg coordinates
    const risk = calculateRiskScore(55.4765, 8.4594, 'clean', undefined, 'low', null, 20);
    expect(risk.radonRisk).toBe('high');
  });
});

describe('ClimateScore', () => {
  it('returns LAV for null data', () => {
    const score = calculateClimateScore(null);
    expect(score.level).toBe('LAV');
  });

  it('returns HØJ for very low elevation near coast', () => {
    const score = calculateClimateScore({
      elevation: 1,
      coastDistanceKm: 2,
      floodRisk: 'high',
      stormSurgeRisk: 'high',
      groundwaterRisk: 'low',
      droughtRisk: 'low',
    });
    expect(score.level).toBe('HØJ');
  });

  it('returns LAV for high elevation far from coast', () => {
    const score = calculateClimateScore({
      elevation: 60,
      coastDistanceKm: 80,
      floodRisk: 'low',
      stormSurgeRisk: 'low',
      groundwaterRisk: 'low',
      droughtRisk: 'low',
    });
    expect(score.level).toBe('LAV');
  });
});

describe('TrajectoryScore', () => {
  const risingPrices = {
    kommuneKode: '0751',
    pricePerSqm: 25000,
    nationalAverage: 20000,
    byYear: { '2015': 15000, '2016': 16000, '2017': 17000, '2018': 18000, '2019': 19000, '2020': 20000, '2021': 22000, '2022': 24000, '2023': 25000, '2024': 25000 },
    trend: 'rising' as const,
  };

  const fallingPop = {
    kommuneKode: '0751',
    kommuneNavn: 'Test',
    total: 90000,
    byYear: { '2015': 100000, '2016': 99000, '2017': 98000, '2018': 97000, '2019': 96000, '2020': 95000, '2021': 93000, '2022': 91000, '2023': 90000, '2024': 90000 },
    ageGroups: { '0-14': 15, '15-29': 20, '30-49': 30, '50-64': 20, '65+': 15 },
  };

  it('calculates trajectory from trend data', () => {
    const traj = calculateTrajectoryScore(risingPrices, fallingPop, null);
    expect(['STIGENDE', 'STABIL', 'FALDENDE']).toContain(traj.trend);
  });

  it('returns price change percentage', () => {
    const traj = calculateTrajectoryScore(risingPrices, null, null);
    expect(traj.priceChange5yr).toBeDefined();
    expect(typeof traj.priceChange5yr).toBe('number');
  });

  it('returns STABIL for null data', () => {
    const traj = calculateTrajectoryScore(null, null, null);
    expect(traj.trend).toBe('STABIL');
  });
});
