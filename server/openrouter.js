// server/openrouter.js
// ─────────────────────────────────────────────
//  OpenRouter API wrapper (OpenAI-compatible)
//  Gateway to 100+ models — many $0/token
//  Free tier: Generous, depends on model
//  Get key: https://openrouter.ai/keys
// ─────────────────────────────────────────────

const fetch = require('node-fetch');

async function askOpenRouter(prompt, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set.');
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  // Use a specific, reliable free model rather than auto-routing to avoid censorship/empty responses
  const model = opts.model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';

  const body = {
    model,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: opts.temperature || 0.3,
    max_tokens: opts.maxTokens || 8192,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {})
  };

  // 45s timeout (OpenRouter can be slower routing through providers)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://worldwarwatch.com',
        'X-Title': 'World War Watch'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.message || data.error?.code || response.statusText;
    throw new Error(`OpenRouter API Error: ${errMsg}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('OpenRouter returned malformed response — no choices');
  }

  const content = data.choices[0].message.content;

  if (!content || content.trim().length === 0) {
    throw new Error('OpenRouter returned empty content');
  }

  if (opts.json) {
    try {
      // Aggressive cleanup: strip markdown fences, leading text, BOM
      let cleanText = content.trim().replace(/^\uFEFF/, '');
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/g, '').trim();
      const firstBrace = cleanText.search(/[\[{]/);
      if (firstBrace > 0) cleanText = cleanText.substring(firstBrace);
      const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
      if (lastBrace > 0) cleanText = cleanText.substring(0, lastBrace + 1);
      return JSON.parse(cleanText);
    } catch (e) {
      console.error('[openrouter] Failed to parse JSON response:', content.substring(0, 300));
      throw new Error('OpenRouter returned invalid JSON');
    }
  }

  return content;
}

module.exports = { askOpenRouter };
