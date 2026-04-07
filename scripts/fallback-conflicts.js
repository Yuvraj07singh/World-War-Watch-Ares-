const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../public/data');
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f)));
const save = (f, d) => fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2));

function generateFallback() {
  const conflictsData = load('conflicts.json');
  const newsData = load('raw-news.json').articles || [];

  for (const id of ['iran', 'india-pakistan', 'pakistan-afghanistan', 'russia-ukraine']) {
    const mainDetails = conflictsData[id];
    if (!mainDetails) continue;

    // Grab up to 5 related news articles for timeline/developments
    const relatedNews = newsData.slice(0, 20); 

    const fallback = {
      history: {
        origin: "Due to a very strict free-tier API rate limit (20 req/day), the deep-dive historical analysis module is temporarily unavailable until the quota resets tomorrow. However, your dashboard is fully powered by real, up-to-the-hour API data.\n\nThe global geopolitical landscape is currently tense, highlighted by the following active conflicts.",
        timeline: relatedNews.slice(0, 5).map(n => ({
          date: n.pubDate.substring(0, 10),
          event: n.title,
          significance: "medium"
        }))
      },
      current: {
        summary: mainDetails.summary || "Ongoing situational events.",
        militarySituation: mainDetails.stats[0]?.val || "Ongoing",
        diplomaticSituation: mainDetails.stats[1]?.val || "Stalled",
        casualties: "Verified limits",
        keyDevelopments: mainDetails.topHeadlines || ["Awaiting detailed API response", "Check main dashboard for real-time tickers"]
      },
      leaderStatements: [
        {
          name: "Global Reporting",
          role: "Sources",
          country: "Multiple",
          statement: "Detailed leader analytics paused due to API limits. Dashboard data remains active.",
          date: new Date().toISOString().substring(0, 10),
          source: "Update System",
          sentiment: "neutral"
        }
      ],
      futureScenarios: [
        {
          title: "Dashboard Only Strategy",
          probability: "100%",
          description: "Relying on the top-level daily briefings, which are actively functioning with live RSS.",
          timeline: "Current"
        }
      ],
      globalImpact: {
        economic: "Tracked at the Dashboard base",
        humanitarian: "Extensive displacement across borders.",
        geopolitical: "Shifting multi-polar alliances."
      },
      _updatedAt: new Date().toISOString()
    };

    save(`conflict-${id}.json`, fallback);
    console.log(`Generated fallback for conflict-${id}.json`);
  }
}

generateFallback();
