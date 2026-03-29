import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BoligScanner — Dansk Boligintelligens',
  description: 'Dybdegående analyse af danske adresser. Få overblik over familieegnethed, risici, klimapåvirkning og områdets udvikling.',
  keywords: ['bolig', 'ejendom', 'analyse', 'denmark', 'danskbolig', 'ejendomsvurdering'],
  openGraph: {
    title: 'BoligScanner',
    description: 'Intelligent analyse af danske boligadresser',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body>
        {children}
      </body>
    </html>
  );
}
