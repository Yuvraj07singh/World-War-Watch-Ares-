// server/updater.js
// ─────────────────────────────────────────────
//  Hourly data updater
//  1. Pulls all RSS feeds (free)
//  2. Filters by conflict
//  3. Sends to Gemini (free) to produce structured JSON
//  4. Saves to public/data/*.json
// ─────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const { ask } = require('./ai');
const { fetchAllNews, categorizeNews } = require('./news');
const { dbSave, Cache } = require('./db');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const memCache = {};

const save  = (f, d) => {
  // NEVER-BLANK GUARD: refuse to overwrite good data with empty/null
  if (d === null || d === undefined) return;
  if (Array.isArray(d) && d.length === 0 && exists(f)) return; // don't overwrite with empty array
  if (typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length <= 1 && exists(f)) return; // only _updatedAt = useless
  fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2));
  memCache[f] = { time: Date.now(), data: d }; // Fast RAM cache
  dbSave(f, d).catch(() => {}); // Fire and forget purely for persistence 
};

const load  = (f) => { 
  if (memCache[f] && memCache[f].time > Date.now() - 30000) return memCache[f].data; // Serve from RAM if fresh (<30s)
  try { 
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f))); 
    memCache[f] = { time: Date.now(), data };
    return data;
  } catch { 
    return null; 
  } 
};
const exists = (f) => fs.existsSync(path.join(DATA_DIR, f));

async function restoreFromDB() {
  try {
    const docs = await Cache.find({});
    let restored = 0;
    for (const doc of docs) {
      if (!exists(doc.key)) {
        fs.writeFileSync(path.join(DATA_DIR, doc.key), JSON.stringify(doc.data, null, 2));
        restored++;
      }
    }
    if (restored > 0) console.log(`✓ Restored ${restored} cached files from MongoDB to local disk`);
  } catch (err) {
    console.error('Failed to restore from DB:', err.message);
  }
}

// ── PROMPTS ───────────────────────────────────────────────────────────────────
function makeConflictsPrompt(newsMap) {
  const summarize = (id, articles) => articles.slice(0,15).map((a,i)=>`[${i+1}] ${a.title} (${a.source}, ${a.pubDate.substring(0,10)})\n${a.snippet}`).join('\n\n');

  return `You are a geopolitical intelligence analyst. Based on the latest news articles provided, return a JSON object with EXACTLY this structure (no markdown, raw JSON only):

{
  "iran": {
    "id": "iran",
    "name": "US + Israel vs Iran",
    "theater": "Theater 01 · Middle East",
    "operation": "Operation Epic Fury",
    "level": "crit",
    "badge": "Critical",
    "tensionPct": <number 0-100 based on current news>,
    "stats": [
      {"val": "<latest KIA figure or 'Ongoing'>", "label": "Casualties"},
      {"val": "<Hormuz status: Open/Blocked/Partial>", "label": "Hormuz Strait"},
      {"val": "<Day N since Feb 28 2026 or 'Ongoing'>", "label": "Duration"}
    ],
    "summary": "<2-3 sentence factual summary based on latest news>",
    "lastEvent": "<single most recent event from news>",
    "lastEventDate": "<date of that event>",
    "topHeadlines": ["<headline 1>", "<headline 2>", "<headline 3>"]
  },
  "india-pakistan": {
    "id": "india-pakistan",
    "name": "India vs Pakistan",
    "theater": "Theater 02 · South Asia",
    "operation": "Post-Operation Sindoor",
    "level": "high",
    "badge": "High",
    "tensionPct": <number>,
    "stats": [
      {"val": "<ceasefire status>", "label": "Ceasefire"},
      {"val": "<days to Apr 22 or N/A>", "label": "Days to Anniversary"},
      {"val": "<latest development>", "label": "Latest"}
    ],
    "summary": "<2-3 sentence factual summary>",
    "lastEvent": "<most recent event>",
    "lastEventDate": "<date>",
    "topHeadlines": ["<headline 1>", "<headline 2>", "<headline 3>"]
  },
  "pakistan-afghanistan": {
    "id": "pakistan-afghanistan",
    "name": "Pakistan vs Afghanistan",
    "theater": "Theater 03 · Af-Pak Border",
    "operation": "Open War · Feb 2026",
    "level": "high",
    "badge": "High",
    "tensionPct": <number>,
    "stats": [
      {"val": "<war status>", "label": "Status"},
      {"val": "<provinces under attack or 0>", "label": "Provinces Hit"},
      {"val": "<mediation status>", "label": "Diplomacy"}
    ],
    "summary": "<2-3 sentence factual summary>",
    "lastEvent": "<most recent event>",
    "lastEventDate": "<date>",
    "topHeadlines": ["<headline 1>", "<headline 2>", "<headline 3>"]
  },
  "russia-ukraine": {
    "id": "russia-ukraine",
    "name": "Russia vs Ukraine",
    "theater": "Theater 04 · Eastern Europe",
    "operation": "Year 4 — Active",
    "level": "elev",
    "badge": "Elevated",
    "tensionPct": <number>,
    "stats": [
      {"val": "Year 4", "label": "Duration"},
      {"val": "<front line status>", "label": "Eastern Front"},
      {"val": "<ceasefire talks status>", "label": "Negotiations"}
    ],
    "summary": "<2-3 sentence factual summary>",
    "lastEvent": "<most recent event>",
    "lastEventDate": "<date>",
    "topHeadlines": ["<headline 1>", "<headline 2>", "<headline 3>"]
  }
}

LATEST NEWS BY CONFLICT:

=== US-ISRAEL vs IRAN ===
${summarize('iran', newsMap.iran || [])}

=== INDIA vs PAKISTAN ===
${summarize('india-pakistan', newsMap['india-pakistan'] || [])}

=== PAKISTAN vs AFGHANISTAN ===
${summarize('pakistan-afghanistan', newsMap['pakistan-afghanistan'] || [])}

=== RUSSIA vs UKRAINE ===
${summarize('russia-ukraine', newsMap['russia-ukraine'] || [])}

Return ONLY the JSON object. No explanation. No markdown.`;
}

function makeMetaPrompt(articles) {
  const top = articles.slice(0,15).map(a=>`- ${a.title} (${a.source}) [link: ${a.link}]`).join('\n');
  return `Based on these latest world news headlines, generate a JSON object (raw JSON, no markdown):

{
  "topAlert": "<single most critical breaking news sentence about active wars — under 120 chars>",
  "globalThreatLevel": "CRITICAL",
  "tickerItems": [
    {"text": "<short headline 1 — under 60 chars>", "hot": true, "link": "<actual URL from the article>"},
    {"text": "<short headline 2>", "hot": false, "link": "<actual URL>"},
    {"text": "<short headline 3>", "hot": true, "link": "<actual URL>"},
    {"text": "<short headline 4>", "hot": false, "link": "<actual URL>"},
    {"text": "<short headline 5>", "hot": true, "link": "<actual URL>"},
    {"text": "<short headline 6>", "hot": false, "link": "<actual URL>"},
    {"text": "<short headline 7>", "hot": true, "link": "<actual URL>"},
    {"text": "<short headline 8>", "hot": false, "link": "<actual URL>"}
  ]
}

hot:true = urgent/breaking. hot:false = regular update. Keep each text under 60 chars. Use the EXACT link URL from the articles provided. Do not invent links.

HEADLINES:
${top}

Return ONLY JSON.`;
}

function makeEcoPrompt(articles) {
  const top = articles.slice(0,8).map(a=>`- ${a.title}`).join('\n');
  return `Based on these news headlines about global economy, oil, trade wars, produce a JSON array (raw JSON only):

[
  {"label": "Hormuz Strait", "val": "<Open|Blocked|Partial>", "color": "r", "note": "<one line>"},
  {"label": "Red Sea", "val": "<status>", "color": "r", "note": "<one line>"},
  {"label": "Crude Oil", "val": "<+X% or price>", "color": "r", "note": "<context>"},
  {"label": "Shipping Cost", "val": "<+X%>", "color": "a", "note": "<context>"},
  {"label": "India Tariff (US)", "val": "~50%", "color": "a", "note": "Export sectors hit"},
  {"label": "Gold (XAU)", "val": "<status>", "color": "g", "note": "<context>"},
  {"label": "INR / USD", "val": "<status>", "color": "a", "note": "<trend>"},
  {"label": "Global GDP", "val": "<IMF estimate>", "color": "a", "note": "<source>"},
  {"label": "India Oil Import", "val": "<status>", "color": "r", "note": "87% via sea"},
  {"label": "Food Security", "val": "<risk>", "color": "r", "note": "<context>"}
]

Colors: r=red(bad), a=amber(warning), g=green(good).
HEADLINES: ${top}
Return ONLY JSON array.`;
}

function makeBriefingPrompt(newsMap) {
  const allArticles = Object.values(newsMap).flat().slice(0, 20);
  const headlines = allArticles.map(a => `- ${a.title} (${a.source}, ${a.pubDate.substring(0,10)})`).join('\n');

  return `You are a geopolitical intelligence analyst writing a daily war-room briefing. Based on these latest news articles, write a comprehensive briefing.

Write in clear, direct prose — NOT military jargon. Write for a general audience (like a smart news article, not a classified document). Use plain English. No bullet points. Dense informative paragraphs.

Structure:
SITUATION OVERVIEW: (2 sentences — global picture today)

US-ISRAEL vs IRAN: (2-3 sentences on latest developments)

INDIA-PAKISTAN: (2-3 sentences on latest)

PAKISTAN-AFGHANISTAN: (2 sentences on latest)

RUSSIA-UKRAINE: (2 sentences on latest)

ECONOMIC IMPACT: (2 sentences on trade/oil/markets)

WATCH TODAY: (1 sentence — the single most important thing happening in next 24 hours)

Total: under 380 words. Clear, factual, based only on these articles:
${headlines}`;
}

function makeUpcomingPrompt() {
  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentDate = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  return `Today is ${currentDate}. List 6-8 critical upcoming geopolitical events, deadlines, or anniversary dates in the next 60 days related to the 4 active wars (US-Israel vs Iran, India-Pakistan, Pakistan-Afghanistan, Russia-Ukraine) and the US-India trade war.

Include REAL upcoming events such as: UN sessions, treaty deadlines, attack anniversaries, election dates, ceasefire expirations, scheduled military exercises, summit meetings, sanctions deadlines, IMF/World Bank meetings.

Return a JSON array (raw JSON only):
[
  {
    "date": "22",
    "month": "APR",
    "title": "Pahalgam Attack Anniversary — India-Pakistan Flashpoint",
    "desc": "One year since attack that triggered Operation Sindoor. High provocation risk.",
    "severity": "r",
    "tag": "India-Pakistan"
  }
]
severity: r=red(critical), a=amber(important), b=blue(watch). tag should be the related conflict or topic name. Return ONLY JSON array.`;
}

function makeConflictDetailPrompt(conflictId, articles) {
  const headlines = articles.slice(0, 15).map((a, i) => `[${i+1}] ${a.title}\nSource: ${a.source} | ${a.pubDate.substring(0,10)}\n${a.snippet}`).join('\n\n');

  const conflicts = {
    iran: { name: 'US + Israel vs Iran (Operation Epic Fury)', started: 'February 28, 2026' },
    'india-pakistan': { name: 'India vs Pakistan', started: 'escalated April 2025' },
    'pakistan-afghanistan': { name: 'Pakistan vs Afghanistan', started: 'February 2026' },
    'russia-ukraine': { name: 'Russia vs Ukraine', started: 'February 24, 2022' }
  };

  const c = conflicts[conflictId] || { name: conflictId, started: 'recent' };

  return `You are a geopolitical analyst writing a comprehensive conflict briefing for ${c.name} (started ${c.started}).

Based on the news articles provided AND your knowledge of history, write a detailed JSON response (raw JSON, no markdown):

{
  "history": {
    "origin": "<3-4 paragraph detailed history of how this conflict started — root causes, key events, who did what and when>",
    "timeline": [
      {"date": "<date>", "event": "<what happened — 1-2 sentences>", "significance": "high|medium|low"},
      ... (15-20 key timeline events from start to now)
    ]
  },
  "current": {
    "summary": "<2-3 paragraph detailed current situation based on latest news>",
    "militarySituation": "<1-2 sentences on military position>",
    "diplomaticSituation": "<1-2 sentences on diplomatic efforts>",
    "casualties": "<latest known figures>",
    "keyDevelopments": ["<development 1>", "<development 2>", "<development 3>"]
  },
  "leaderStatements": [
    {
      "name": "<Leader name>",
      "role": "<Title/Role>",
      "country": "<Country>",
      "statement": "<What they said — direct quote or close paraphrase>",
      "date": "<date>",
      "source": "<where it was said: speech/tweet/interview/press conference>",
      "sentiment": "escalatory|de-escalatory|neutral|threatening"
    },
    ... (8-12 statements from different leaders on both sides)
  ],
  "futureScenarios": [
    {
      "title": "Best Case",
      "probability": "<low/medium/high>%",
      "description": "<2-3 sentences on what needs to happen for this>",
      "timeline": "<how long this could take>"
    },
    {
      "title": "Most Likely",
      "probability": "<X>%",
      "description": "<2-3 sentences>",
      "timeline": "<timeline>"
    },
    {
      "title": "Worst Case",
      "probability": "<X>%",
      "description": "<2-3 sentences on escalation scenario>",
      "timeline": "<timeline>"
    }
  ],
  "globalImpact": {
    "economic": "<2 sentences on economic impact>",
    "humanitarian": "<2 sentences on human cost>",
    "geopolitical": "<2 sentences on power shifts>"
  }
}

LATEST NEWS ARTICLES:
${headlines}

Return ONLY the JSON object.`;
}

// ── GEOPOLITICS WORLD ORDER PROMPT ─────────────────────────────────────────────
function makeGeopoliticsPrompt(allNews) {
  const headlines = allNews.slice(0, 15).map((a,i) => `[${i+1}] ${a.title} (${a.source})`).join('\n');
  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentDate = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return `Today is ${currentDate}. You are a world-class geopolitical intelligence analyst. Return a JSON object covering the FULL global geopolitical landscape (no markdown, raw JSON only):

{
  "alliances": [
    {
      "name": "NATO",
      "type": "military",
      "members": ["USA", "UK", "Germany", "France", "Turkey", "..."],
      "strength": "dominant",
      "status": "Active but strained — internal disagreements on Ukraine support levels",
      "recentMove": "<latest significant NATO action from recent news>"
    },
    {
      "name": "BRICS+",
      "type": "economic-political",
      "members": ["China", "Russia", "India", "Brazil", "South Africa", "UAE", "Saudi Arabia", "Egypt", "Ethiopia", "Iran"],
      "strength": "rising",
      "status": "<current status>",
      "recentMove": "<latest action>"
    },
    {
      "name": "SCO (Shanghai Cooperation Organisation)",
      "type": "security",
      "members": ["China", "Russia", "India", "Pakistan", "Iran", "..."],
      "strength": "growing",
      "status": "<status>",
      "recentMove": "<latest>"
    },
    {
      "name": "AUKUS",
      "type": "military-tech",
      "members": ["Australia", "UK", "USA"],
      "strength": "niche",
      "status": "<status>",
      "recentMove": "<latest>"
    },
    {
      "name": "Quad",
      "type": "strategic",
      "members": ["USA", "India", "Japan", "Australia"],
      "strength": "moderate",
      "status": "<status>",
      "recentMove": "<latest>"
    }
  ],
  "rivalries": [
    {
      "side1": "USA",
      "side2": "China",
      "domain": "Trade, Tech, Military, Taiwan",
      "intensity": "high",
      "summary": "<2 sentence update on current tensions>"
    },
    {
      "side1": "USA",
      "side2": "Russia",
      "domain": "Ukraine, Nuclear, Arctic",
      "intensity": "critical",
      "summary": "<2 sentence update>"
    },
    {
      "side1": "India",
      "side2": "China",
      "domain": "Border, Trade, Influence",
      "intensity": "elevated",
      "summary": "<2 sentence update>"
    },
    {
      "side1": "Saudi Arabia",
      "side2": "Iran",
      "domain": "Regional Dominance, Proxy Wars",
      "intensity": "<level>",
      "summary": "<2 sentence update>"
    },
    {
      "side1": "North Korea",
      "side2": "South Korea + USA",
      "domain": "Nuclear, DMZ",
      "intensity": "<level>",
      "summary": "<2 sentence update>"
    }
  ],
  "countryDevelopments": [
    {
      "country": "USA",
      "flag": "🇺🇸",
      "developments": [
        {"sector": "Military", "update": "<latest military move or spending>"},
        {"sector": "Economy", "update": "<GDP/trade/tariff update>"},
        {"sector": "Tech/AI", "update": "<latest tech development>"}
      ]
    },
    {
      "country": "China",
      "flag": "🇨🇳",
      "developments": [
        {"sector": "Military", "update": "<latest>"},
        {"sector": "Economy", "update": "<latest>"},
        {"sector": "Space/Tech", "update": "<latest>"}
      ]
    },
    {
      "country": "India",
      "flag": "🇮🇳",
      "developments": [
        {"sector": "Defense", "update": "<latest>"},
        {"sector": "Economy", "update": "<latest>"},
        {"sector": "Space/ISRO", "update": "<latest>"}
      ]
    },
    {
      "country": "Russia",
      "flag": "🇷🇺",
      "developments": [
        {"sector": "Military", "update": "<latest>"},
        {"sector": "Economy", "update": "<sanctions impact>"},
        {"sector": "Energy", "update": "<oil/gas>"}
      ]
    },
    {
      "country": "Israel",
      "flag": "🇮🇱",
      "developments": [
        {"sector": "Military", "update": "<latest>"},
        {"sector": "Diplomacy", "update": "<latest>"}
      ]
    },
    {
      "country": "Iran",
      "flag": "🇮🇷",
      "developments": [
        {"sector": "Nuclear", "update": "<enrichment status>"},
        {"sector": "Military", "update": "<latest>"}
      ]
    },
    {
      "country": "Pakistan",
      "flag": "🇵🇰",
      "developments": [
        {"sector": "Military", "update": "<two-front situation>"},
        {"sector": "Economy", "update": "<IMF/crisis>"}
      ]
    },
    {
      "country": "Japan",
      "flag": "🇯🇵",
      "developments": [
        {"sector": "Defense", "update": "<rearmament status>"},
        {"sector": "Economy", "update": "<latest>"}
      ]
    }
  ],
  "geopoliticalDebates": [
    {
      "topic": "<e.g. Should NATO expand further?>",
      "region": "Global",
      "sides": [
        {"position": "For", "argument": "<1-2 sentences>", "supporters": ["country1", "country2"]},
        {"position": "Against", "argument": "<1-2 sentences>", "supporters": ["country1", "country2"]}
      ],
      "status": "Ongoing"
    },
    {
      "topic": "<e.g. De-dollarization — Will BRICS replace the USD?>",
      "region": "Global",
      "sides": [
        {"position": "For", "argument": "<1-2 sentences>", "supporters": ["China", "Russia"]},
        {"position": "Against", "argument": "<1-2 sentences>", "supporters": ["USA", "EU"]}
      ],
      "status": "Accelerating"
    },
    {
      "topic": "<e.g. Taiwan — Is invasion imminent?>",
      "region": "Indo-Pacific",
      "sides": [
        {"position": "China's Claim", "argument": "<>", "supporters": ["China"]},
        {"position": "Status Quo", "argument": "<>", "supporters": ["USA", "Japan", "Taiwan"]}
      ],
      "status": "<>"
    },
    {
      "topic": "<another major global debate>",
      "region": "<region>",
      "sides": [
        {"position": "<>", "argument": "<>", "supporters": ["<>"]},
        {"position": "<>", "argument": "<>", "supporters": ["<>"]}
      ],
      "status": "<>"
    },
    {
      "topic": "<another debate — small country perspective>",
      "region": "<region>",
      "sides": [
        {"position": "<>", "argument": "<>", "supporters": ["<>"]},
        {"position": "<>", "argument": "<>", "supporters": ["<>"]}
      ],
      "status": "<>"
    }
  ],
  "_updatedAt": "${now.toISOString()}"
}

Use the following recent news as context:
${headlines}

Return ONLY valid JSON. No markdown. No commentary.`;
}

// ── MAIN UPDATE FUNCTION ───────────────────────────────────────────────────────
async function runUpdate(opts = {}) {
  const { verbose = true } = opts;
  const log = (...a) => verbose && console.log('[updater]', ...a);
  const errors = [];
  const t = Date.now();

  log('════ Starting hourly update ════');

  // 1. Fetch all RSS news
  let allNews = [];
  try {
    allNews = await fetchAllNews();
    log(`Fetched ${allNews.length} articles`);
    save('raw-news.json', { articles: allNews.slice(0, 300), _updatedAt: new Date().toISOString() });
  } catch (e) {
    log('RSS fetch failed:', e.message);
    errors.push({ key: 'rss', error: e.message });
  }

  const newsMap = {};
  const { categorizeNews } = require('./news');
  try { Object.assign(newsMap, categorizeNews(allNews)); } catch {}

  // Helper: run Gemini call with retry + error handling
  async function geminiSave(key, file, promptFn, isJSON = true, maxTok = 8192) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        log(`Fetching ${key} (attempt ${attempt})...`);
        const prompt = typeof promptFn === 'function' ? promptFn() : promptFn;
        const result = await ask(prompt, { json: isJSON, maxTokens: maxTok || 8192 });
        let data = isJSON ? result : { text: result };

        // ── VALIDATION GATE: Never save empty/broken data ──
        if (data === null || data === undefined) {
          throw new Error('AI returned null/undefined — retrying');
        }
        if (isJSON && typeof data === 'string') {
          throw new Error('AI returned raw string instead of JSON — retrying');
        }

        // For conflicts.json: validate it has at least one required key
        if (file === 'conflicts.json' && typeof data === 'object' && !Array.isArray(data)) {
          const hasConflicts = data.iran || data['india-pakistan'] || data['russia-ukraine'] || data.conflicts;
          if (!hasConflicts) {
            throw new Error('conflicts.json missing all conflict keys — AI output is malformed');
          }
        }

        // For economic data: validate it's a non-empty array
        if (file === 'economic.json' && Array.isArray(data) && data.length === 0) {
          throw new Error('economic.json is empty array — retrying');
        }

        // For geopolitics: validate alliances is an array of objects (not flat strings)
        if (file === 'geopolitics.json' && typeof data === 'object') {
          const a = data.alliances;
          if (!a || !Array.isArray(a) || a.length === 0) {
            throw new Error('geopolitics.json missing alliances array — retrying');
          }
          // Check if the first 2 items are actual objects (not flat strings from broken JSON)
          const validObjs = a.filter(x => typeof x === 'object' && x !== null && x.name);
          if (validObjs.length < 2) {
            throw new Error(`geopolitics.json alliances malformed (only ${validObjs.length} valid) — retrying`);
          }
        }

        // Force economic + events files to always be arrays (AI sometimes returns single object)
        if ((file === 'economic.json' || file === 'upcoming-events.json') && !Array.isArray(data)) {
          // Extract array from wrapper objects like {indicators:[...]}, {events:[...]}, etc.
          const inner = data.indicators || data.economic || data.events || data.upcomingEvents || data.data;
          if (Array.isArray(inner) && inner.length > 0) {
            data = inner;
          } else if (data.label || data.name || data.title || data.event) {
            // Single item object → wrap in array
            const clean = { ...data }; delete clean._updatedAt;
            data = [clean];
          }
        }

        // Arrays (economic, events) must not be spread into objects
        if (Array.isArray(data)) {
          save(file, data);
        } else {
          save(file, { ...data, _updatedAt: new Date().toISOString() });
        }
        log(`✓ ${file}`);
        return;
      } catch (e) {
        log(`✗ ${key} attempt ${attempt}: ${e.message.substring(0, 120)}`);
        
        // If rate limited (429), parse retry delay and wait
        if (e.message.includes('429') || e.message.includes('quota')) {
          const match = e.message.match(/retry in (\d+)/i);
          const waitSec = match ? parseInt(match[1]) + 5 : 65;
          log(`Rate limited — waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
        } else if (attempt < 3) {
          await new Promise(r => setTimeout(r, 5000)); // wait 5s before retry
        }
        
        if (attempt === 3) errors.push({ key, error: e.message });
      }
    }
  }

  // 2. Generate all data files — sequential to respect free tier rate limits (15 RPM)
  await geminiSave('meta',     'meta.json',     () => makeMetaPrompt(allNews), true, 4096);
  await new Promise(r => setTimeout(r, 6000));

  await geminiSave('conflicts','conflicts.json', () => makeConflictsPrompt(newsMap), true, 4096);
  await new Promise(r => setTimeout(r, 6000));

  await geminiSave('economic', 'economic.json', () => makeEcoPrompt(newsMap.geopolitics || allNews), true, 4096);
  await new Promise(r => setTimeout(r, 6000));

  await geminiSave('briefing', 'daily-briefing.json', () => makeBriefingPrompt(newsMap), false, 4096);
  await new Promise(r => setTimeout(r, 6000));

  await geminiSave('events',   'upcoming-events.json', makeUpcomingPrompt, true, 4096);
  await new Promise(r => setTimeout(r, 6000));

  await geminiSave('geopolitics', 'geopolitics.json', () => makeGeopoliticsPrompt(allNews), true, 8192);
  await new Promise(r => setTimeout(r, 6000));

  // 3. Per-conflict detailed pages (cached, regenerated every 6 hours)
  const conflicts = ['iran', 'india-pakistan', 'pakistan-afghanistan', 'russia-ukraine'];
  for (const id of conflicts) {
    const file = `conflict-${id}.json`;
    const lastMod = exists(file) ? fs.statSync(path.join(DATA_DIR, file)).mtimeMs : 0;
    const hoursOld = (Date.now() - lastMod) / 3600000;

    if (hoursOld >= 1) {
      await geminiSave(`conflict:${id}`, file,
        () => makeConflictDetailPrompt(id, newsMap[id] || allNews.slice(0, 10)), true, 4000);
      await new Promise(r => setTimeout(r, 6000));
    } else {
      log(`Skipping ${file} (${hoursOld.toFixed(1)}h old, refreshes at 1h)`);
    }
  }

  // 4. Archive tension history for trend graph
  try {
    const conflictsData = load('conflicts.json');
    if (conflictsData) {
      const entry = {
        ts: new Date().toISOString(),
        iran: conflictsData.iran?.tensionPct || 0,
        indiaPak: conflictsData['india-pakistan']?.tensionPct || 0,
        pakAfg: conflictsData['pakistan-afghanistan']?.tensionPct || 0,
        rusUkr: conflictsData['russia-ukraine']?.tensionPct || 0,
        trade: 48 // US-India trade war (static baseline, updated by eco data)
      };
      
      let history = [];
      if (exists('tension-history.json')) {
        history = load('tension-history.json') || [];
      } else {
        // Seed with 7 days of simulated historical data
        for (let i = 7; i >= 1; i--) {
          const d = new Date(Date.now() - i * 86400000);
          history.push({
            ts: d.toISOString(),
            iran: Math.max(60, entry.iran - Math.floor(Math.random() * 15) + (7-i)*2),
            indiaPak: Math.max(25, entry.indiaPak - Math.floor(Math.random() * 10)),
            pakAfg: Math.max(30, entry.pakAfg - Math.floor(Math.random() * 12)),
            rusUkr: Math.max(40, entry.rusUkr - Math.floor(Math.random() * 8)),
            trade: Math.max(35, entry.trade - Math.floor(Math.random() * 10) + i)
          });
        }
      }
      
      history.push(entry);
      // Keep only last 720 entries (30 days * 24 hours)
      if (history.length > 720) history = history.slice(-720);
      save('tension-history.json', history);
      log('✓ tension-history.json archived');
    }
  } catch (e) {
    log('Tension history archive failed: ' + e.message);
  }

  // 5. Save update log
  const elapsed = ((Date.now() - t) / 1000).toFixed(1);
  const updateLog = {
    lastUpdate: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + (parseInt(process.env.UPDATE_INTERVAL_MINUTES || 60) * 60000)).toISOString(),
    success: errors.length === 0,
    errors,
    articlesProcessed: allNews.length,
    elapsedSeconds: parseFloat(elapsed)
  };
  save('update-log.json', updateLog);

  log(`════ Done in ${elapsed}s | Errors: ${errors.length} ════`);
  return updateLog;
}

module.exports = { runUpdate, load, restoreFromDB, save, exists, DATA_DIR };
