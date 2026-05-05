import groqService from './groq.service';
import openaiService from './openai.service';
import ollamaService from './ollama.service';
import type { TranslationService } from './types';

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