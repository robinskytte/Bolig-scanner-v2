// Core TypeScript interfaces for BoligScanner v2

export type DataStatus = 'success' | 'unavailable' | 'error' | 'loading' | 'searching';

export type DataScope =
  | 'adresse'
  | 'matrikel'
  | 'postnummer'
  | '1km_radius'
  | '2km_radius'
  | '10km_radius'
  | 'kommune'
  | 'region'
  | 'landsdækkende';

export interface DataResult<T = unknown> {
  status: DataStatus;
  source: string;
  sourceUrl: string;
  scope: DataScope;
  message?: string;
  data: T | null;
  fetchedAt?: string;
}

export interface ApiConfig {
  apiKey: string | null;
  status: string;
  registrationUrl: string;
  notes: string;
}

// DAWA address data
export interface AddressData {
  id: string;
  tekst: string;
  vejnavn: string;
  husnr: string;
  etage?: string;
  doer?: string;
  postnr: string;
  postnrnavn: string;
  kommuneKode: string;
  kommuneNavn: string;
  regionKode: string;
  regionNavn: string;
  sognKode?: string;
  sognNavn?: string;
  matrikelnr?: string;
  ejerlav?: string;
  koordinater: [number, number]; // [lng, lat]
}

export interface DAWAAutocompleteResult {
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
}

// Demographics (StatBank FOLK1A)
export interface PopulationData {
  kommuneKode: string;
  kommuneNavn: string;
  total: number;
  byYear: Record<string, number>;
  ageGroups: {
    '0-14': number;
    '15-29': number;
    '30-49': number;
    '50-64': number;
    '65+': number;
  };
  nationalAverage?: number;
}

// Income (StatBank INDKP101)
export interface IncomeData {
  kommuneKode: string;
  medianIncome: number;
  averageIncome: number;
  nationalMedian: number;
  nationalAverage: number;
  byYear: Record<string, number>;
}

// Property prices (StatBank EJEN55)
export interface PropertyPriceData {
  kommuneKode: string;
  pricePerSqm: number;
  nationalAverage: number;
  byYear: Record<string, number>;
  trend: 'rising' | 'stable' | 'falling';
}

// Crime (StatBank STRAF10)
export interface CrimeData {
  kommuneKode: string;
  crimePer1000: number;
  nationalAverage: number;
  byYear: Record<string, number>;
}

// Municipal tax (StatBank PSKAT)
export interface MunicipalTaxData {
  kommuneKode: string;
  kommuneskat: number;
  kirkeskat: number;
  total: number;
  nationalAverage: number;
}

// Education (StatBank HFUDD11)
export interface EducationData {
  kommuneKode: string;
  primaryPct: number;
  secondaryPct: number;
  higherPct: number;
  nationalHigherPct: number;
}

// BBR building data
export interface BBRData {
  bygningId?: string;
  byggeaar?: number;
  boligareal?: number;
  erhvervsareal?: number;
  samletAreal?: number;
  antalEtager?: number;
  tagType?: string;
  ydervaeggeMateriale?: string;
  opvarmningsform?: string;
  vandforsyning?: string;
  afloebsforhold?: string;
  koordinater?: [number, number];
  bebyggelsesprocent?: number;
  tilladtBebyggelsesprocent?: number;
  grundareal?: number;
}

// Energy label
export interface EnergyLabelData {
  energimaerke: 'A2020' | 'A2015' | 'A2010' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  udloebsdato?: string;
  beregningstidspunkt?: string;
  samletEnergiforbrug?: number;
  varmtvandsforbrug?: number;
}

// Google Places amenity
export interface PlaceResult {
  placeId: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  ratingCount?: number;
  distance?: number; // meters from address
  walkMinutes?: number;
}

export interface AmenitiesData {
  supermarkets: PlaceResult[];
  schools: PlaceResult[];
  kindergartens: PlaceResult[];
  pharmacies: PlaceResult[];
  doctors: PlaceResult[];
  restaurants: PlaceResult[];
  cafes: PlaceResult[];
  busStations: PlaceResult[];
  trainStations: PlaceResult[];
  parks: PlaceResult[];
  libraries: PlaceResult[];
  source: 'google' | 'osm' | 'mixed';
}

// GeoFA facilities
export interface FacilitiesData {
  legepladser: Array<{ name: string; lat: number; lng: number; distance: number }>;
  idraetsbaner: Array<{ name: string; type: string; lat: number; lng: number; distance: number }>;
  svoemmehal: Array<{ name: string; lat: number; lng: number; distance: number }>;
}

// HverdagsScore
export interface HverdagsScoreCategory {
  name: string;
  nameDA: string;
  icon: string;
  weight: number;
  maxDistance: number; // meters
  nearest?: PlaceResult | null;
  distanceM?: number;
  walkMinutes?: number;
  score: number; // 0-100
}

export interface HverdagsScore {
  total: number; // 0-100
  grade: string;
  description: string;
  categories: HverdagsScoreCategory[];
  sources: string[];
}

// Smiley food safety
export interface SmileyData {
  postnummer: string;
  averageRating: number; // 1-4 (1=best, 4=worst)
  totalCount: number;
  eliteCount: number;
  smileyCounts: {
    smiley1: number; // happy
    smiley2: number;
    smiley3: number;
    smiley4: number; // bad
  };
}

// Broadband
export interface BroadbandData {
  maxDownload: number; // Mbps
  maxUpload: number; // Mbps
  technologies: string[];
  providers: string[];
}

// Plandata
export interface PlandataInfo {
  lokalplanNummer?: string;
  lokalplanNavn?: string;
  lokalplanUrl?: string;
  zonestatus: 'byzone' | 'landzone' | 'sommerhuszone' | 'ukendt';
  bebyggelsesprocent?: number;
  maxEtager?: number;
  kommuneplanUrl: string;
  plandataUrl: string;
}

// Climate risk
export interface ClimateData {
  elevation?: number; // meters above sea level
  coastDistanceKm?: number;
  floodRisk: 'low' | 'moderate' | 'high' | 'unknown';
  stormSurgeRisk: 'low' | 'moderate' | 'high' | 'unknown';
  groundwaterRisk: 'low' | 'moderate' | 'high' | 'unknown';
  droughtRisk: 'low' | 'moderate' | 'high' | 'unknown';
}

// Tinglysning owner data
export interface OwnerData {
  ejer?: string;
  koebesum?: number;
  handelsdato?: string;
  tinglystGaeld?: number;
  pantebreve?: Array<{ beloeb: number; kreditor: string }>;
}

// CVR business data
export interface CVRData {
  activeBusinesses: number;
  newLast12Months: number;
  closedLast12Months: number;
  topSectors: Array<{ name: string; count: number }>;
}

// Municipal info from local data file
export interface MunicipalInfo {
  code: string;
  name: string;
  archiveType: string;
  archiveUrl: string;
  archiveSearchUrl: string;
  plandataUrl: string;
  kommuneskat: number;
  kirkeskat: number;
}

// Score grades
export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type RiskLevel = 'LAV' | 'MODERAT' | 'HØJ';
export type TrendLevel = 'STIGENDE' | 'STABIL' | 'FALDENDE';

export interface FamilyScore {
  grade: ScoreGrade;
  hverdagsScore: number;
  schoolDistance?: number;
  kindergartenDistance?: number;
  cityDistances: Array<{ name: string; distanceKm: number; driveMinutes: number }>;
  playgroundCount: number;
  parkCount: number;
}

export interface RiskScore {
  level: RiskLevel;
  contamination: 'clean' | 'V1' | 'V2' | 'unknown';
  noiseLden?: number; // dB
  radonRisk: 'low' | 'moderate' | 'high';
  floodRisk: 'low' | 'moderate' | 'high' | 'unknown';
  smileyAverage?: number;
}

export interface ClimateScore {
  level: RiskLevel;
  elevation?: number;
  coastDistanceKm?: number;
  floodRisk: string;
  groundwaterRisk: string;
  timeline: string;
}

export interface TrajectoryScore {
  trend: TrendLevel;
  priceTrend: 'rising' | 'stable' | 'falling';
  populationTrend: 'growing' | 'stable' | 'declining';
  incomeTrend: 'rising' | 'stable' | 'falling';
  priceChange5yr?: number; // percentage
  populationChange5yr?: number;
}

// Complete analysis result
export interface AnalysisResult {
  id: string;
  address: AddressData | null;
  municipalInfo: MunicipalInfo | null;
  demographics: DataResult<PopulationData> | null;
  income: DataResult<IncomeData> | null;
  prices: DataResult<PropertyPriceData> | null;
  crime: DataResult<CrimeData> | null;
  tax: DataResult<MunicipalTaxData> | null;
  education: DataResult<EducationData> | null;
  building: DataResult<BBRData> | null;
  energy: DataResult<EnergyLabelData> | null;
  amenities: DataResult<AmenitiesData> | null;
  facilities: DataResult<FacilitiesData> | null;
  foodSafety: DataResult<SmileyData> | null;
  broadband: DataResult<BroadbandData> | null;
  plandata: DataResult<PlandataInfo> | null;
  owner: DataResult<OwnerData> | null;
  cvr: DataResult<CVRData> | null;
  climate: DataResult<ClimateData> | null;
  noise: DataResult<NoiseData> | null;
  contamination: DataResult<ContaminationData> | null;
  hverdagsScore: HverdagsScore | null;
  familyScore: FamilyScore | null;
  riskScore: RiskScore | null;
  climateScore: ClimateScore | null;
  trajectoryScore: TrajectoryScore | null;
  neighborhoodNarrative: string | null;
  status: 'loading' | 'complete' | 'error';
  completedAt?: string;
}

// SSE streaming event types
export type StreamEventType =
  | 'address'
  | 'municipal_info'
  | 'demographics'
  | 'income'
  | 'prices'
  | 'crime'
  | 'tax'
  | 'education'
  | 'building'
  | 'energy'
  | 'broadband'
  | 'amenities'
  | 'food_safety'
  | 'facilities'
  | 'plandata'
  | 'owner'
  | 'cvr'
  | 'climate'
  | 'hverdagsscore'
  | 'family_score'
  | 'risk_score'
  | 'climate_score'
  | 'trajectory_score'
  | 'neighborhood_narrative'
  | 'progress'
  | 'error'
  | 'complete';

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
  timestamp: string;
}

export interface ProgressEvent {
  step: string;
  status: 'loading' | 'done' | 'error' | 'unavailable' | 'searching';
  message: string;
  source?: string;
}

// Noise data (from lib/datasources/noise.ts)
export interface NoiseData {
  roadNoiseLden: number | null;
  railNoiseLden: number | null;
  maxLden: number | null;
  classification: 'quiet' | 'moderate' | 'loud' | 'very_loud' | 'unknown';
}

// Contamination data (from lib/datasources/contamination.ts)
export interface ContaminationData {
  status: 'clean' | 'V1' | 'V2' | 'unknown';
  v1Details?: string;
  v2Details?: string;
}

// GTFS transit stop
export interface GTFSStop {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  type: 'bus' | 'train' | 'metro' | 'ferry';
}
