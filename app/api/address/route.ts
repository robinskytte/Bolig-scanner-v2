// DAWA address autocomplete proxy
// Prevents CORS issues and allows server-side caching

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');
  const bbox = searchParams.get('bbox');

  // Fetch addresses in a bounding box (for map display)
  if (bbox) {
    const [west, south, east, north] = bbox.split(',').map(Number);
    if (bbox.split(',').length !== 4 || [west, south, east, north].some(isNaN)) {
      return NextResponse.json({ error: 'Ugyldig bbox parameter' }, { status: 400 });
    }
    try {
      const url = `https://api.dataforsyningen.dk/adgangsadresser?bbox=${west},${south},${east},${north}&per_side=100&struktur=mini`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'DAWA fejl' }, { status: response.status });
      }
      const data = await response.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Timeout ved adresseopslag' }, { status: 504 });
    }
  }

  // Full address lookup by ID
  if (id) {
    try {
      const url = `https://api.dataforsyningen.dk/adresser/${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'Adresse ikke fundet' }, { status: 404 });
      }
      const data = await response.json();
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    } catch {
      return NextResponse.json({ error: 'Timeout ved adresseopslag' }, { status: 504 });
    }
  }

  // Autocomplete search
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const url = `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(q.trim())}&per_side=7&fuzzy=`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'DAWA søgning fejlede' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  } catch {
    return NextResponse.json({ error: 'Timeout ved adressesøgning' }, { status: 504 });
  }
}
