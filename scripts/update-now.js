// scripts/update-now.js
require('dotenv').config();
const { runUpdate } = require('../server/updater');

console.log('\nWorld War Watch v2 — Manual Update');
console.log('====================================');
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
  console.error('ERROR: GEMINI_API_KEY not set in .env');
  console.error('Get a FREE key at: https://aistudio.google.com/app/apikey');
  process.exit(1);
}
console.log('Fetching RSS news + generating AI analysis...');
console.log('Takes ~60-90 seconds. Please wait.\n');
runUpdate({ verbose: true })
  .then(log => {
    console.log(log.success ? '\n✓ Done! Start server: npm start' : '\n⚠ Done with errors: ' + log.errors.map(e=>e.key).join(', '));
    process.exit(0);
  })
  .catch(e => { console.error('Fatal:', e.message); process.exit(1); });
