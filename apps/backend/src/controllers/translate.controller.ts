import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { getTranslationService } from '../services/ai.factory';
import { TRANSLATION_MODES, FORMALITY_LEVELS } from '@corpo-lingo/shared';
import type { TranslatePayload, TranslateResponse, TranslationHistoryItem } from '@corpo-lingo/shared';
import type { AuthenticatedRequest } from '../middleware/authenticate';
import db from '../db';

interface TranslationRow {
  id: string;
  input: string;
  output: string;
  mode: string;
  formality: string;
  created_at: string;
}

export async function translate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, mode, formality } = req.body as TranslatePayload;
    const userId = (req as AuthenticatedRequest).user.sub;

    const service = getTranslationService();
    const { translatedText, usage, model } = await service.translateText(text, mode, formality);

    const id = randomUUID();

    db.prepare(
      'INSERT INTO translations (id, user_id, input, output, mode, formality) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, userId, text, translatedText, mode, formality);

    const response: TranslateResponse & { data: { id: string } } = {
      success: true,
      data: {
        id,
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

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export function getOptions(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      modes: Object.values(TRANSLATION_MODES),
      formality: Object.values(FORMALITY_LEVELS),
    },
  });
}

export function deleteHistoryItem(req: Request, res: Response): void {
  const userId = (req as AuthenticatedRequest).user.sub;
  const { id } = req.params;

  const result = db.prepare('DELETE FROM translations WHERE id = ? AND user_id = ?').run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Item not found' });
    return;
  }

  res.status(200).json({ success: true });
}

export function getHistory(req: Request, res: Response): void {
  const userId = (req as AuthenticatedRequest).user.sub;

  const rows = db
    .prepare(
      'SELECT id, input, output, mode, formality, created_at FROM translations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    )
    .all(userId) as TranslationRow[];

  const history: TranslationHistoryItem[] = rows.map((row) => ({
    id: row.id,
    input: row.input,
    output: row.output,
    mode: row.mode as TranslationHistoryItem['mode'],
    formality: row.formality as TranslationHistoryItem['formality'],
    createdAt: row.created_at,
  }));

  res.status(200).json({ success: true, data: history });
}
