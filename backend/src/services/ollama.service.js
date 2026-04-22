const { buildSystemPrompt, buildUserMessage } = require('../utils/promptBuilder');

const OLLAMA_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Translates text using Ollama (local LLM).
 */
async function translateText(text, mode, formality) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(mode, formality) },
        { role: 'user', content: buildUserMessage(text) },
      ],
      options: {
        temperature: getTemperature(formality),
        num_predict: 1024, // similar to max_tokens
      },
      stream: false, // important: get full response
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status}`);
  }

  const data = await res.json();

  const translatedText = data?.message?.content?.trim();

  if (!translatedText) {
    throw new Error('Empty response from Ollama model.');
  }

  return {
    translatedText,
    usage: null, // Ollama doesn’t return token usage by default
    model: DEFAULT_MODEL,
    ollama_response: data, // include full response for debugging
    ollama_request: buildSystemPrompt(mode, formality), // include request body for debugging
  };
}

function getTemperature(formality) {
  const map = { low: 0.2, medium: 0.3, high: 0.4 };
  return map[formality] ?? 0.3;
}

module.exports = { translateText };