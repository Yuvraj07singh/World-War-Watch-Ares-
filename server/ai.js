// server/ai.js
// ─────────────────────────────────────────────
//  Unified Intelligence Bureau
//  Implements automatic fallback from Gemini to Groq
// ─────────────────────────────────────────────

const { ask: askGemini } = require('./gemini');
const { askGroq } = require('./groq');
const { askPollinations } = require('./pollinations');

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
        return await askGroq(prompt, { ...opts, model: 'llama-3.3-70b-versatile' });
      } catch (groqErr) {
        console.warn(`[ai] Groq failed (${groqErr.message.substring(0, 40)}...). Falling back to Pollinations...`);
        try {
          return await askPollinations(prompt, opts);
        } catch (polyErr) {
          throw new Error(`AI pipeline failed: Gemini, Groq, AND Pollinations are unavailable.`);
        }
      }
    }
    
    // If we want to be hyper-resilient, any Gemini failure could trigger Fallback cascade
    console.warn(`[ai] Gemini failed with unexpected error. Falling back to Groq...`);
    try {
        return await askGroq(prompt, { ...opts, model: 'llama-3.3-70b-versatile' });
    } catch(groqErr) {
        console.warn(`[ai] Groq failed with unexpected error. Falling back to Pollinations...`);
        try {
          return await askPollinations(prompt, opts);
        } catch(polyErr) {
          throw new Error(`AI pipeline failed completely. Gemini: ${e.message}. Groq: ${groqErr.message}`);
        }
    }
  }
}

module.exports = { ask };
