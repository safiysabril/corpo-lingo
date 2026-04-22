const { body, validationResult } = require('express-validator');
const { TRANSLATION_MODES, FORMALITY_LEVELS } = require('../utils/constants');

const validateTranslation = [
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

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed.',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];

module.exports = { validateTranslation };