import groqService from './groq.service';
import openaiService from './openai.service';
import ollamaService from './ollama.service';
import type { TranslationService, TranslationResult } from './types';
import type { TranslationMode, FormalityLevel } from '@corpo-lingo/shared';

const providers: Record<string, TranslationService> = {
  groq: groqService,
  openai: openaiService,
  ollama: ollamaService,
};

export function getTranslationService(): TranslationService {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const service = providers[provider];

  if (!service) {
    throw new Error(
      `Unknown AI_PROVIDER "${provider}". Valid options: ${Object.keys(providers).join(', ')}`
    );
  }

  return service;
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (e.status === 429) return true;
    if (typeof e.message === 'string' && /rate.?limit|429|quota exceeded/i.test(e.message)) return true;
  }
  return false;
}

export async function translateWithFallback(
  text: string,
  mode: TranslationMode,
  formality: FormalityLevel,
): Promise<TranslationResult> {
  const primary = getTranslationService();

  try {
    return await primary.translateText(text, mode, formality);
  } catch (primaryError) {
    const fallbackName = process.env.FALLBACK_PROVIDER?.toLowerCase();
    const fallback = fallbackName ? providers[fallbackName] : null;

    if (!fallback || !isRateLimitError(primaryError)) {
      throw primaryError;
    }

    console.warn(`[ai.factory] Primary provider rate-limited, trying fallback: ${fallbackName}`);
    return await fallback.translateText(text, mode, formality);
  }
}