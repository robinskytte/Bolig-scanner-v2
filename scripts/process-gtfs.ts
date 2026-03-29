#!/usr/bin/env tsx
/**
 * Downloads and processes Rejseplanen GTFS data into stops.json
 * Run: npm run setup:gtfs
 *
 * The GTFS zip contains stops.txt with stop_id, stop_name, stop_lat, stop_lon
 * We classify stops as bus/train/metro/ferry and write a compact JSON file.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'gtfs', 'stops.json');

// Rejseplanen provides GTFS data - check current URL at rejseplanen.info
// The GTFS static data URL (may require registration)
const GTFS_SOURCES = [
  'https://data-rejseplanen.s3.amazonaws.com/gtfs/current/gtfs.zip',
  'https://raw.githubusercontent.com/public-transport/gtfs-dk/main/stops.json',
];

interface GTFSStop {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  type: 'bus' | 'train' | 'metro' | 'ferry';
}

function classifyStop(stopId: string, stopName: string): GTFSStop['type'] {
  const name = stopName.toLowerCase();
  const id = stopId.toLowerCase();

  if (name.includes('metro') || id.startsWith('m') || name.includes('metrostation')) return 'metro';
  if (name.includes('st.') || name.includes('station') || name.includes('tog') || id.startsWith('r')) return 'train';
  if (name.includes('havn') || name.includes('færge') || name.includes('terminal')) return 'ferry';
  return 'bus';
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let field = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  result.push(field);
  return result;
}

async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function tryJsonSource(url: string): Promise<GTFSStop[]> {
  const buffer = await downloadFile(url);
  const stops = JSON.parse(buffer.toString()) as GTFSStop[];
  return stops;
}

async function main() {
  console.log('🚌 Processing GTFS transit stops...');

  // Try JSON source first
  for (const url of GTFS_SOURCES) {
    if (url.endsWith('.json')) {
      try {
        console.log(`Trying ${url}...`);
        const stops = await tryJsonSource(url);
        fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stops, null, 2));
        console.log(`✅ Wrote ${stops.length} stops to ${OUTPUT_PATH}`);
        return;
      } catch (err) {
        console.warn(`  Failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // Fall back: create an empty file with instructions
  console.log('\n⚠️  Could not download GTFS data automatically.');
  console.log('To add transit data manually:');
  console.log('1. Download GTFS from https://rejseplanen.info/');
  console.log('2. Extract stops.txt from the zip');
  console.log('3. Run this script pointing to the extracted file:');
  console.log('   GTFS_FILE=path/to/stops.txt npx tsx scripts/process-gtfs.ts\n');

  // Check if a local file was provided
  const localFile = process.env.GTFS_FILE;
  if (localFile && fs.existsSync(localFile)) {
    console.log(`Reading from ${localFile}...`);
    const content = fs.readFileSync(localFile, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const headers = parseCSVLine(lines[0]);

    const stopIdIdx = headers.indexOf('stop_id');
    const nameIdx = headers.indexOf('stop_name');
    const latIdx = headers.indexOf('stop_lat');
    const lonIdx = headers.indexOf('stop_lon');

    if (stopIdIdx === -1 || nameIdx === -1 || latIdx === -1 || lonIdx === -1) {
      console.error('❌ Missing required columns in stops.txt');
      process.exit(1);
    }

    const stops: GTFSStop[] = lines.slice(1).map((line) => {
      const fields = parseCSVLine(line);
      const stopId = fields[stopIdIdx];
      const stopName = fields[nameIdx];
      const lat = parseFloat(fields[latIdx]);
      const lng = parseFloat(fields[lonIdx]);

      return {
        stopId,
        stopName,
        lat,
        lng,
        type: classifyStop(stopId, stopName),
      };
    }).filter(s => !isNaN(s.lat) && !isNaN(s.lng) && s.stopName);

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stops, null, 2));
    console.log(`✅ Wrote ${stops.length} stops to ${OUTPUT_PATH}`);
  } else {
    // Write empty array
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, '[]');
    console.log('⚠️  Wrote empty stops.json — transit data not available for HverdagsScore');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
