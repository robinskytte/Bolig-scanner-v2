#!/usr/bin/env tsx
/**
 * Creates the Google Sheet for API configuration
 * Run: npm run setup:sheet
 *
 * Prerequisites:
 * 1. Create a Google Cloud project
 * 2. Enable Google Sheets API
 * 3. Create a service account with Sheets access
 * 4. Download the service account JSON key
 * 5. Set GOOGLE_SERVICE_ACCOUNT_KEY env var with the JSON content
 */

import { google } from 'googleapis';

const SHEET_TITLE = 'BoligScanner API Config';

const HEADERS = ['Data Source', 'API Key/Token', 'Status', 'Registration URL', 'Notes'];

const ROWS = [
  ['DAWA', '(not needed)', '✅ Free, no key', 'https://dawadocs.dataforsyningen.dk', 'Adresselookup. Lukkes juli 2026 — skift til api.dataforsyningen.dk/adresser'],
  ['StatBank', '(not needed)', '✅ Free, no key', 'https://api.statbank.dk', 'Danmarks Statistik — befolkning, indkomst, priser'],
  ['Dataforsyningen', '(enter token)', '⬜ Needs setup', 'https://dataforsyningen.dk/bruger', 'Kortfliser, DHM, ortofoto'],
  ['Datafordeler_BBR', '(enter cert)', '⬜ Needs MitID Erhverv', 'https://datafordeler.dk', 'BBR, Matrikel, Ejendomsvurdering — format: user:password'],
  ['Google_Places', '(enter key)', '⬜ Needs setup', 'https://console.cloud.google.com', '$200/mo gratis kredit. Aktiver Places API'],
  ['Energimærkning', '(enter key)', '⬜ Needs setup', 'https://emoweb.dk', 'EMOData API — gratis registrering via ens.dk'],
  ['Plandata', '(not needed for WMS)', '✅ Free WMS', 'https://plandata.dk', 'Lokalplaner — gratis WMS/WFS'],
  ['Miljøportal_Jord', '(not needed for WMS)', '✅ Free WMS', 'https://miljoeportal.dk', 'Jordforurening V1/V2 — gratis WMS'],
  ['Støjkort', '(not needed for WMS)', '✅ Free WMS', 'https://miljoegis.mim.dk', 'Vejstøj, jernbanestøj — gratis WMS'],
  ['Tjekditnet', '(enter if needed)', '⬜ Check access', 'https://tjekditnet.dk', 'Bredbåndsdata'],
  ['GeoFA', '(not needed for WFS)', '✅ Free WFS', 'https://geofa.geodanmark.dk', 'Legepladser, sportsbaner, svømmebade'],
  ['Smiley', '(not needed)', '✅ Free download', 'https://findsmiley.dk', 'Fødevarekontrol'],
  ['CVR', '(enter if needed)', '⬜ Needs setup', 'https://datacvr.virk.dk', 'Virksomhedsregister — format: user:password'],
  ['Tinglysning', '(enter cert)', '⬜ Needs MitID Erhverv', 'https://datafordeler.dk', 'Ejer, handelspris, pant — format: user:password'],
];

async function main() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
    console.log('\nSuch is configured in .env.local:');
    console.log('GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch {
    console.error('❌ Invalid JSON in GOOGLE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📊 Creating Google Sheet...');

  // Create spreadsheet
  const createResponse = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SHEET_TITLE },
      sheets: [{
        properties: { title: SHEET_TITLE },
      }],
    },
  });

  const spreadsheetId = createResponse.data.spreadsheetId!;
  console.log(`✅ Created sheet: ${spreadsheetId}`);

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TITLE}!A1:E1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });

  // Write data rows
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_TITLE}!A2:E${ROWS.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: ROWS },
  });

  // Format headers (bold)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        repeatCell: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              backgroundColor: { red: 0.93, green: 0.94, blue: 0.97 },
            },
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)',
        },
      }],
    },
  });

  console.log('\n✅ Google Sheet created successfully!');
  console.log(`\n📋 Spreadsheet ID: ${spreadsheetId}`);
  console.log('\nAdd to .env.local:');
  console.log(`GOOGLE_SHEETS_ID=${spreadsheetId}`);
  console.log('\nThen share the sheet with your service account email:');
  console.log(`  ${credentials.client_email}`);
  console.log('\nOpen the sheet to fill in your API keys:');
  console.log(`  https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
