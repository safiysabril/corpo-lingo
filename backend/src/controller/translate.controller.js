const { getTranslationService } = require('../services/ai.factory');
const { TRANSLATION_MODES, PARAPHRASE_DEGREES } = require('../utils/constants');

/**
 * POST /api/v1/translate
 * Translates input text into corporate language.
 */
async function translate(req, res, next) {
  try {
    const { text, mode, degree } = req.body;

    // Resolved at request-time — AI_PROVIDER can be changed without restart
    const { translateText } = getTranslationService();
    const { translatedText, usage, model } = await translateText(text, mode, degree);

    return res.status(200).json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        mode,
        degree,
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
 * Returns all valid modes and degrees for the frontend to consume dynamically.
 */
function getOptions(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      modes: Object.values(TRANSLATION_MODES),
      degrees: Object.values(PARAPHRASE_DEGREES),
    },
  });
}

module.exports = { translate, getOptions };