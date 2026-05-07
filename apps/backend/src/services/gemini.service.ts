import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import type { TranslationResult, TranslationService } from './types';
import type { TranslationMode, FormalityLevel } from '@corpo-lingo/shared';

let _client: GoogleGenAI | null = null;

/**
 * Lazily initialise the Gemini client so the app still boots
 * even when GEMINI_API_KEY is not yet set (e.g. during tests).
 */
function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.'
      );
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * Recommended Gemini models:
 *
 *  gemini-2.0-flash   — fast, cost-effective   (default)
 *  gemini-2.5-pro     — highest quality
 *  gemini-1.5-flash   — lightweight, very fast
 *
 * Override via GEMINI_MODEL in .env
 */
const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Maps formality level → temperature.
 * Higher formality = less creative output.
 */
function getTemperature(formality: FormalityLevel): number {
  const map: Record<FormalityLevel, number> = { low: 0.2, medium: 0.3, high: 0.4 };
  return map[formality] ?? 0.3;
}

/**
 * Translates text into corporate language using the Gemini API.
 */
export async function translateText(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel,
): Promise<TranslationResult> {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const response = await client.models.generateContent({
    model,
    contents: buildUserMessage(text),
    config: {
      systemInstruction: buildSystemPrompt(mode, formality),
      temperature: getTemperature(formality),
      maxOutputTokens: 1024,
    },
  });

  const translatedText = response.text?.trim();

  if (!translatedText) {
    throw new Error('Received an empty response from the Gemini model.');
  }

  const meta = response.usageMetadata;
  const usage: Record<string, number> | null = meta
    ? {
        prompt_tokens: meta.promptTokenCount ?? 0,
        completion_tokens: meta.candidatesTokenCount ?? 0,
        total_tokens: meta.totalTokenCount ?? 0,
      }
    : null;

  return {
    translatedText,
    usage,
    model,
  };
}

export default { translateText } satisfies TranslationService;
