'use client';

import { DataResult, DataScope } from '@/lib/types';

interface DataSourceLabelProps {
  result: DataResult | null | undefined;
  showScope?: boolean;
  className?: string;
}

const scopeLabels: Record<DataScope, string> = {
  adresse: 'Adresse',
  matrikel: 'Matrikel',
  postnummer: 'Postnummer',
  '1km_radius': '1 km radius',
  '2km_radius': '2 km radius',
  '10km_radius': '10 km radius',
  kommune: 'Kommune',
  region: 'Region',
  'landsdækkende': 'Landsdækkende',
};

export function DataSourceLabel({ result, showScope = true, className = '' }: DataSourceLabelProps) {
  if (!result) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-400 mt-1 ${className}`}>
      <span className="text-gray-300">📊</span>
      <a
        href={result.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ocean hover:underline transition-colors"
      >
        {result.source}
      </a>
      {showScope && (
        <>
          <span className="text-gray-300">·</span>
          <ScopeLabel scope={result.scope} />
        </>
      )}
    </div>
  );
}

export function ScopeLabel({ scope }: { scope: DataScope }) {
  return (
    <span className="inline-flex items-center gap-0.5 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs">
      {scopeLabels[scope] || scope}
    </span>
  );
}

// Status badge for unavailable/error data
export function DataStatusBadge({ result }: { result: DataResult | null | undefined }) {
  if (!result || result.status === 'success') return null;

  if (result.status === 'unavailable') {
    return (
      <div className="flex items-start gap-2 text-sm text-unavailable italic py-2">
        <span className="mt-0.5 flex-shrink-0">ℹ️</span>
        <span>
          {result.message || 'Ikke tilgængelig — kræver API-adgang'}
          {result.sourceUrl && (
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:text-ocean"
            >
              Opret adgang
            </a>
          )}
        </span>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="flex items-start gap-2 text-sm text-error-text bg-error-bg rounded p-2">
        <span className="flex-shrink-0">⚠️</span>
        <span>{result.message || 'Der opstod en fejl'}</span>
      </div>
    );
  }

  return null;
}
