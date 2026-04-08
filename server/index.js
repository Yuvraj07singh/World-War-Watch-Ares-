// server/index.js
// ─────────────────────────────────────────────
//  World War Watch — Backend Server v2
//  Free APIs: Google Gemini + RSS feeds
//  Auto-updates every hour
// ─────────────────────────────────────────────

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const cron        = require('node-cron');
const path        = require('path');

const { ask, logProviders } = require('./ai');
const { runUpdate, load, restoreFromDB } = require('./updater');
const { connectDB, Subscriber } = require('./db');
const mongoose    = require('mongoose');
const { fetchAllNews, filterByConflict, categorizeNews } = require('./news');

const app  = express();
const PORT = process.env.PORT || 3000;
const UPDATE_MINS = parseInt(process.env.UPDATE_INTERVAL_MINUTES || '15');

// ── MIDDLEWARE ─────────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Fixes Render's X-Forwarded-For warning for rate-limit
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate limiters
const apiLimiter = rateLimit({ windowMs: 60000, max: 30, message: { error: 'Too many requests. Try again in a minute.' } });
const aiLimiter  = rateLimit({ windowMs: 60000, max: 10, message: { error: 'Too many AI requests. Try again in a minute.' } });

// ── STATIC FILES ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '2m', etag: true
}));

// ── DATA ENDPOINTS (cached, from JSON files) ───────────────────────────────────
function serve(filename) {
  return (req, res) => {
    const d = load(filename);
    if (!d) return res.status(503).json({ error: 'Data not ready. Run: npm run update', hint: 'Takes ~60 seconds on first run.' });
    res.set('Cache-Control', 'public, max-age=120');
    res.json(d);
  };
}

app.get('/api/meta',            apiLimiter, serve('meta.json'));
app.get('/api/conflicts',       apiLimiter, serve('conflicts.json'));
app.get('/api/economic',        apiLimiter, serve('economic.json'));
app.get('/api/briefing',        apiLimiter, serve('daily-briefing.json'));
app.get('/api/events',          apiLimiter, serve('upcoming-events.json'));
app.get('/api/update-log',      apiLimiter, serve('update-log.json'));
app.get('/api/tension-history', apiLimiter, serve('tension-history.json'));
app.get('/api/geopolitics',     apiLimiter, serve('geopolitics.json'));

// Per-conflict detail page data
app.get('/api/conflict/:id', apiLimiter, (req, res) => {
  const { id } = req.params;
  const valid = ['iran', 'india-pakistan', 'pakistan-afghanistan', 'russia-ukraine'];
  if (!valid.includes(id)) return res.status(400).json({ error: 'Invalid conflict ID.' });
  const d = load(`conflict-${id}.json`);
  if (!d) return res.status(503).json({ error: 'Detail data not yet generated. Run: npm run update' });
  res.set('Cache-Control', 'public, max-age=600');
  res.json(d);
});

// Latest news articles (raw)
app.get('/api/news', apiLimiter, (req, res) => {
  const d = load('raw-news.json');
  if (!d) return res.status(503).json({ error: 'News not loaded yet.' });
  const { conflict, limit = 20 } = req.query;
  let articles = d.articles || [];
  if (conflict) articles = filterByConflict(articles, conflict);
  res.json({ articles: articles.slice(0, parseInt(limit)), total: articles.length, _updatedAt: d._updatedAt });
});

// Combined all-data endpoint
app.get('/api/all', apiLimiter, (req, res) => {
  const files = ['meta.json', 'conflicts.json', 'economic.json', 'daily-briefing.json', 'upcoming-events.json', 'update-log.json', 'tension-history.json', 'geopolitics.json'];
  const coreFiles = ['meta.json', 'conflicts.json'];
  const result = {};
  for (const f of files) {
    const d = load(f);
    if (!d && coreFiles.includes(f)) {
      return res.status(503).json({ error: `Core data (${f}) not initialized.` });
    }
    const key = f.replace('.json', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace('Daily','daily');
    result[key] = d || null;
  }
  res.set('Cache-Control', 'public, max-age=120');
  res.json(result);
});

// ── LIVE AI ENDPOINTS ──────────────────────────────────────────────────────────
// These call Gemini fresh (use for user queries)

app.post('/api/ask', aiLimiter, async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.length > 600)
    return res.status(400).json({ error: 'Invalid query.' });

  try {
    // Get latest news context
    const newsData = load('raw-news.json');
    const newsContext = newsData?.articles?.slice(0,12)
      .map(a => `- ${a.title} (${a.source})`).join('\n') || 'No cached news available.';

    const prompt = `You are a geopolitical intelligence analyst. Answer this question clearly and factually for a general audience.

Question: ${query}

Use these latest news headlines as context (from the last hour):
${newsContext}

Write in plain English. Be direct and informative. Under 250 words. If the question is about an ongoing conflict, mention the latest developments you know of.`;

    const text = await ask(prompt, { maxTokens: 800 });
    res.json({ text, query, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('[/api/ask]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Newsletter Subscription
app.post('/api/subscribe', apiLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Check if MongoDB is actually connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database offline — try again in a few minutes' });
  }

  try {
    const sub = await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {},
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    res.json({ success: true, message: 'Subscribed to Intel Briefings' });
  } catch (err) {
    console.error('Subscription error:', err.message);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});


// Live impact analysis
app.post('/api/impact', aiLimiter, async (req, res) => {
  const { type } = req.body;
  const prompts = {
    economic: `Write a clear economic analysis (250 words) of how the current active wars (US-Israel vs Iran, India-Pakistan, Pakistan-Afghanistan, Russia-Ukraine) are affecting the global economy as of April 2026. Focus on: Hormuz blockade, oil prices, shipping costs, global inflation, India's specific exposure. Plain English, not jargon.`,
    india: `Write a clear analysis (250 words) of how all 4 active wars are affecting India specifically right now. Cover: oil import crisis, US tariff shock, Pakistan border tension, INR weakness, 8M+ Indian workers in Gulf. What should ordinary Indians know? Plain language.`,
    humanitarian: `Write a clear humanitarian impact analysis (250 words) across all 4 active wars. Iran casualties, Afghan civilian situation, Ukraine Year 4 displacement, food security crisis. Plain English, for a general audience.`,
    geopolitical: `Write a clear geopolitical analysis (250 words) of how 4 simultaneous wars are reshaping the global order. US overextension, China's Taiwan positioning, NATO fractures, Global South neutrality, nuclear risk. Plain English.`,
    advisories: `Write practical advice (250 words) for Indian citizens during the current global conflict situation. Cover: financial safety steps, travel advisories, what sectors to invest/avoid, how to verify war news, what border-state residents should know. Practical, actionable guidance.`
  };
  if (!prompts[type]) return res.status(400).json({ error: 'Invalid type.' });
  try {
    const text = await ask(prompts[type], { maxTokens: 900 });
    res.json({ text, type, generatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── MANUAL UPDATE TRIGGER ──────────────────────────────────────────────────────
app.post('/api/admin/update', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: 'Unauthorized.' });
  res.json({ message: 'Update started. Check /api/update-log in ~60 seconds.' });
  runUpdate({ verbose: true }).catch(err => console.error('[manual update]', err));
});

// Health check
app.get('/api/health', (req, res) => {
  const log = load('update-log.json');
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    lastUpdate: log?.lastUpdate || 'Never',
    nextUpdate: log?.nextUpdate || 'Unknown',
    dataReady: !!load('conflicts.json'),
    updateIntervalMinutes: UPDATE_MINS
  });
});

// ── SPA ROUTING — serve index.html for all non-API routes ─────────────────────
app.get('/conflict/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'conflict.html'));
});

// ── CRON SCHEDULER ────────────────────────────────────────────────────────────
// Convert minutes interval to cron expression
function minutesToCron(mins) {
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    return `0 */${hours} * * *`;  // every N hours
  }
  return `*/${mins} * * * *`;  // every N minutes
}

const cronExpr = minutesToCron(UPDATE_MINS);
console.log(`[scheduler] Auto-update every ${UPDATE_MINS} minutes (cron: ${cronExpr})`);

cron.schedule(cronExpr, async () => {
  console.log(`[scheduler] ═══ Hourly update triggered at ${new Date().toISOString()} ═══`);
  try {
    await runUpdate({ verbose: true });
  } catch (err) {
    console.error('[scheduler] Update failed:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// ── START ──────────────────────────────────────────────────────────────────────
const initServer = async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  WORLD WAR WATCH v2 — Server Online          ║');
  console.log(`║  http://localhost:${PORT}                        ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 1. Database & AI Initialization
  const dbActive = await connectDB();
  logProviders();
  if (dbActive) {
    await restoreFromDB();
  }

  // 2. Data Health Check
  console.log(`Data ready:     ${load('conflicts.json') ? '✓ Yes' : '✗ Run: npm run update'}`);
  console.log(`Auto-update:    Every ${UPDATE_MINS} minutes`);
  console.log(`Schedule:       ${cronExpr} (Asia/Kolkata)`);

  // 3. Never-sleep self ping (Render)
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    console.log(`Self-Ping:      Active (Target: ${selfUrl})`);
    setInterval(async () => {
      try {
        const fetch = require('node-fetch');
        await fetch(`${selfUrl}/api/health`);
        console.log(`[self-ping] Keep-alive heartbeat sent to ${selfUrl}`);
      } catch (e) {
        console.error('[self-ping] Heartbeat failed:', e.message);
      }
    }, 10 * 60 * 1000);
  } else {
    console.log('Self-Ping:      Inactive (Local Environment)');
  }

  // 4. Force initial update if missing
  if (!load('meta.json')) {
    console.log('\n[!] Cache empty — Triggering initial intelligence fetch...');
    runUpdate().catch(e => console.error('[!] Initial fetch failed:', e.message));
  }
  console.log('');
};

app.listen(PORT, initServer);

module.exports = app;
