import type { Request, Response, NextFunction } from 'express';
import { getTranslationService } from '../services/ai.factory';
import { TRANSLATION_MODES, FORMALITY_LEVELS } from '../utils/constants';
import type { TranslationMode, FormalityLevel } from '../utils/constants';

/**
 * POST /api/v1/translate
 * Translates input text into corporate language.
 */
export async function translate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, mode, formality } = req.body as {
      text: string;
      mode: TranslationMode;
      formality: FormalityLevel;
    };

    // Resolved at request-time — AI_PROVIDER can be changed without restart
    const service = getTranslationService();
    const { translatedText, usage, model, ollama_response, ollama_request } =
      await service.translateText(text, mode, formality);

    res.status(200).json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        mode,
        formality,
        llm_request: ollama_request,
        llm_response: ollama_response,
      },
      meta: {
        provider: process.env.AI_PROVIDER || 'openai',
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        usage,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/translate/options
 * Returns all valid modes and formality levels for the frontend to consume dynamically.
 */
export function getOptions(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      modes: Object.values(TRANSLATION_MODES),
      formality: Object.values(FORMALITY_LEVELS),
    },
  });
}