const { body, validationResult } = require('express-validator');
const { TRANSLATION_MODES, PARAPHRASE_DEGREES } = require('../utils/constants');

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

  body('degree')
    .trim()
    .notEmpty().withMessage('degree is required.')
    .isIn(Object.values(PARAPHRASE_DEGREES))
    .withMessage(`degree must be one of: ${Object.values(PARAPHRASE_DEGREES).join(', ')}.`),

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