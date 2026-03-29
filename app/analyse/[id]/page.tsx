'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnalysisResult, ProgressEvent, AddressData, MunicipalInfo } from '@/lib/types';
import { StreamingProgress } from '@/components/StreamingProgress';
import { HverdagsScoreDisplay } from '@/components/HverdagsScore';
import { BoligInfo } from '@/components/sections/BoligInfo';
import { FamilieScore } from '@/components/sections/FamilieScore';
import { BoligRisiko } from '@/components/sections/BoligRisiko';
import { NaboScore } from '@/components/sections/NaboScore';
import { KlimaRisiko } from '@/components/sections/KlimaRisiko';
import { OmraadeUdvikling } from '@/components/sections/OmraadeUdvikling';

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => ({ default: m.MapView })),
  { ssr: false, loading: () => <div className="w-full h-full bg-blue-50 rounded-xl" /> }
);

interface AnalysePageProps {
  params: { id: string };
}

export default function AnalysePage({ params }: AnalysePageProps) {
  const addressId = decodeURIComponent(params.id);
  const [result, setResult] = useState<Partial<AnalysisResult>>({});
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [municipalInfo, setMunicipalInfo] = useState<MunicipalInfo | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const handleSSEEvent = useCallback((type: string, data: unknown) => {
    switch (type) {
      case 'address':
        setAddress(data as AddressData);
        setResult(prev => ({ ...prev, address: data as AddressData }));
        break;
      case 'municipal_info':
        setMunicipalInfo(data as MunicipalInfo);
        setResult(prev => ({ ...prev, municipalInfo: data as MunicipalInfo }));
        break;
      case 'demographics':
        setResult(prev => ({ ...prev, demographics: data as AnalysisResult['demographics'] }));
        break;
      case 'income':
        setResult(prev => ({ ...prev, income: data as AnalysisResult['income'] }));
        break;
      case 'prices':
        setResult(prev => ({ ...prev, prices: data as AnalysisResult['prices'] }));
        break;
      case 'crime':
        setResult(prev => ({ ...prev, crime: data as AnalysisResult['crime'] }));
        break;
      case 'tax':
        setResult(prev => ({ ...prev, tax: data as AnalysisResult['tax'] }));
        break;
      case 'education':
        setResult(prev => ({ ...prev, education: data as AnalysisResult['education'] }));
        break;
      case 'building':
        setResult(prev => ({ ...prev, building: data as AnalysisResult['building'] }));
        break;
      case 'energy':
        setResult(prev => ({ ...prev, energy: data as AnalysisResult['energy'] }));
        break;
      case 'amenities':
        setResult(prev => ({ ...prev, amenities: data as AnalysisResult['amenities'] }));
        break;
      case 'facilities':
        setResult(prev => ({ ...prev, facilities: data as AnalysisResult['facilities'] }));
        break;
      case 'food_safety':
        setResult(prev => ({ ...prev, foodSafety: data as AnalysisResult['foodSafety'] }));
        break;
      case 'broadband':
        setResult(prev => ({ ...prev, broadband: data as AnalysisResult['broadband'] }));
        break;
      case 'plandata':
        setResult(prev => ({ ...prev, plandata: data as AnalysisResult['plandata'] }));
        break;
      case 'owner':
        setResult(prev => ({ ...prev, owner: data as AnalysisResult['owner'] }));
        break;
      case 'cvr':
        setResult(prev => ({ ...prev, cvr: data as AnalysisResult['cvr'] }));
        break;
      case 'climate':
        setResult(prev => ({ ...prev, climate: data as AnalysisResult['climate'] }));
        break;
      case 'hverdagsscore':
        setResult(prev => ({ ...prev, hverdagsScore: data as AnalysisResult['hverdagsScore'] }));
        break;
      case 'family_score':
        setResult(prev => ({ ...prev, familyScore: data as AnalysisResult['familyScore'] }));
        break;
      case 'risk_score':
        setResult(prev => ({ ...prev, riskScore: data as AnalysisResult['riskScore'] }));
        break;
      case 'climate_score':
        setResult(prev => ({ ...prev, climateScore: data as AnalysisResult['climateScore'] }));
        break;
      case 'trajectory_score':
        setResult(prev => ({ ...prev, trajectoryScore: data as AnalysisResult['trajectoryScore'] }));
        break;
      case 'progress':
        setProgressEvents(prev => [...prev, data as ProgressEvent]);
        break;
      case 'error':
        setError((data as { message: string }).message);
        break;
      case 'complete':
        setIsComplete(true);
        break;
    }
  }, []);

  useEffect(() => {
    if (!addressId) return;

    const es = new EventSource(`/api/analyse?id=${encodeURIComponent(addressId)}`);
    esRef.current = es;

    const EVENTS = [
      'address', 'municipal_info', 'demographics', 'income', 'prices', 'crime', 'tax', 'education',
      'building', 'energy', 'amenities', 'facilities', 'food_safety', 'broadband', 'plandata',
      'owner', 'cvr', 'climate', 'hverdagsscore', 'family_score', 'risk_score', 'climate_score',
      'trajectory_score', 'progress', 'error', 'complete'
    ];

    for (const event of EVENTS) {
      es.addEventListener(event, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handleSSEEvent(event, data);
        } catch {
          // ignore parse errors
        }
      });
    }

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setIsComplete(true);
      }
    };

    return () => {
      es.close();
    };
  }, [addressId, handleSSEEvent]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-serif font-bold text-ink mb-2">Fejl ved analyse</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="bg-ocean text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Prøv en anden adresse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Navigation */}
      <nav className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-serif font-bold text-ink">BoligScanner</span>
        </Link>
        {address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📍</span>
            <span className="font-medium text-ink truncate max-w-xs">{address.tekst}</span>
          </div>
        )}
        {isComplete && (
          <span className="text-xs text-score-good font-medium bg-green-50 px-3 py-1 rounded-full">
            ✓ Analyse færdig
          </span>
        )}
      </nav>

      {/* Full-width map */}
      <div className="w-full" style={{ height: '40vh', minHeight: 280 }}>
        <MapView
          address={address || undefined}
          height="100%"
          showLayers
          interactive
          zoom={15}
          className="w-full h-full rounded-none"
        />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Address header */}
        {address ? (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink">
              {address.vejnavn} {address.husnr}
              {address.etage && `, ${address.etage}.`}
              {address.doer && ` ${address.doer}`}
            </h1>
            <p className="text-gray-500 mt-1">
              {address.postnr} {address.postnrnavn} · {address.kommuneNavn} Kommune
              {municipalInfo?.kommuneskat && (
                <span className="ml-2 text-xs bg-surface-2 px-2 py-0.5 rounded-full border border-border">
                  Kommuneskat: {municipalInfo.kommuneskat}%
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-48" />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Main analysis sections */}
          <div className="space-y-6">
            {/* HverdagsScore hero */}
            {result.hverdagsScore ? (
              <HverdagsScoreDisplay score={result.hverdagsScore} />
            ) : (
              !isComplete && (
                <div className="bg-white rounded-2xl border border-border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              )
            )}

            {/* 6 analysis sections in 2-column grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              <BoligInfo result={result} municipalInfo={municipalInfo} />
              <FamilieScore result={result} />
              <BoligRisiko result={result} />
              <NaboScore result={result} />
              <KlimaRisiko result={result} />
              <OmraadeUdvikling result={result} />
            </div>
          </div>

          {/* Sidebar: streaming progress */}
          <div className="space-y-4">
            <StreamingProgress events={progressEvents} isComplete={isComplete} />

            {/* Quick stats cards */}
            {result.riskScore && (
              <div className="bg-white rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-ink mb-3">Hurtigoverblik</h3>
                <div className="space-y-2">
                  {result.hverdagsScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">HverdagsScore</span>
                      <span className="font-mono font-bold text-ink">{result.hverdagsScore.total}/100</span>
                    </div>
                  )}
                  {result.familyScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">FamilieScore</span>
                      <span className="font-bold text-ink">{result.familyScore.grade}</span>
                    </div>
                  )}
                  {result.riskScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Boligrisiko</span>
                      <span className={`font-bold ${
                        result.riskScore.level === 'LAV' ? 'text-score-excellent' :
                        result.riskScore.level === 'MODERAT' ? 'text-score-moderate' :
                        'text-score-poor'
                      }`}>{result.riskScore.level}</span>
                    </div>
                  )}
                  {result.climateScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Klimarisiko</span>
                      <span className={`font-bold ${
                        result.climateScore.level === 'LAV' ? 'text-score-excellent' :
                        result.climateScore.level === 'MODERAT' ? 'text-score-moderate' :
                        'text-score-poor'
                      }`}>{result.climateScore.level}</span>
                    </div>
                  )}
                  {result.trajectoryScore && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Områdetendens</span>
                      <span className={`font-bold ${
                        result.trajectoryScore.trend === 'STIGENDE' ? 'text-score-good' :
                        result.trajectoryScore.trend === 'FALDENDE' ? 'text-score-poor' :
                        'text-blue-500'
                      }`}>{result.trajectoryScore.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
