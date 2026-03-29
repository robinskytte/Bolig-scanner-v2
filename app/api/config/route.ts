// Returns the current API configuration status (without exposing actual keys)
// Used by the frontend to show which data sources are available

import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getConfig();

    // Return availability status without exposing actual API keys
    const statusMap: Record<string, { available: boolean; notes: string; registrationUrl: string }> = {};

    for (const [source, apiConfig] of Array.from(config.entries())) {
      statusMap[source] = {
        available: apiConfig.apiKey !== null && apiConfig.apiKey !== '',
        notes: apiConfig.notes,
        registrationUrl: apiConfig.registrationUrl,
      };
    }

    return NextResponse.json({
      sources: statusMap,
      configuredAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Konfigurationsfejl', details: error instanceof Error ? error.message : 'Ukendt fejl' },
      { status: 500 }
    );
  }
}
