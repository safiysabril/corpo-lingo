const { translateText } = require('../services/openai.service');
const { TRANSLATION_MODES, PARAPHRASE_DEGREES } = require('../utils/constants');

/**
 * POST /api/v1/translate
 * Translates input text into corporate language.
 */
async function translate(req, res, next) {
  try {
    const { text, mode, degree } = req.body;

    const { translatedText, usage } = await translateText(text, mode, degree);

    return res.status(200).json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        mode,
        degree,
      },
      meta: {
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