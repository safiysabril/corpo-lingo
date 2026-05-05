import { buildSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import type { TranslationResult, TranslationService } from './types';
import type { TranslationMode, FormalityLevel } from '@corpo-lingo/shared';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Maps formality level to a temperature value.
 * Higher formality = slightly more creative output.
 */
function getTemperature(formality: FormalityLevel): number {
  const temperatures: Record<FormalityLevel, number> = {
    low: 0.3,
    medium: 0.6,
    high: 0.85,
  };
  return temperatures[formality] ?? 0.6;
}

/**
 * Translates text into corporate language using OpenAI.
 */
export async function translateText(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel,
): Promise<TranslationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in your .env file.');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const systemPrompt = buildSystemPrompt(mode, formality);
  const userMessage = buildUserMessage(text);

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: getTemperature(formality),
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
    const errorBody = await response.json().catch(() => ({})) as { error?: { message?: string } };
    const message = errorBody?.error?.message || `OpenAI API error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: Record<string, number> };
  const translatedText = data.choices?.[0]?.message?.content?.trim();

  if (!translatedText) {
    throw new Error('Received an empty response from the translation model.');
  }

  return {
    translatedText,
    usage: (data.usage as Record<string, number>) ?? null,
    model,
  };
}

export default { translateText } satisfies TranslationService;