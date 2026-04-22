const Groq = require('groq-sdk');
const { buildSystemPrompt, buildUserMessage } = require('../utils/promptBuilder');

let _client = null;

/**
 * Lazily initialise the Groq client so the app still boots
 * even when GROQ_API_KEY is not yet set (e.g. during tests).
 */
function getClient() {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Groq API key is not configured. Set GROQ_API_KEY in your .env file.'
      );
    }
    _client = new Groq({ apiKey });
  }
  return _client;
}

/**
 * Recommended Groq models (fast + capable):
 *
 *  llama-3.3-70b-versatile  — best quality, still very fast   (default)
 *  llama-3.1-8b-instant     — ultra-fast, lighter output
 *  mixtral-8x7b-32768       — long-context tasks
 *
 * Override via GROQ_MODEL in .env
 */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Translates text into corporate language using the Groq API.
 *
 * @param {string} text    - The input text to translate.
 * @param {string} mode    - 'email' | 'documentation' | 'formal'
 * @param {string} formality  - 'low' | 'medium' | 'high'
 * @returns {Promise<{ translatedText: string, usage: object, model: string }>}
 */
async function translateText(text, mode, formality) {
  const client = getClient();
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(mode, formality) },
      { role: 'user',   content: buildUserMessage(text) },
    ],
    temperature: getTemperature(formality),
    max_tokens: 1024,
  });

  const translatedText = completion.choices?.[0]?.message?.content?.trim();

  if (!translatedText) {
    throw new Error('Received an empty response from the Groq model.');
  }

  return {
    translatedText,
    usage: completion.usage || null,
    model,                          // expose which model was used
  };
}

/**
 * Maps paraphrase degree → temperature.
 * Higher degree = more creative / buzzword-heavy output.
 */
function getTemperature(formality) {
  const map = { low: 0.2, medium: 0.3, high: 0.4 };
  return map[formality] ?? 0.3;
}

module.exports = { translateText };