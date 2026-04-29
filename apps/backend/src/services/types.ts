import type { TranslationMode, FormalityLevel } from '../utils/constants';

/** Shape returned by all AI translation services */
export interface TranslationResult {
  translatedText: string;
  usage: Record<string, number> | null;
  model: string;
  ollama_response?: unknown;
  ollama_request?: string;
}

/** Interface that every AI service must implement */
export interface TranslationService {
  translateText(text: string, mode: TranslationMode, formality: FormalityLevel): Promise<TranslationResult>;
}
