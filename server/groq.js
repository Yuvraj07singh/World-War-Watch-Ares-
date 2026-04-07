// server/groq.js
// ─────────────────────────────────────────────
//  Groq Cloud API wrapper (OpenAI-compatible)
//  Targeting Llama-3-70B for intelligence
// ─────────────────────────────────────────────

require('dotenv').config();
const fetch = require('node-fetch');

/**
 * Call Groq with a prompt
 * @param {string} prompt
 * @param {object} opts - { temperature, maxTokens, json }
 */
async function askGroq(prompt, opts = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set.');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = opts.model || 'llama-3.3-70b-versatile';

  const body = {
    model: model,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: opts.temperature || 0.3,
    max_tokens: opts.maxTokens || 4096,
    response_format: opts.json ? { type: 'json_object' } : undefined
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Groq API Error: ${data.error?.message || response.statusText}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Groq returned malformed response — no choices');
  }

  const content = data.choices[0].message.content;

  if (!content || content.trim().length === 0) {
    throw new Error('Groq returned empty content');
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
      console.error('[groq] Failed to parse JSON response:', content.substring(0, 300));
      throw new Error('Groq returned invalid JSON');
    }
  }

  return content;
}

module.exports = { askGroq };
