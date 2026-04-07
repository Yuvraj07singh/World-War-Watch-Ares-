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
    
    // Check if it's a rate limit or quota error, OR a 503 overloaded error
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exhausted') || errorMsg.includes('503') || errorMsg.includes('overloaded')) {
      console.warn(`[ai] Gemini failed (${e.message.substring(0, 40)}...). Falling back to Groq...`);
      
      try {
        // Fallback to Groq (Llama-3-70B)
        return await askGroq(prompt, { ...opts, model: 'llama-3.1-70b-versatile' });
      } catch (groqErr) {
        console.error('[ai] Groq fallback failed:', groqErr.message);
        throw new Error(`AI pipeline failed: Both Gemini and Groq are unavailable.`);
      }
    }
    
    // If we want to be hyper-resilient, any Gemini failure could trigger Groq
    console.warn(`[ai] Gemini failed with unexpected error. Falling back to Groq...`);
    try {
        return await askGroq(prompt, { ...opts, model: 'llama-3.1-70b-versatile' });
    } catch(groqErr) {
        throw new Error(`AI pipeline failed completely. Gemini Err: ${e.message}. Groq Err: ${groqErr.message}`);
    }
  }
}

module.exports = { ask };
