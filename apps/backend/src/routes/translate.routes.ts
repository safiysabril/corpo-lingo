import { Router } from 'express';
import { translate, getOptions } from '../controllers/translate.controller';
import { validateTranslation } from '../middleware/validate';

const router: Router = Router();

/**
 * GET /api/v1/translate/options
 * Returns all valid modes and formality levels.
 */
router.get('/options', getOptions);

/**
 * POST /api/v1/translate
 * Translates text to corporate language.
 *
 * Body:
 *  {
 *    "text": "string",        // Required. The text to translate (3–5000 chars).
 *    "mode": "email" | "documentation" | "formal",    // Required.
 *    "formality": "low" | "medium" | "high"            // Required.
 *  }
 */
router.post('/', validateTranslation, translate);

export default router;