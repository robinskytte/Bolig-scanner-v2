// Aggregator — re-exports all data source functions

export { fetchAddressById, searchAddresses, fetchNearbyAddresses, fetchAddressesInBBox } from './dawa';
export { fetchPopulation, fetchIncome, fetchPropertyPrices, fetchCrime, fetchTax, fetchEducation } from './statbank';
export { fetchSmileyData } from './smiley';
export { fetchBBR } from './bbr';
export { fetchEnergyLabel } from './energy';
export { fetchGooglePlaces } from './googleplaces';
export { fetchGeoFA } from './geofa';
export { fetchPlandata } from './plandata';
export { fetchNoise } from './noise';
export { fetchContamination } from './contamination';
export { fetchBroadband } from './broadband';
export { fetchOwner } from './tinglysning';
export { fetchCVR } from './cvr';
export { fetchClimate } from './climate';
export { findNearbyStops, getAllStops } from './gtfs';
