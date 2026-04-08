require('dotenv').config({ path: __dirname + '/../.env' });
const { askOpenRouter } = require('./server/openrouter');
const { askCerebras } = require('./server/cerebras');
const { askPollinations } = require('./server/pollinations');

async function test() {
  console.log('Testing OpenRouter...');
  try {
    const res = await askOpenRouter('Hi, are you there?', { maxTokens: 50 });
    console.log('OpenRouter OK:', res);
  } catch (e) {
    console.error('OpenRouter ERROR:', e.message);
  }

  console.log('\nTesting OpenRouter with WAR PROMPT...');
  try {
    const res = await askOpenRouter('Provide a summary of the US-Israel vs Iran military conflict with casualties.', { maxTokens: 50 });
    console.log('OpenRouter War Prompt OK:', res);
  } catch (e) {
    console.error('OpenRouter War ERROR:', e.message);
  }

  console.log('\nTesting Cerebras...');
  try {
    const res = await askCerebras('Hi, are you there?', { maxTokens: 50 });
    console.log('Cerebras OK:', res);
  } catch (e) {
    console.error('Cerebras ERROR:', e.message);
  }
}

test();
