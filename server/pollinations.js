// server/pollinations.js
// ─────────────────────────────────────────────
//  Pollinations.ai Free API wrapper
//  Completely free, no API key needed
// ─────────────────────────────────────────────

const fetch = require('node-fetch');

/**
 * Call Pollinations with a prompt
 * @param {string} prompt
 * @param {object} opts - { temperature, maxTokens, json }
 */
async function askPollinations(prompt, opts = {}) {
  const url = 'https://text.pollinations.ai/';

  const body = {
    messages: [
      { role: 'user', content: prompt }
    ],
    model: 'openai', // default free model routing
    jsonMode: opts.json ? true : false,
    temperature: opts.temperature || 0.3
  };

  // Add 30s timeout to prevent hanging
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Pollinations API Error: ${response.statusText} - ${text.substring(0, 200)}`);
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Pollinations returned empty response');
  }

  if (opts.json) {
    try {
      // Aggressive cleanup: strip ALL markdown fences, leading text, BOM
      let cleanText = text.trim().replace(/^\uFEFF/, '');
      // Remove any wrapping markdown code fences (```json ... ``` or ``` ... ```)
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/g, '').trim();
      // If the JSON still has leading non-JSON text (e.g. "Here is the JSON:\n{...}")
      const firstBrace = cleanText.search(/[\[{]/);
      if (firstBrace > 0) cleanText = cleanText.substring(firstBrace);
      // Find the last closing brace/bracket
      const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
      if (lastBrace > 0) cleanText = cleanText.substring(0, lastBrace + 1);
      
      return JSON.parse(cleanText);
    } catch (e) {
      // Attempt repair
      let repaired = cleanText;
      repaired = repaired.replace(/,\s*([}\]])/g, '$1');
      repaired = repaired.replace(/'/g, '"');
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      repaired = repaired.replace(/}\s*{/g, '},{');
      repaired = repaired.replace(/,,+/g, ',');
      try {
        return JSON.parse(repaired);
      } catch (e2) {
        console.error('[pollinations] Failed to parse JSON response:', text.substring(0, 300));
        throw new Error('Pollinations returned invalid JSON');
      }
    }
  }

  return text;
}

module.exports = { askPollinations };
