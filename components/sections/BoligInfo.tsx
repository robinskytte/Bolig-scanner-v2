'use client';

import { AnalysisResult, MunicipalInfo } from '@/lib/types';
import { DataSourceLabel, DataStatusBadge } from '../DataSourceLabel';
import { SkeletonCard } from '../StreamingProgress';

interface BoligInfoProps {
  result: Partial<AnalysisResult>;
  municipalInfo: MunicipalInfo | null;
}

function InfoRow({ label, value, source }: { label: string; value: React.ReactNode; source?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 w-48">{label}</span>
      <span className="text-sm text-ink font-medium text-right flex-1">
        {value}
        {source && <span className="block text-xs text-gray-400 font-normal">{source}</span>}
      </span>
    </div>
  );
}

function NARow({ label, reason }: { label: string; reason?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0 w-48">{label}</span>
      <span className="text-sm text-unavailable italic">
        Ikke tilgængelig{reason ? ` — ${reason}` : ''}
      </span>
    </div>
  );
}

const heatingLabels: Record<string, string> = {
  '1': 'Fjernvarme',
  '2': 'Centralvarme (olie)',
  '3': 'Centralvarme (naturgas)',
  '5': 'Varmepumpe',
  '6': 'Elvarme',
  '7': 'Centralvarme (fast brændsel)',
  '9': 'Ingen varmeinstallation',
};

const roofLabels: Record<string, string> = {
  '1': 'Fladt tag',
  '2': 'Tagpap',
  '3': 'Fibercement/Eternit',
  '4': 'Betontagsten',
  '5': 'Teglsten',
  '6': 'Plasticsterne',
  '10': 'Stråtag',
  '11': 'Grønt tag',
  '12': 'Skifer',
};

const wallLabels: Record<string, string> = {
  '1': 'Mursten',
  '2': 'Letbeton',
  '3': 'Bindingsværk',
  '4': 'Beton',
  '5': 'Træ',
  '6': 'Porebeton',
  '8': 'Plader',
  '10': 'Metal',
};

const zoneLabels = {
  byzone: 'Byzone',
  landzone: 'Landzone',
  sommerhuszone: 'Sommerhuszone',
  ukendt: 'Ukendt',
};

const energyColors: Record<string, string> = {
  A2020: 'bg-green-700 text-white',
  A2015: 'bg-green-600 text-white',
  A2010: 'bg-green-500 text-white',
  B: 'bg-green-400 text-white',
  C: 'bg-yellow-400 text-ink',
  D: 'bg-orange-400 text-white',
  E: 'bg-orange-500 text-white',
  F: 'bg-red-500 text-white',
  G: 'bg-red-700 text-white',
};

export function BoligInfo({ result, municipalInfo }: BoligInfoProps) {
  const building = result.building;
  const energy = result.energy;
  const plandata = result.plandata;
  const owner = result.owner;
  const broadband = result.broadband;
  const prices = result.prices;
  const address = result.address;

  const bbrData = building?.status === 'success' ? building.data : null;
  const energyData = energy?.status === 'success' ? energy.data : null;
  const plandataData = plandata?.status === 'success' ? plandata.data : null;
  const ownerData = owner?.status === 'success' ? owner.data : null;
  const broadbandData = broadband?.status === 'success' ? broadband.data : null;
  const pricesData = prices?.status === 'success' ? prices.data : null;

  // Calculate remaining build area if we have BBR + plandata
  const remainingBuildM2 =
    bbrData?.grundareal && plandataData?.bebyggelsesprocent && bbrData?.samletAreal
      ? Math.max(0, Math.round(bbrData.grundareal * (plandataData.bebyggelsesprocent / 100) - bbrData.samletAreal))
      : null;

  const buildValueEstimate =
    remainingBuildM2 && pricesData?.pricePerSqm
      ? Math.round((remainingBuildM2 * pricesData.pricePerSqm) / 1000) * 1000
      : null;

  const archiveSearchUrl = address && municipalInfo?.archiveSearchUrl
    ? municipalInfo.archiveSearchUrl.replace('{address}', encodeURIComponent(address.tekst))
    : municipalInfo?.archiveUrl || null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <h2 className="text-xl font-serif font-semibold text-ink mb-1">Boligen</h2>
      <p className="text-sm text-gray-500 mb-5">Bygnings- og ejendomsinformation</p>

      {/* Owner section */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ejendomsforhold</h3>
        {ownerData ? (
          <>
            {ownerData.ejer && <InfoRow label="Nuværende ejer" value={ownerData.ejer} source="Tinglysning" />}
            {ownerData.koebesum && (
              <InfoRow
                label="Seneste handelspris"
                value={`${ownerData.koebesum.toLocaleString('da-DK')} kr.`}
                source={ownerData.handelsdato ? `Handlet ${ownerData.handelsdato}` : 'Tinglysning'}
              />
            )}
            {ownerData.tinglystGaeld && (
              <InfoRow label="Tinglyst gæld" value={`${ownerData.tinglystGaeld.toLocaleString('da-DK')} kr.`} source="Tinglysning" />
            )}
          </>
        ) : (
          <>
            <NARow label="Nuværende ejer" reason="kræver MitID Erhverv" />
            <NARow label="Handelspris" reason="kræver MitID Erhverv" />
            <NARow label="Tinglyst gæld" reason="kræver MitID Erhverv" />
          </>
        )}
      </div>

      {/* Building details */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bygning</h3>
        {building?.status === 'loading' && <SkeletonCard lines={4} />}
        {bbrData ? (
          <>
            {bbrData.byggeaar && <InfoRow label="Byggeår" value={bbrData.byggeaar} source="BBR" />}
            {bbrData.boligareal && <InfoRow label="Boligareal" value={`${bbrData.boligareal} m²`} source="BBR" />}
            {bbrData.samletAreal && <InfoRow label="Samlet areal" value={`${bbrData.samletAreal} m²`} source="BBR" />}
            {bbrData.antalEtager && <InfoRow label="Antal etager" value={bbrData.antalEtager} source="BBR" />}
            {bbrData.tagType && <InfoRow label="Tagtype" value={roofLabels[bbrData.tagType] || bbrData.tagType} source="BBR" />}
            {bbrData.ydervaeggeMateriale && <InfoRow label="Ydervægge" value={wallLabels[bbrData.ydervaeggeMateriale] || bbrData.ydervaeggeMateriale} source="BBR" />}
            {bbrData.opvarmningsform && <InfoRow label="Opvarmning" value={heatingLabels[bbrData.opvarmningsform] || bbrData.opvarmningsform} source="BBR" />}
          </>
        ) : (
          <>
            <DataStatusBadge result={building || null} />
            <NARow label="Byggeår, areal, materialer" reason="kræver BBR/Datafordeler" />
          </>
        )}
      </div>

      {/* Energy label */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Energimærke</h3>
        {energyData ? (
          <div className="flex items-center gap-3 py-2">
            <span className={`text-2xl font-bold px-3 py-1 rounded-lg font-mono ${energyColors[energyData.energimaerke] || 'bg-gray-200'}`}>
              {energyData.energimaerke}
            </span>
            <div>
              {energyData.samletEnergiforbrug && (
                <p className="text-sm text-ink">Samlet energiforbrug: {energyData.samletEnergiforbrug} kWh/år</p>
              )}
              {energyData.udloebsdato && (
                <p className="text-xs text-gray-400">Udløber: {energyData.udloebsdato}</p>
              )}
            </div>
            <DataSourceLabel result={energy} showScope={false} />
          </div>
        ) : (
          <NARow label="Energimærke" reason="kræver API-adgang fra Energistyrelsen" />
        )}
      </div>

      {/* Build potential */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Byggemuligheder</h3>
        {plandataData ? (
          <>
            <InfoRow
              label="Zonestatus"
              value={zoneLabels[plandataData.zonestatus]}
              source="Plandata.dk"
            />
            {plandataData.bebyggelsesprocent && (
              <InfoRow
                label="Tilladt bebyggelsesprocent"
                value={`${plandataData.bebyggelsesprocent}%`}
                source={plandataData.lokalplanNummer ? `Lokalplan ${plandataData.lokalplanNummer}` : 'Plandata.dk'}
              />
            )}
            {bbrData?.bebyggelsesprocent && (
              <InfoRow label="Nuværende bebyggelse" value={`${bbrData.bebyggelsesprocent}%`} source="BBR" />
            )}
            {remainingBuildM2 !== null && (
              <InfoRow
                label="Resterende byggeret"
                value={`ca. ${remainingBuildM2} m²`}
                source="Beregnet: (tilladt% × grundareal) − nuværende areal"
              />
            )}
            {buildValueEstimate && (
              <InfoRow
                label="Estimeret byggeværdi"
                value={`ca. ${buildValueEstimate.toLocaleString('da-DK')} kr.`}
                source={`${remainingBuildM2} m² × ${pricesData?.pricePerSqm?.toLocaleString('da-DK')} kr/m² (kommunegennemsnit)`}
              />
            )}
          </>
        ) : (
          <NARow label="Bebyggelsesprocent, lokalplan" reason="hentes fra Plandata.dk" />
        )}
      </div>

      {/* Broadband */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bredbånd</h3>
        {broadbandData ? (
          <>
            <InfoRow label="Maks. download" value={`${broadbandData.maxDownload} Mbps`} source="Tjekditnet" />
            <InfoRow label="Maks. upload" value={`${broadbandData.maxUpload} Mbps`} source="Tjekditnet" />
            {broadbandData.technologies.length > 0 && (
              <InfoRow label="Teknologier" value={broadbandData.technologies.join(', ')} source="Tjekditnet" />
            )}
          </>
        ) : (
          <NARow label="Bredbåndshastighed" reason="kræver API-adgang fra Tjekditnet" />
        )}
      </div>

      {/* Links */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nyttige links</h3>
        {archiveSearchUrl && (
          <a
            href={archiveSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ocean hover:underline"
          >
            📁 Byggesagstegninger og historik ({municipalInfo?.name} kommunes arkiv)
          </a>
        )}
        {plandataData?.lokalplanUrl && (
          <a
            href={plandataData.lokalplanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ocean hover:underline"
          >
            🗺️ Gældende lokalplan{plandataData.lokalplanNummer ? ` (${plandataData.lokalplanNummer})` : ''}
          </a>
        )}
        {plandataData?.plandataUrl && (
          <a
            href={plandataData.plandataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ocean hover:underline"
          >
            🏛️ Se på Plandata.dk
          </a>
        )}
      </div>
    </div>
  );
}
