'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AddressSearch } from '@/components/AddressSearch';

// Lazy-load the map to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView').then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center">
      <span className="text-blue-400 text-sm font-sans">Indlæser kort...</span>
    </div>
  ),
});

const DATA_SOURCES = [
  { name: 'DAWA', desc: 'Adresser', url: 'https://dawadocs.dataforsyningen.dk', free: true },
  { name: 'Danmarks Statistik', desc: 'Statistikbank', url: 'https://api.statbank.dk', free: true },
  { name: 'Fødevarestyrelsen', desc: 'Smiley-data', url: 'https://findsmiley.dk', free: true },
  { name: 'Plandata.dk', desc: 'Lokalplaner', url: 'https://plandata.dk', free: true },
  { name: 'Miljøportal', desc: 'Jordforurening', url: 'https://miljoeportal.dk', free: true },
  { name: 'Støjkort', desc: 'Støjkortlægning', url: 'https://miljoegis.mim.dk', free: true },
  { name: 'GeoFA', desc: 'Faciliteter', url: 'https://geofa.geodanmark.dk', free: true },
  { name: 'Google Places', desc: 'Nærliggende steder', url: 'https://cloud.google.com', free: false },
  { name: 'BBR/Datafordeler', desc: 'Bygningsdata', url: 'https://datafordeler.dk', free: false },
  { name: 'Energistyrelsen', desc: 'Energimærke', url: 'https://ens.dk', free: false },
];

export default function HomePage() {
  const [selectedAddress, setSelectedAddress] = useState<{ id: string; tekst: string } | null>(null);

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Navigation */}
      <nav className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-serif font-bold text-ink">BoligScanner</span>
          <span className="text-xs bg-ocean text-white px-2 py-0.5 rounded-full">v2</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/eksempel" className="text-sm text-gray-600 hover:text-ocean transition-colors">
            Se eksempel
          </Link>
        </div>
      </nav>

      {/* Main layout: asymmetric two-column */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-center min-h-[70vh]">

          {/* Left: Hero + Search */}
          <div className="flex flex-col justify-center">
            <div className="mb-3">
              <span className="text-xs font-semibold tracking-widest text-ocean uppercase">
                Dansk boligintelligens
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-ink leading-[1.05] mb-6">
              Hvad{' '}
              <span className="text-ocean italic">ved</span>{' '}
              du egentlig om din næste bolig?
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              Indtast en dansk adresse og få øjeblikkelig analyse af familieegnethed,
              risici, klimapåvirkning og områdets langsigtede udvikling — baseret på
              rigtige data fra offentlige registre.
            </p>

            {/* Search field */}
            <div className="mb-6">
              <AddressSearch
                size="large"
                placeholder="Fx. Vestergade 1, 8000 Aarhus..."
                autoFocus
              />
            </div>

            <p className="text-sm text-gray-400">
              Analysen er gratis og kræver ingen oprettelse.
              Data fra {DATA_SOURCES.filter(s => s.free).length} offentlige datakilder.
            </p>

            {/* Quick example links */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Prøv med en eksempeladresse:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Aarhus villa', id: '0a3f507a-0f62-32b8-e044-0003ba298018', tekst: 'Vestergade 1, 8000 Aarhus C' },
                  { label: 'København lejlighed', id: '0a3f507a-6e74-32b8-e044-0003ba298018', tekst: 'Nørrebrogade 1, 2200 København N' },
                  { label: 'Kystby', id: '0a3f507a-4dd7-32b8-e044-0003ba298018', tekst: 'Strandvejen 100, 2900 Hellerup' },
                ].map(({ label, id }) => (
                  <Link
                    key={id}
                    href={`/analyse/${encodeURIComponent(id)}`}
                    className="text-xs bg-surface-2 hover:bg-ocean-light text-gray-600 hover:text-ocean px-3 py-1.5 rounded-full border border-border transition-colors"
                  >
                    {label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live map preview */}
          <div className="relative">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border border-border"
              style={{ height: '520px' }}
            >
              <MapView
                height="100%"
                interactive
                zoom={13}
                className="w-full h-full"
              />
            </div>

            {/* Floating data preview overlay */}
            <div className="absolute top-4 left-4 right-4 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-border">
                <p className="text-xs text-gray-500 mb-2">Analyserede dimensioner</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Bolig', icon: '🏠' },
                    { label: 'Familie', icon: '👨‍👩‍👧' },
                    { label: 'Risici', icon: '⚠️' },
                    { label: 'Nabolag', icon: '🏘️' },
                    { label: 'Klima', icon: '🌊' },
                    { label: 'Puls', icon: '📈' },
                  ].map(({ label, icon }) => (
                    <span
                      key={label}
                      className="bg-surface-1 text-ink text-xs px-2 py-1 rounded-full border border-border"
                    >
                      {icon} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data sources section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">
            Datakilder
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {DATA_SOURCES.map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-border hover:border-ocean/30 hover:shadow-sm transition-all group"
              >
                <span className="text-xs font-semibold text-ink group-hover:text-ocean transition-colors">
                  {src.name}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">{src.desc}</span>
                {src.free ? (
                  <span className="text-xs text-score-good mt-1">Gratis</span>
                ) : (
                  <span className="text-xs text-score-moderate mt-1">API-nøgle</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
