import Groq from 'groq-sdk';
import { buildSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import type { TranslationResult, TranslationService } from './types';
import type { TranslationMode, FormalityLevel } from '@corpo-lingo/shared';

let _client: Groq | null = null;

/**
 * Lazily initialise the Groq client so the app still boots
 * even when GROQ_API_KEY is not yet set (e.g. during tests).
 */
function getClient(): Groq {
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
 * Maps formality level → temperature.
 * Higher formality = less creative output.
 */
function getTemperature(formality: FormalityLevel): number {
  const map: Record<FormalityLevel, number> = { low: 0.2, medium: 0.3, high: 0.4 };
  return map[formality] ?? 0.3;
}

/**
 * Translates text into corporate language using the Groq API.
 */
export async function translateText(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel,
): Promise<TranslationResult> {
  const client = getClient();
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(mode, formality) },
      { role: 'user', content: buildUserMessage(text) },
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
    usage: (completion.usage as unknown as Record<string, number>) || null,
    model,
  };
}

export default { translateText } satisfies TranslationService;