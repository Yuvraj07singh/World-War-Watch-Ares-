// server/ai.js
// ─────────────────────────────────────────────
//  Unified Intelligence Bureau
//  Implements automatic fallback from Gemini to Groq
// ─────────────────────────────────────────────

const { ask: askGemini } = require('./gemini');
const { askGroq } = require('./groq');

async function ask(prompt, opts = {}) {
  try {
    // Try Gemini first (Main provider)
    return await askGemini(prompt, opts);
  } catch (e) {
    const errorMsg = e.message.toLowerCase();
    
    // Check if it's a rate limit or quota error
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exhausted')) {
      console.warn('[ai] Gemini quota hit. Falling back to Groq...');
      
      try {
        // Fallback to Groq (Llama-3-70B)
        // Note: Groq is very smart but the prompt might need small adjustments if strictly JSON
        return await askGroq(prompt, { ...opts, model: 'llama-3.1-70b-versatile' });
      } catch (groqErr) {
        console.error('[ai] Groq fallback failed:', groqErr.message);
        throw new Error(`AI pipeline failed: Both Gemini and Groq are unavailable.`);
      }
    }
    
    // For other types of errors, just rethrow
    throw e;
  }
}

module.exports = { ask };
