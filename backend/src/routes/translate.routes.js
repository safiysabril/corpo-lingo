const express = require('express');
const router = express.Router();

const { translate, getOptions } = require('../controllers/translate.controller');
const { validateTranslation } = require('../middleware/validate');

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

module.exports = router;