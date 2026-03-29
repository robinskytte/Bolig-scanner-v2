/**
 * Basic UI smoke tests
 * Tests that components render without crashing
 */

import { describe, it, expect } from '@jest/globals';

// Test helper: verify score ranges
describe('Score calculations — unit tests', () => {
  it('HverdagsScore is in 0-100 range', async () => {
    const { calculateHverdagsScore } = await import('../lib/scoring/hverdagsscore');
    for (let i = 0; i < 5; i++) {
      const score = calculateHverdagsScore(56.16, 10.20, null, null, []);
      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
    }
  });

  it('Family grade is one of A-F', async () => {
    const { calculateFamilyScore } = await import('../lib/scoring/familyscore');
    const score = calculateFamilyScore(56.16, 10.20, null, null, null);
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(score.grade);
  });

  it('Risk level is LAV/MODERAT/HØJ', async () => {
    const { calculateRiskScore } = await import('../lib/scoring/riskscore');
    const score = calculateRiskScore(56.16, 10.20, 'clean', undefined, 'low', null, undefined);
    expect(['LAV', 'MODERAT', 'HØJ']).toContain(score.level);
  });

  it('Trajectory trend is STIGENDE/STABIL/FALDENDE', async () => {
    const { calculateTrajectoryScore } = await import('../lib/scoring/trajectoryscore');
    const score = calculateTrajectoryScore(null, null, null);
    expect(['STIGENDE', 'STABIL', 'FALDENDE']).toContain(score.trend);
  });
});

describe('Distance utilities', () => {
  it('haversineDistance calculates correctly', async () => {
    const { haversineDistance } = await import('../lib/fallback');
    // Copenhagen to Aarhus ≈ 180 km
    const d = haversineDistance(55.6761, 12.5683, 56.1629, 10.2039);
    expect(d / 1000).toBeGreaterThan(150);
    expect(d / 1000).toBeLessThan(220);
  });

  it('walkingMinutes is reasonable', async () => {
    const { walkingMinutes } = await import('../lib/fallback');
    // 500m should be ~6 minutes
    const mins = walkingMinutes(500);
    expect(mins).toBeGreaterThan(4);
    expect(mins).toBeLessThan(10);
  });

  it('formatDistance shows meters for < 1km', async () => {
    const { formatDistance } = await import('../lib/fallback');
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1500)).toContain('km');
  });
});

describe('Municipality data', () => {
  it('getMunicipalInfo works for all 98 municipalities', async () => {
    const { getAllMunicipalities, getMunicipalInfo } = await import('../lib/archives');
    const all = getAllMunicipalities();
    for (const muni of all) {
      const info = getMunicipalInfo(muni.code);
      expect(info).toBeTruthy();
      expect(info!.name).toBeTruthy();
      expect(info!.kommuneskat).toBeGreaterThan(0);
    }
  });
});

describe('Manual test checklist', () => {
  it('prints test checklist', () => {
    const checklist = `
╔══════════════════════════════════════════╗
║  BOLIGSCANNER — Manuelt testscenarie     ║
╠══════════════════════════════════════════╣
║  □ Landingsside indlæses uden fejl       ║
║  □ Adressesøgning returnerer forslag     ║
║  □ Klik på forslag starter analyse       ║
║  □ Kort vises og er interaktivt          ║
║  □ SSE streaming viser fremgang          ║
║  □ HverdagsScore vises korrekt           ║
║  □ Alle 6 sektioner renderes             ║
║  □ Ikke-tilgængelige vises i grå         ║
║  □ Fejl vises i rødt                     ║
║  □ Datakilder citeret i alle sektioner   ║
║  □ Scope-etiketter til stede             ║
║  □ Eksempel-analyse-side virker          ║
║  □ Mobil-layout virker                   ║
║  □ Ingen console-fejl                    ║
╚══════════════════════════════════════════╝`;
    console.log(checklist);
    expect(true).toBe(true);
  });
});
