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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Pollinations API Error: ${response.statusText} - ${text}`);
  }

  if (opts.json) {
    try {
      // Sometimes it returns markdown wrapped json even with jsonMode
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
         cleanText = cleanText.substring(7);
         if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      return JSON.parse(cleanText);
    } catch (e) {
      console.error('[pollinations] Failed to parse JSON response:', text);
      throw new Error('Pollinations returned invalid JSON');
    }
  }

  return text;
}

module.exports = { askPollinations };
