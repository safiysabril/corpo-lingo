const { buildSystemPrompt, buildUserMessage } = require('../utils/promptBuilder');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Translates text into corporate language using OpenAI.
 *
 * @param {string} text     - The input text to translate.
 * @param {string} mode     - Translation mode: 'email' | 'documentation' | 'formal'
 * @param {string} degree   - Paraphrasing degree: 'few' | 'moderate' | 'high'
 * @returns {Promise<{ translatedText: string, usage: object }>}
 */
async function translateText(text, mode, degree) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in your .env file.');
  }

  const systemPrompt = buildSystemPrompt(mode, degree);
  const userMessage = buildUserMessage(text);

  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: getTemperature(degree),
    max_tokens: 1024,
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `OpenAI API error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const translatedText = data.choices?.[0]?.message?.content?.trim();

  if (!translatedText) {
    throw new Error('Received an empty response from the translation model.');
  }

  return {
    translatedText,
    usage: data.usage || null,
  };
}

/**
 * Maps paraphrase degree to a temperature value.
 * Higher degree = slightly more creative output.
 */
function getTemperature(degree) {
  const temperatures = {
    few: 0.3,
    moderate: 0.6,
    high: 0.85,
  };
  return temperatures[degree] ?? 0.6;
}

module.exports = { translateText };