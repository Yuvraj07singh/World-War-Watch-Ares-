// server/gemini.js
// ─────────────────────────────────────────────
//  Google Gemini API wrapper
//  FREE tier: 15 RPM, 1 million tokens/day
//  Get key: https://aistudio.google.com/app/apikey
// ─────────────────────────────────────────────

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your-gemini-api-key-here') {
      throw new Error('GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/app/apikey');
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/**
 * Call Gemini with a prompt
 * @param {string} prompt
 * @param {object} opts - { temperature, maxTokens, json }
 */
async function ask(prompt, opts = {}) {
  const client = getClient();
  
  const generationConfig = {
    temperature: opts.temperature || 0.3,
    maxOutputTokens: opts.maxTokens || 8192,
    ...(opts.json ? { responseMimeType: 'application/json' } : {})
  };

  // gemini-2.5-flash uses "thinking" tokens that eat into maxOutputTokens.
  // For JSON output: disable thinking entirely (it's unnecessary for structured data)
  // For text output: allow a small thinking budget
  if (opts.json) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  } else {
    generationConfig.thinkingConfig = { thinkingBudget: 1024 };
  }

  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  if (opts.json) {
    // Strip any accidental markdown fences
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean);
  }

  return text;
}

/**
 * Ask Gemini to analyze news articles and produce structured output
 */
async function analyzeNews(articles, topic, outputFormat) {
  const articleText = articles
    .slice(0, 12)
    .map((a, i) => `[${i+1}] ${a.title}\nSource: ${a.source} | Date: ${a.pubDate}\n${a.snippet || ''}`)
    .join('\n\n');

  const prompt = `You are a geopolitical intelligence analyst. Analyze these recent news articles about ${topic} and produce the following:\n\n${outputFormat}\n\n--- NEWS ARTICLES ---\n${articleText}\n---\n\nBase your analysis ONLY on these articles. Be factual and precise.`;

  return ask(prompt, { json: true, maxTokens: 1500 });
}

module.exports = { ask, analyzeNews };
