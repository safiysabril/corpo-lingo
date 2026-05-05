import type { Request, Response, NextFunction } from 'express';
import { getTranslationService } from '../services/ai.factory';
import { TRANSLATION_MODES, FORMALITY_LEVELS } from '@corpo-lingo/shared';
import type { TranslatePayload, TranslateResponse } from '@corpo-lingo/shared';

/**
 * POST /api/v1/translate
 * Translates input text into corporate language.
 */
export async function translate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, mode, formality } = req.body as TranslatePayload;

    const service = getTranslationService();
    const { translatedText, usage, model } =
      await service.translateText(text, mode, formality);

    const response: TranslateResponse = {
      success: true,
      data: {
        original: text,
        translated: translatedText,
        mode,
        formality,
      },
      meta: {
        provider: process.env.AI_PROVIDER || 'openai',
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        usage,
        timestamp: new Date().toISOString(),
      },
    };

    // Note: We safely omit llm_request/response from the strict shared type
    // but can still pass it loosely if needed, or stick strictly to the shared type.
    res.status(200).json(response);
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