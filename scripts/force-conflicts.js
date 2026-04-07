require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ask } = require('../server/gemini');
const { categorizeNews } = require('../server/news');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const load = (f) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f))); } catch { return null; } };
const save = (f, d) => fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2));

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
      {"date": "<date>", "event": "<what happened — 1-2 sentences>", "significance": "high|medium|low"}
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
      "source": "<speech/tweet/interview/press conference>",
      "sentiment": "escalatory|de-escalatory|neutral|threatening"
    }
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

async function run() {
  console.log('════ Generating Missing Conflict Detail Pages ════');
  
  const rawNews = load('raw-news.json');
  if (!rawNews || !rawNews.articles) {
    console.error('No raw-news.json found!');
    return;
  }
  const allNews = rawNews.articles;
  const newsMap = categorizeNews(allNews);

  const conflicts = ['iran', 'india-pakistan', 'pakistan-afghanistan', 'russia-ukraine'];
  
  for (const id of conflicts) {
    const file = `conflict-${id}.json`;
    console.log(`Generating data for ${id}...`);
    
    for(let attempt = 1; attempt <= 3; attempt++) {
      try {
        const prompt = makeConflictDetailPrompt(id, newsMap[id] || allNews.slice(0, 10));
        const result = await ask(prompt, { json: true, maxTokens: 8192 });
        save(file, { ...result, _updatedAt: new Date().toISOString() });
        console.log(`✓ successfully saved ${file}`);
        break; // success, break the retry loop
      } catch (e) {
         console.log(`✗ attempt ${attempt} failed: ${e.message.substring(0, 100)}`);
         if (e.message.includes('429') || e.message.includes('quota')) {
            const match = e.message.match(/retry in (\d+)/i);
            const waitSec = match ? parseInt(match[1]) + 5 : 65;
            console.log(`Rate limited — waiting ${waitSec}s...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
         } else if (attempt < 3) {
            await new Promise(r => setTimeout(r, 6000));
         }
      }
    }
    // wait between generating different conflicts
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('════ DONE ════');
}

run();
