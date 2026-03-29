// Google Sheets API configuration reader
// Reads API keys from a shared Google Sheet at build/runtime

import { ApiConfig } from './types';

let cachedConfig: Map<string, ApiConfig> | null = null;
let cacheTime: number | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function loadConfigFromSheet(): Promise<Map<string, ApiConfig>> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  const config = new Map<string, ApiConfig>();

  if (!sheetId || !serviceAccountKey) {
    console.warn('[config] Google Sheets not configured — all API keys will be unavailable');
    return config;
  }

  try {
    // Dynamic import to avoid bundling googleapis in client code
    const { google } = await import('googleapis');

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch {
      console.error('[config] Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON');
      return config;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'BoligScanner API Config!A2:E100',
    });

    const rows = response.data.values || [];

    for (const row of rows) {
      const [source, apiKey, status, registrationUrl, notes] = row;
      if (source) {
        config.set(source.trim(), {
          apiKey: apiKey && apiKey.trim() !== '' && apiKey.trim() !== '(not needed)' && apiKey.trim() !== '(enter key)' && apiKey.trim() !== '(enter token)' && apiKey.trim() !== '(enter cert)' && apiKey.trim() !== '(enter if needed)'
            ? apiKey.trim()
            : null,
          status: status || '',
          registrationUrl: registrationUrl || '',
          notes: notes || '',
        });
      }
    }

    console.log(`[config] Loaded ${config.size} API configurations from Google Sheet`);
  } catch (error) {
    console.error('[config] Failed to load config from Google Sheet:', error);
  }

  return config;
}

export async function getConfig(): Promise<Map<string, ApiConfig>> {
  const now = Date.now();
  if (cachedConfig && cacheTime && now - cacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  cachedConfig = await loadConfigFromSheet();
  cacheTime = now;
  return cachedConfig;
}

export async function getApiKey(source: string): Promise<string | null> {
  const config = await getConfig();
  return config.get(source)?.apiKey || null;
}

export async function isSourceAvailable(source: string): Promise<boolean> {
  const config = await getConfig();
  const entry = config.get(source);
  return entry?.apiKey !== null && entry?.apiKey !== undefined && entry?.apiKey !== '';
}

// Reset cache (used in tests)
export function resetConfigCache(): void {
  cachedConfig = null;
  cacheTime = null;
}
