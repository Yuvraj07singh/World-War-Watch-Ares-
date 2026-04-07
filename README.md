# 🌍 World War Watch  — Global Geopolitics Dashboard

Real-time conflict intelligence dashboard. **100% free APIs.** Auto-updates every hour.

---

## APIs Used (All Free)

| What | API | Cost | Limit |
|------|-----|------|-------|
| AI Analysis | Google Gemini 1.5 Flash | **FREE** | 15 req/min, 1M tokens/day |
| News | 12 RSS Feeds (BBC, Reuters, Al Jazeera, NDTV, etc.) | **FREE** | Unlimited |

**No credit card needed. No paid subscription.**

---

## Setup in 3 Steps

### Step 1 — Get your free Gemini API key
1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### Step 2 — Configure
```bash
npm install
cp .env.example .env
```
Open `.env` and add:
```
GEMINI_API_KEY=your-key-here
```

### Step 3 — Run
```bash
# Generate first data (~60 seconds)
npm run update

# Start server
npm start

# Open browser
http://localhost:3000
```

---

## Auto-Update

The server auto-updates **every 60 minutes** (configurable):
1. Fetches all 12 RSS feeds (free, no API key)
2. Filters news by conflict
3. Sends to Gemini for analysis
4. Saves 6 JSON files to `public/data/`

Conflict detail pages (history, leader statements, scenarios) refresh every **6 hours**.

Change interval in `.env`:
```
UPDATE_INTERVAL_MINUTES=60   # every hour (default)
UPDATE_INTERVAL_MINUTES=30   # every 30 min
UPDATE_INTERVAL_MINUTES=120  # every 2 hours
```

---

## Project Structure

```
wwwatch/
├── server/
│   ├── index.js      # Express server + cron scheduler
│   ├── updater.js    # Hourly update logic
│   ├── gemini.js     # Gemini AI wrapper (free)
│   └── news.js       # RSS feed fetcher (free)
├── public/
│   ├── index.html    # Main dashboard
│   ├── conflict.html # Conflict detail page
│   └── data/         # Auto-generated JSON (don't edit)
├── scripts/
│   └── update-now.js # Manual update trigger
├── .env.example
└── package.json
```

---

## API Endpoints

```
GET  /api/all              — All data in one request
GET  /api/conflicts        — Conflict card data
GET  /api/economic         — Economic indicators
GET  /api/briefing         — Today's briefing
GET  /api/events           — Flashpoint calendar
GET  /api/news?limit=20    — Latest news articles
GET  /api/conflict/:id     — Full conflict detail
GET  /api/health           — Server health

POST /api/ask              — AI query { query: "..." }
POST /api/impact           — Impact analysis { type: "india" }
POST /api/admin/update     — Manual trigger
```

---

## Deploy to Production (Free)

### Railway (easiest)
```bash
git init && git add . && git commit -m "init"
# Push to GitHub, then connect at railway.app
# Add GEMINI_API_KEY env var in Railway dashboard
```

### Render
Same process — connect GitHub repo at render.com, add env var.

### VPS
```bash
npm install -g pm2
npm run update
pm2 start server/index.js --name wwwatch
pm2 save && pm2 startup
```

---

## News Sources
BBC World · BBC Middle East · BBC South Asia · Al Jazeera · The Guardian · AP News · Reuters · NDTV · Times of India · The Hindu · Defense News · Foreign Policy
