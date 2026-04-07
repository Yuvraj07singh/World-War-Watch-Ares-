// server/ai.js
// ─────────────────────────────────────────────
//  Unified Intelligence Bureau
//  4-Layer Automatic Failover:
//  1. Gemini 2.5 Flash (Google — primary)
//  2. Cerebras (Llama 3.3 70B — blazing fast)
//  3. OpenRouter (DeepSeek/Llama — multi-model gateway)
//  4. Pollinations (Free, no key — last resort)
// ─────────────────────────────────────────────

const { ask: askGemini } = require('./gemini');
const { askCerebras } = require('./cerebras');
const { askOpenRouter } = require('./openrouter');
const { askPollinations } = require('./pollinations');

// Check which providers are configured
function getProviders() {
  const providers = [
    { name: 'Gemini', fn: askGemini, ready: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' },
    { name: 'Cerebras', fn: askCerebras, ready: !!process.env.CEREBRAS_API_KEY },
    { name: 'OpenRouter', fn: askOpenRouter, ready: !!process.env.OPENROUTER_API_KEY },
    { name: 'Pollinations', fn: askPollinations, ready: true } // Always available (no key needed)
  ];
  return providers;
}

async function ask(prompt, opts = {}) {
  const providers = getProviders();
  const errors = [];

  for (const provider of providers) {
    if (!provider.ready) {
      continue; // Skip unconfigured providers
    }

    try {
      const result = await provider.fn(prompt, opts);
      return result;
    } catch (e) {
      const shortErr = e.message.substring(0, 60);
      console.warn(`[ai] ${provider.name} failed (${shortErr}...). Falling back...`);
      errors.push({ provider: provider.name, error: e.message });
    }
  }

  // All providers failed
  const summary = errors.map(e => `${e.provider}: ${e.error.substring(0, 40)}`).join(' | ');
  throw new Error(`AI pipeline failed — all ${errors.length} providers down. ${summary}`);
}

// Log configured providers on startup
function logProviders() {
  const providers = getProviders();
  const configured = providers.filter(p => p.ready);
  console.log(`AI Providers:   ${configured.map(p => `✓ ${p.name}`).join(' → ')} (${configured.length}-layer failover)`);
  const unconfigured = providers.filter(p => !p.ready);
  if (unconfigured.length) {
    console.log(`AI Unconfigured: ${unconfigured.map(p => `✗ ${p.name}`).join(', ')} (add API keys to enable)`);
  }
}

module.exports = { ask, logProviders };
