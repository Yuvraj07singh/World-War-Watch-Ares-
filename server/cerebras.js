// server/cerebras.js
// ─────────────────────────────────────────────
//  Cerebras Cloud API wrapper (OpenAI-compatible)
//  Blazing fast inference — Llama 3.3 70B
//  Free tier: ~30 RPM, ~1M tokens/day
//  Get key: https://cloud.cerebras.ai
// ─────────────────────────────────────────────

const fetch = require('node-fetch');

async function askCerebras(prompt, opts = {}) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY not set.');
  }

  const url = 'https://api.cerebras.ai/v1/chat/completions';
  const model = opts.model || 'llama-3.3-70b';

  const body = {
    model,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: opts.temperature || 0.3,
    max_tokens: opts.maxTokens || 8192,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {})
  };

  // 30s timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Cerebras API Error: ${data.error?.message || response.statusText}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Cerebras returned malformed response — no choices');
  }

  const content = data.choices[0].message.content;

  if (!content || content.trim().length === 0) {
    throw new Error('Cerebras returned empty content');
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
      console.error('[cerebras] Failed to parse JSON response:', content.substring(0, 300));
      throw new Error('Cerebras returned invalid JSON');
    }
  }

  return content;
}

module.exports = { askCerebras };
