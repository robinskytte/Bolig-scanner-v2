'use client';

import Link from 'next/link';

// Pre-computed example addresses for demonstration
// These IDs are real DAWA address IDs
const EXAMPLE_ADDRESSES = [
  {
    id: '0a3f507a-0f62-32b8-e044-0003ba298018',
    label: 'Aarhus villa',
    tekst: 'Vestergade 1, 8000 Aarhus C',
    beskrivelse: 'Suburban parcelhus i Aarhus centrum. Høj HverdagsScore, god skoleafstand.',
    tags: ['Byzone', 'HverdagsScore ~85', 'Lav risiko'],
    emoji: '🏡',
  },
  {
    id: '0a3f507a-6e74-32b8-e044-0003ba298018',
    label: 'København lejlighed',
    tekst: 'Nørrebrogade 1, 2200 København N',
    beskrivelse: 'Urban lejlighed på Nørrebro. Fremragende offentlig transport og byliv.',
    tags: ['Byzone', 'HverdagsScore ~92', 'Moderat støj'],
    emoji: '🏙️',
  },
  {
    id: '0a3f507a-4dd7-32b8-e044-0003ba298018',
    label: 'Kystby Hellerup',
    tekst: 'Strandvejen 100, 2900 Hellerup',
    beskrivelse: 'Eksklusivt kystkvarter nord for København. Klimarisiko relevant.',
    tags: ['Kystby', 'Høj indkomst', 'Klimarisiko'],
    emoji: '🌊',
  },
  {
    id: '0a3f507a-c3a5-32b8-e044-0003ba298018',
    label: 'Forstad Roskilde',
    tekst: 'Algade 1, 4000 Roskilde',
    beskrivelse: 'Familievenlig forstad vest for København. God balance mellem pris og kvalitet.',
    tags: ['Forstad', 'Familieideal', 'Stabil pris'],
    emoji: '🏘️',
  },
  {
    id: '0a3f507a-d801-32b8-e044-0003ba298018',
    label: 'Landsby Jutland',
    tekst: 'Beder Landevej 25, 8330 Beder',
    beskrivelse: 'Rolig landsby syd for Aarhus. Lav kriminalitet, bil nødvendig.',
    tags: ['Landsby', 'Lav kriminalitet', 'Bil nødvendig'],
    emoji: '🌾',
  },
];

export default function EksempelPage() {
  return (
    <div className="min-h-screen bg-surface-1">
      {/* Navigation */}
      <nav className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-serif font-bold text-ink">BoligScanner</span>
          <span className="text-xs bg-ocean text-white px-2 py-0.5 rounded-full">v2</span>
        </Link>
        <Link href="/" className="text-sm text-gray-600 hover:text-ocean">← Søg adresse</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink mb-3">
            Eksempelanalyser
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Se hvordan BoligScanner analyserer fem forskellige adresser — fra urban lejlighed
            til landsby — baseret på rigtige offentlige data.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {EXAMPLE_ADDRESSES.map((example) => (
            <Link
              key={example.id}
              href={`/analyse/${encodeURIComponent(example.id)}`}
              className="group bg-white rounded-2xl border border-border p-5 hover:border-ocean/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{example.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-serif font-semibold text-ink text-lg group-hover:text-ocean transition-colors">
                      {example.label}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{example.tekst}</p>
                  <p className="text-sm text-gray-600 mb-3">{example.beskrivelse}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {example.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-surface-1 text-gray-500 px-2 py-0.5 rounded-full border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm text-ocean opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Se fuld analyse</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-border p-6">
          <h2 className="text-lg font-serif font-semibold text-ink mb-3">Om eksempelanalyserne</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Disse analyser bruger rigtige adresse-IDs fra DAWA og henter live data fra
            Danmarks Statistik, Fødevarestyrelsen, Plandata.dk og andre offentlige datakilder.
            Data der kræver API-nøgler (BBR, Energimærke, Google Places) vises som{' '}
            <span className="text-unavailable italic">Ikke tilgængeligt</span> medmindre du
            har konfigureret dem via Google Sheet.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Klik på en adresse for at se den fulde streamede analyse.
          </p>
        </div>
      </div>
    </div>
  );
}
