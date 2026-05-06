import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { getTranslationService } from '../services/ai.factory';
import { TRANSLATION_MODES, FORMALITY_LEVELS } from '@corpo-lingo/shared';
import type { TranslatePayload, TranslateResponse, TranslationHistoryItem } from '@corpo-lingo/shared';
import type { AuthenticatedRequest } from '../middleware/authenticate';
import pool from '../db';

interface TranslationRow {
  id: string;
  input: string;
  output: string;
  mode: string;
  formality: string;
  created_at: Date;
}

export async function translate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, mode, formality } = req.body as TranslatePayload;
    const userId = (req as AuthenticatedRequest).user?.sub;

    const service = getTranslationService();
    const { translatedText, usage, model } = await service.translateText(text, mode, formality);

    const id = randomUUID();

    if (userId !== undefined) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length > 0) {
        await pool.query(
          'INSERT INTO translations (id, user_id, input, output, mode, formality) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, userId, text, translatedText, mode, formality],
        );
      }
    }

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

export async function deleteHistoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.sub;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM translations WHERE id = $1 AND user_id = $2',
      [id, userId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user.sub;

    const result = await pool.query(
      'SELECT id, input, output, mode, formality, created_at FROM translations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId],
    );

    const history: TranslationHistoryItem[] = result.rows.map((row: TranslationRow) => ({
      id: row.id,
      input: row.input,
      output: row.output,
      mode: row.mode as TranslationHistoryItem['mode'],
      formality: row.formality as TranslationHistoryItem['formality'],
      createdAt: new Date(row.created_at).toISOString(),
    }));

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
