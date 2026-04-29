import { buildSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import type { TranslationResult, TranslationService } from './types';
import type { TranslationMode, FormalityLevel } from '../utils/constants';

const OLLAMA_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Maps formality level → temperature.
 */
function getTemperature(formality: FormalityLevel): number {
  const map: Record<FormalityLevel, number> = { low: 0.2, medium: 0.3, high: 0.4 };
  return map[formality] ?? 0.3;
}

/**
 * Translates text using Ollama (local LLM).
 */
export async function translateText(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel,
): Promise<TranslationResult> {
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
        num_predict: 1024,
      },
      stream: false,
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
    usage: null,
    model: DEFAULT_MODEL,
    ollama_response: data,
    ollama_request: buildSystemPrompt(mode, formality),
  };
}

export default { translateText } satisfies TranslationService;