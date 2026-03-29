// Main SSE streaming analysis endpoint
// Streams analysis results progressively as data is fetched

import { NextRequest } from 'next/server';
import { createSSEStream, sseResponse, safeAll } from '@/lib/streaming';
import { getMunicipalInfo } from '@/lib/archives';
import {
  fetchAddressById,
  fetchPopulation, fetchIncome, fetchPropertyPrices, fetchCrime, fetchTax, fetchEducation,
  fetchBBR, fetchEnergyLabel, fetchGooglePlaces, fetchGeoFA,
  fetchPlandata, fetchNoise, fetchContamination, fetchBroadband,
  fetchOwner, fetchCVR, fetchClimate, findNearbyStops
} from '@/lib/datasources';
import { fetchSmileyData } from '@/lib/datasources/smiley';
import { calculateHverdagsScore } from '@/lib/scoring/hverdagsscore';
import { calculateFamilyScore } from '@/lib/scoring/familyscore';
import { calculateRiskScore } from '@/lib/scoring/riskscore';
import { calculateClimateScore } from '@/lib/scoring/climatescore';
import { calculateTrajectoryScore } from '@/lib/scoring/trajectoryscore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const addressId = searchParams.get('id');

  if (!addressId) {
    return new Response(JSON.stringify({ error: 'Manglende adresse-id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { stream, send, close, sendProgress } = createSSEStream();

  // Run the analysis pipeline asynchronously
  (async () => {
    try {
      // === PHASE 1: Address lookup (0-200ms) ===
      sendProgress('address', 'loading', 'Henter adressedata...');

      let address;
      try {
        address = await fetchAddressById(addressId);
        send('address', address);
        sendProgress('address', 'done', `Adresse fundet: ${address.tekst}`, 'DAWA');
      } catch (err) {
        send('error', { message: `Kunne ikke finde adressen: ${err instanceof Error ? err.message : err}` });
        close();
        return;
      }

      // Municipal info (instant from local JSON)
      const municipalInfo = getMunicipalInfo(address.kommuneKode);
      send('municipal_info', municipalInfo);

      // === PHASE 2: StatBank data (200ms-2s) — all parallel ===
      sendProgress('demographics', 'loading', 'Henter befolkningsdata...', 'Danmarks Statistik');
      sendProgress('income', 'loading', 'Henter indkomstdata...', 'Danmarks Statistik');
      sendProgress('prices', 'loading', 'Henter ejendomspriser...', 'Danmarks Statistik');
      sendProgress('crime', 'loading', 'Henter kriminalitetsdata...', 'Danmarks Statistik');
      sendProgress('tax', 'loading', 'Henter skattedata...', 'Danmarks Statistik');
      sendProgress('education', 'loading', 'Henter uddannelsesdata...', 'Danmarks Statistik');

      const statbankResults = await Promise.allSettled([
        fetchPopulation(address.kommuneKode),
        fetchIncome(address.kommuneKode),
        fetchPropertyPrices(address.kommuneKode),
        fetchCrime(address.kommuneKode),
        fetchTax(address.kommuneKode),
        fetchEducation(address.kommuneKode),
      ]);
      const [demographicsR, incomeR, pricesR, crimeR, taxR, educationR] = statbankResults;
      const demographics = demographicsR.status === 'fulfilled' ? demographicsR.value : null;
      const income = incomeR.status === 'fulfilled' ? incomeR.value : null;
      const prices = pricesR.status === 'fulfilled' ? pricesR.value : null;
      const crime = crimeR.status === 'fulfilled' ? crimeR.value : null;
      const tax = taxR.status === 'fulfilled' ? taxR.value : null;
      const education = educationR.status === 'fulfilled' ? educationR.value : null;

      if (demographics) { send('demographics', demographics); sendProgress('demographics', demographics.status === 'success' ? 'done' : 'error', `Befolkningsdata ${demographics.status === 'success' ? 'hentet' : 'fejlede'}`); }
      if (income) { send('income', income); sendProgress('income', income.status === 'success' ? 'done' : 'error', `Indkomstdata ${income.status === 'success' ? 'hentet' : 'fejlede'}`); }
      if (prices) { send('prices', prices); sendProgress('prices', prices.status === 'success' ? 'done' : 'error', `Ejendomspriser ${prices.status === 'success' ? 'hentet' : 'fejlede'}`); }
      if (crime) { send('crime', crime); sendProgress('crime', crime.status === 'success' ? 'done' : 'error', `Kriminalitetsdata ${crime.status === 'success' ? 'hentet' : 'fejlede'}`); }
      if (tax) { send('tax', tax); sendProgress('tax', tax.status === 'success' ? 'done' : 'error', `Skattedata ${tax.status === 'success' ? 'hentet' : 'fejlede'}`); }
      if (education) { send('education', education); sendProgress('education', education.status === 'success' ? 'done' : 'error', `Uddannelsesdata ${education.status === 'success' ? 'hentet' : 'fejlede'}`); }

      // === PHASE 3: Address-specific data (1-4s) — parallel ===
      sendProgress('building', 'loading', 'Henter bygningsdata...', 'BBR/Datafordeler');
      sendProgress('energy', 'loading', 'Henter energimærke...', 'Energistyrelsen');
      sendProgress('amenities', 'loading', 'Henter nærliggende steder...', 'Google Places / OSM');
      sendProgress('facilities', 'loading', 'Henter faciliteter...', 'GeoFA');
      sendProgress('food_safety', 'loading', 'Henter smiley-data...', 'Fødevarestyrelsen');
      sendProgress('plandata', 'loading', 'Henter plandata...', 'Plandata.dk');
      sendProgress('noise', 'loading', 'Henter støjdata...', 'Miljøministeriet');
      sendProgress('contamination', 'loading', 'Henter jordforureningsdata...', 'Miljøstyrelsen');
      sendProgress('broadband', 'loading', 'Henter bredbåndsdata...', 'Tjekditnet');
      sendProgress('owner', 'loading', 'Henter ejerdata...', 'Tinglysning');
      sendProgress('cvr', 'loading', 'Henter erhvervsdata...', 'CVR');
      sendProgress('climate', 'loading', 'Beregner klimarisiko...');

      const [lng, lat] = address.koordinater;
      const gtfsStops = findNearbyStops(lat, lng, 2000);

      const addressResults = await Promise.allSettled([
        fetchBBR(address),
        fetchEnergyLabel(address),
        fetchGooglePlaces(address),
        fetchGeoFA(address),
        fetchSmileyData(address.postnr),
        fetchPlandata(address),
        fetchNoise(address),
        fetchContamination(address),
        fetchBroadband(address),
        fetchOwner(address),
        fetchCVR(address),
        fetchClimate(address),
      ]);
      const [bbrR, energyR, placesR, geoFAR, smileyR, plandataR, noiseR, contaminationR, broadbandR, ownerR, cvrR, climateR] = addressResults;
      const building = bbrR.status === 'fulfilled' ? bbrR.value : null;
      const energy = energyR.status === 'fulfilled' ? energyR.value : null;
      const amenities = placesR.status === 'fulfilled' ? placesR.value : null;
      const facilities = geoFAR.status === 'fulfilled' ? geoFAR.value : null;
      const foodSafety = smileyR.status === 'fulfilled' ? smileyR.value : null;
      const plandata = plandataR.status === 'fulfilled' ? plandataR.value : null;
      const noise = noiseR.status === 'fulfilled' ? noiseR.value : null;
      const contamination = contaminationR.status === 'fulfilled' ? contaminationR.value : null;
      const broadband = broadbandR.status === 'fulfilled' ? broadbandR.value : null;
      const owner = ownerR.status === 'fulfilled' ? ownerR.value : null;
      const cvr = cvrR.status === 'fulfilled' ? cvrR.value : null;
      const climate = climateR.status === 'fulfilled' ? climateR.value : null;

      // Send each result
      type PhaseResult = { status: string } | null;
      const phases: Array<[string, PhaseResult, string]> = [
        ['building', building as PhaseResult, 'Bygningsdata'],
        ['energy', energy as PhaseResult, 'Energimærke'],
        ['amenities', amenities as PhaseResult, 'Nærliggende steder'],
        ['facilities', facilities as PhaseResult, 'Faciliteter'],
        ['food_safety', foodSafety as PhaseResult, 'Smiley-data'],
        ['plandata', plandata as PhaseResult, 'Plandata'],
        ['noise', noise as PhaseResult, 'Støjdata'],
        ['contamination', contamination as PhaseResult, 'Jordforureningsdata'],
        ['broadband', broadband as PhaseResult, 'Bredbåndsdata'],
        ['owner', owner as PhaseResult, 'Ejerdata'],
        ['cvr', cvr as PhaseResult, 'Erhvervsdata'],
        ['climate', climate as PhaseResult, 'Klimarisiko'],
      ];

      for (const [eventType, result, label] of phases) {
        if (result) {
          send(eventType as Parameters<typeof send>[0], result);
          const status = result.status === 'success' ? 'done' : result.status === 'unavailable' ? 'unavailable' : 'error';
          const msg = result.status === 'success'
            ? `${label} hentet`
            : result.status === 'unavailable'
              ? `${label}: ikke tilgængeligt`
              : `${label} fejlede`;
          sendProgress(eventType, status, msg);
        }
      }

      // === PHASE 4: Score calculations (2-5s) ===
      sendProgress('hverdagsscore', 'loading', 'Beregner HverdagsScore...');

      const amenitiesData = amenities?.status === 'success' ? amenities.data : null;
      const facilitiesData = facilities?.status === 'success' ? facilities.data : null;
      const climateData = climate?.status === 'success' ? climate.data : null;

      const hverdagsScore = calculateHverdagsScore(lat, lng, amenitiesData, facilitiesData, gtfsStops);
      send('hverdagsscore', hverdagsScore);
      sendProgress('hverdagsscore', 'done', `HverdagsScore beregnet: ${hverdagsScore.total}/100`);

      const familyScore = calculateFamilyScore(lat, lng, hverdagsScore, amenitiesData, facilitiesData);
      send('family_score', familyScore);
      sendProgress('family_score', 'done', `FamilieScore: ${familyScore.grade}`);

      // Risk score needs contamination + noise data
      const contaminationStatus = contamination?.status === 'success' ? contamination.data?.status ?? 'unknown' : 'unknown';
      const noiseData = noise?.status === 'success' ? noise.data : null;
      const smileyData = foodSafety?.status === 'success' ? foodSafety.data : null;
      const riskScore = calculateRiskScore(
        lat, lng,
        contaminationStatus,
        noiseData?.maxLden ?? undefined,
        climateData?.floodRisk ?? 'unknown',
        smileyData,
        climateData?.coastDistanceKm
      );
      send('risk_score', riskScore);
      sendProgress('risk_score', 'done', `Boligrisiko: ${riskScore.level}`);

      const climateScore = calculateClimateScore(climateData);
      send('climate_score', climateScore);
      sendProgress('climate_score', 'done', `Klimarisiko: ${climateScore.level}`);

      const pricesData = prices?.status === 'success' ? prices.data : null;
      const demographicsData = demographics?.status === 'success' ? demographics.data : null;
      const incomeData = income?.status === 'success' ? income.data : null;
      const trajectoryScore = calculateTrajectoryScore(pricesData, demographicsData, incomeData);
      send('trajectory_score', trajectoryScore);
      sendProgress('trajectory_score', 'done', `Boligpuls: ${trajectoryScore.trend}`);

      // === DONE ===
      send('complete', { timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[analyse] Pipeline error:', err);
      send('error', { message: `Analysefejl: ${err instanceof Error ? err.message : err}` });
    } finally {
      close();
    }
  })();

  return sseResponse(stream);
}
