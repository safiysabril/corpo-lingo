import { body, validationResult } from 'express-validator';
import { TRANSLATION_MODES, FORMALITY_LEVELS } from '@corpo-lingo/shared';
import type { Request, Response, NextFunction } from 'express';

export const validateTranslation = [
  body('text')
    .trim()
    .notEmpty().withMessage('text is required.')
    .isString().withMessage('text must be a string.')
    .isLength({ min: 3, max: 5000 }).withMessage('text must be between 3 and 5000 characters.'),

  body('mode')
    .trim()
    .notEmpty().withMessage('mode is required.')
    .isIn(Object.values(TRANSLATION_MODES))
    .withMessage(`mode must be one of: ${Object.values(TRANSLATION_MODES).join(', ')}.`),

  body('formality')
    .trim()
    .notEmpty().withMessage('formality is required.')
    .isIn(Object.values(FORMALITY_LEVELS))
    .withMessage(`formality must be one of: ${Object.values(FORMALITY_LEVELS).join(', ')}.`),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        error: 'Validation failed.',
        details: errors.array().map((e: any) => ({ field: e.path, message: e.msg })),
      });
      return;
    }
    next();
  },
];