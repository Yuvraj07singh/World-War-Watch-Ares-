// server/news.js
// ─────────────────────────────────────────────
//  RSS News Fetcher — 100% FREE, no API key
//  Pulls from BBC, Reuters, Al Jazeera, Guardian,
//  Times of India, NDTV, AP News, The Hindu
// ─────────────────────────────────────────────

const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'WorldWarWatch/2.0 RSS Reader' }
});

// ── RSS FEED SOURCES ──────────────────────────────────────────────────────────
const FEEDS = {
  // Global sources
  bbc_world:      'http://feeds.bbci.co.uk/news/world/rss.xml',
  bbc_mid_east:   'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
  bbc_south_asia: 'http://feeds.bbci.co.uk/news/world/south_asia/rss.xml',
  aljazeera:      'https://www.aljazeera.com/xml/rss/all.xml',
  guardian_world: 'https://www.theguardian.com/world/rss',
  ap_world:       'https://feeds.apnews.com/rss/apf-topnews',
  reuters_world:  'https://feeds.reuters.com/reuters/worldNews',
  // India-specific
  ndtv:           'https://feeds.feedburner.com/ndtvnews-world-news',
  times_of_india: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
  the_hindu:      'https://www.thehindu.com/news/international/feeder/default.rss',
  // Defense / Geopolitics
  defense_news:   'https://www.defensenews.com/arc/outboundfeeds/rss/',
  foreign_policy: 'https://foreignpolicy.com/feed/',
  jpost:          'https://www.jpost.com/rss/rssnews.aspx',
  times_of_israel:'https://www.timesofisrael.com/feed/',
  middle_east_eye:'https://www.middleeasteye.net/rss'
};

// ── CONFLICT KEYWORDS ─────────────────────────────────────────────────────────
const CONFLICT_KEYWORDS = {
  iran: [
    'iran', 'iranian', 'tehran', 'hormuz', 'strait of hormuz', 'khamenei',
    'operation epic fury', 'israel iran', 'us iran', 'irgc', 'nuclear iran',
    'persian gulf', 'ayatollah', 'khomeini', 'raisi', 'enrichment uranium',
    'idf', 'netanyahu', 'tel aviv', 'jerusalem', 'israeli strike', 'iranian strike',
    'biden iran', 'us military middle east', 'centcom'
  ],
  'india-pakistan': [
    'india pakistan', 'india-pakistan', 'kashmir', 'pahalgam', 'operation sindoor',
    'loc', 'line of control', 'islamabad', 'modi pakistan', 'imf pakistan',
    'pakistan military', 'lahore', 'ceasefire india', 'cross-border pakistan',
    'pakistan india tension', 'nuclear india pakistan'
  ],
  'pakistan-afghanistan': [
    'pakistan afghanistan', 'pakistan-afghanistan', 'taliban pakistan',
    'ttp', 'tehrik-i-taliban', 'durand line', 'kabul islamabad',
    'pakistan airstrikes afghanistan', 'nangarhar', 'paktika', 'kunar',
    'afghan pakistan border', 'pakistan army afghanistan'
  ],
  'russia-ukraine': [
    'russia ukraine', 'russia-ukraine', 'putin ukraine', 'zelenskyy', 'zelensky',
    'donetsk', 'kharkiv', 'bakhmut', 'nato ukraine', 'kyiv', 'ukraine war',
    'ukrainian army', 'russian forces', 'ceasefire ukraine', 'trump ukraine'
  ],
  geopolitics: [
    'geopolitics', 'world war', 'global conflict', 'nato', 'un security council',
    'nuclear', 'missile', 'sanctions', 'trade war', 'tariff', 'diplomacy',
    'china taiwan', 'north korea', 'middle east conflict', 'global tension'
  ]
};

// ── FETCH A SINGLE FEED ───────────────────────────────────────────────────────
async function fetchFeed(name, url) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 60).map(item => ({
      title:   item.title || '',
      link:    item.link  || item.guid || '',
      source:  name,
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      snippet: (item.contentSnippet || item.content || item.summary || '')
                .replace(/<[^>]*>/g, '').substring(0, 300)
    }));
  } catch (err) {
    console.warn(`[news] Feed failed: ${name} — ${err.message}`);
    return [];
  }
}

// ── FETCH ALL FEEDS IN PARALLEL ───────────────────────────────────────────────
async function fetchAllNews() {
  console.log('[news] Fetching all RSS feeds...');
  const results = await Promise.allSettled(
    Object.entries(FEEDS).map(([name, url]) => fetchFeed(name, url))
  );

  const all = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = all.filter(item => {
    const key = item.title.toLowerCase().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date (newest first)
  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`[news] Fetched ${unique.length} unique articles from ${Object.keys(FEEDS).length} feeds`);
  return unique;
}

// ── FILTER BY CONFLICT ────────────────────────────────────────────────────────
function filterByConflict(articles, conflictId) {
  const keywords = CONFLICT_KEYWORDS[conflictId] || [];
  return articles.filter(article => {
    const text = `${article.title} ${article.snippet}`.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });
}

// ── GET TOP NEWS FOR ALL CONFLICTS ────────────────────────────────────────────
function categorizeNews(articles) {
  const result = {};
  for (const [conflict, keywords] of Object.entries(CONFLICT_KEYWORDS)) {
    result[conflict] = articles.filter(article => {
      const text = `${article.title} ${article.snippet}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    }).slice(0, 50);
  }
  return result;
}

module.exports = { fetchAllNews, filterByConflict, categorizeNews, CONFLICT_KEYWORDS };
