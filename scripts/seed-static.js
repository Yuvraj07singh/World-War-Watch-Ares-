// scripts/seed-static.js
// ─────────────────────────────────────────────
//  Seeds public/data/ with placeholder JSON
//  so the frontend renders immediately.
//  Data is replaced on first `npm run update`.
// ─────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const save = (f, d) => fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2));
const now = new Date().toISOString();

console.log('Seeding placeholder data...');

// ── META ──────────────────────────────────────────────────
save('meta.json', {
  topAlert: 'World War Watch initialized — run `npm run update` to fetch live data',
  globalThreatLevel: 'CRITICAL',
  tickerItems: [
    { text: 'World War Watch v2 — Awaiting first data update', hot: true },
    { text: 'Run `npm run update` to populate live data', hot: false },
    { text: '4 active conflicts tracked globally', hot: true },
    { text: 'Powered by 12 RSS feeds + Google Gemini AI', hot: false },
    { text: 'US-Israel vs Iran — Operation Epic Fury', hot: true },
    { text: 'India-Pakistan tensions remain high', hot: false },
    { text: 'Pakistan-Afghanistan border conflict active', hot: true },
    { text: 'Russia-Ukraine war enters Year 4', hot: false }
  ],
  _updatedAt: now
});

// ── CONFLICTS ─────────────────────────────────────────────
save('conflicts.json', {
  iran: {
    id: 'iran',
    name: 'US + Israel vs Iran',
    theater: 'Theater 01 · Middle East',
    operation: 'Operation Epic Fury',
    level: 'crit',
    badge: 'Critical',
    tensionPct: 92,
    stats: [
      { val: 'Ongoing', label: 'Casualties' },
      { val: 'Disrupted', label: 'Hormuz Strait' },
      { val: 'Active', label: 'Duration' }
    ],
    summary: 'US and Israel conducting military operations against Iran. Strait of Hormuz disrupted. Global oil markets affected. Run `npm run update` for live data.',
    lastEvent: 'Awaiting live data — run npm run update',
    lastEventDate: now.substring(0, 10),
    topHeadlines: ['Iran conflict updates loading...', 'Hormuz Strait situation developing', 'Middle East tensions at critical level']
  },
  'india-pakistan': {
    id: 'india-pakistan',
    name: 'India vs Pakistan',
    theater: 'Theater 02 · South Asia',
    operation: 'Post-Operation Sindoor',
    level: 'high',
    badge: 'High',
    tensionPct: 74,
    stats: [
      { val: 'Fragile', label: 'Ceasefire' },
      { val: 'Upcoming', label: 'Anniversary' },
      { val: 'Tense', label: 'Latest' }
    ],
    summary: 'India-Pakistan tensions remain elevated following Operation Sindoor. Ceasefire in place but fragile. Pahalgam attack anniversary approaching. Run `npm run update` for live data.',
    lastEvent: 'Awaiting live data — run npm run update',
    lastEventDate: now.substring(0, 10),
    topHeadlines: ['India-Pakistan ceasefire status monitoring', 'Pahalgam anniversary flashpoint approaching', 'South Asian tensions tracked']
  },
  'pakistan-afghanistan': {
    id: 'pakistan-afghanistan',
    name: 'Pakistan vs Afghanistan',
    theater: 'Theater 03 · Af-Pak Border',
    operation: 'Open War · Feb 2026',
    level: 'high',
    badge: 'High',
    tensionPct: 68,
    stats: [
      { val: 'Active', label: 'Status' },
      { val: 'Multiple', label: 'Provinces Hit' },
      { val: 'None', label: 'Diplomacy' }
    ],
    summary: 'Pakistan conducting military operations in Afghanistan border regions. TTP-related violence ongoing. Media blackout in affected areas. Run `npm run update` for live data.',
    lastEvent: 'Awaiting live data — run npm run update',
    lastEventDate: now.substring(0, 10),
    topHeadlines: ['Pakistan-Afghanistan border operations', 'TTP-related tensions continue', 'Af-Pak conflict updates loading']
  },
  'russia-ukraine': {
    id: 'russia-ukraine',
    name: 'Russia vs Ukraine',
    theater: 'Theater 04 · Eastern Europe',
    operation: 'Year 4 — Active',
    level: 'elev',
    badge: 'Elevated',
    tensionPct: 62,
    stats: [
      { val: 'Year 4', label: 'Duration' },
      { val: 'Active', label: 'Eastern Front' },
      { val: 'Stalled', label: 'Negotiations' }
    ],
    summary: 'Russia-Ukraine conflict continues into Year 4 of full-scale invasion. Eastern front remains active. Ceasefire negotiations stalled. Run `npm run update` for live data.',
    lastEvent: 'Awaiting live data — run npm run update',
    lastEventDate: now.substring(0, 10),
    topHeadlines: ['Russia-Ukraine front line updates', 'Year 4 of full-scale invasion', 'Ceasefire talks status uncertain']
  },
  _updatedAt: now
});

// ── ECONOMIC ──────────────────────────────────────────────
save('economic.json', [
  { label: 'Hormuz Strait', val: 'Disrupted', color: 'r', note: 'Major shipping route affected' },
  { label: 'Red Sea', val: 'Partial', color: 'r', note: 'Houthi disruptions continue' },
  { label: 'Crude Oil', val: '+40%', color: 'r', note: 'Since Feb 28' },
  { label: 'Shipping Cost', val: '+35%', color: 'a', note: 'Cape route rerouting' },
  { label: 'India Tariff (US)', val: '~50%', color: 'a', note: 'Export sectors affected' },
  { label: 'Gold (XAU)', val: 'Rising', color: 'g', note: 'Safe haven demand' },
  { label: 'INR / USD', val: 'Weak', color: 'a', note: 'Capital flight pressure' },
  { label: 'Global GDP', val: '-2.4%', color: 'a', note: 'IMF revised estimate' },
  { label: 'India Oil Import', val: 'Crisis', color: 'r', note: '87% via sea' },
  { label: 'Food Security', val: 'High Risk', color: 'r', note: 'Ukraine + oil impact' }
]);

// ── DAILY BRIEFING ────────────────────────────────────────
save('daily-briefing.json', {
  text: 'World War Watch v2 initialized with placeholder data. Run `npm run update` to fetch live news from 12 RSS feeds and generate AI analysis using Google Gemini.\n\nOnce updated, this briefing will contain a comprehensive daily intelligence summary covering all 4 active conflict theaters: US-Israel vs Iran (Operation Epic Fury), India vs Pakistan (Post-Operation Sindoor), Pakistan vs Afghanistan (border conflict), and Russia vs Ukraine (Year 4).\n\nThe system will automatically refresh every 60 minutes.',
  _updatedAt: now
});

// ── UPCOMING EVENTS ───────────────────────────────────────
save('upcoming-events.json', [
  { date: '22', month: 'APR', title: 'Pahalgam Attack Anniversary — India-Pakistan Flashpoint', desc: 'One year since attack that triggered Operation Sindoor. High provocation risk.', severity: 'r', tag: 'Critical' },
  { date: '28', month: 'APR', title: 'Operation Epic Fury — Day 60', desc: 'US-Israel operations in Iran reach two-month mark. Assessment point.', severity: 'r', tag: 'Critical' },
  { date: '01', month: 'MAY', title: 'OPEC Emergency Meeting', desc: 'Oil producers to discuss Hormuz crisis impact on global supply.', severity: 'a', tag: 'Economic' },
  { date: '09', month: 'MAY', title: 'Russia Victory Day', desc: 'Annual military celebration — potential for escalatory announcements on Ukraine.', severity: 'a', tag: 'Watch' },
  { date: '15', month: 'MAY', title: 'UN Security Council Session', desc: 'Scheduled review of all active conflicts. Veto dynamics expected.', severity: 'b', tag: 'Diplomatic' },
  { date: '01', month: 'JUN', title: 'IMF Emergency Economic Review', desc: 'Impact assessment of 4 simultaneous wars on global economy.', severity: 'a', tag: 'Economic' }
]);

// ── UPDATE LOG ────────────────────────────────────────────
save('update-log.json', {
  lastUpdate: now,
  nextUpdate: new Date(Date.now() + 3600000).toISOString(),
  success: true,
  errors: [],
  articlesProcessed: 0,
  elapsedSeconds: 0,
  note: 'Seeded with placeholder data. Run `npm run update` for live data.'
});

console.log('✓ Seeded 6 JSON files to public/data/');
console.log('  → meta.json, conflicts.json, economic.json');
console.log('  → daily-briefing.json, upcoming-events.json, update-log.json');
console.log('');
console.log('Next steps:');
console.log('  1. Add your GEMINI_API_KEY to .env');
console.log('  2. Run: npm run update (fetches live data)');
console.log('  3. Run: npm start (starts server)');
