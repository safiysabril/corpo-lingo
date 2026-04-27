/**
 * Translation modes — determines the context/format of corporate output.
 */
const TRANSLATION_MODES = {
  EMAIL: 'email',
  DOCUMENTATION: 'documentation',
  FORMAL: 'formal',
};

/**
 * Paraphrasing degrees — how aggressively the text is corporatized.
 */
// const PARAPHRASE_DEGREES = {
//   FEW: 'few',
//   MODERATE: 'moderate',
//   HIGH: 'high',
// };

const MODE_DESCRIPTIONS = {
  [TRANSLATION_MODES.EMAIL]: 'professional business email communication',
  [TRANSLATION_MODES.DOCUMENTATION]: 'technical documentation and internal reports',
  [TRANSLATION_MODES.FORMAL]: 'formal corporate communications, memos, and presentations',
};

// const DEGREE_DESCRIPTIONS = {
//   [PARAPHRASE_DEGREES.FEW]: 'light corporate polish — keep most of the original tone, just tighten the language',
//   [PARAPHRASE_DEGREES.MODERATE]: 'moderate corporatization — professional tone with standard business vocabulary',
//   [PARAPHRASE_DEGREES.HIGH]: 'maximum corporatization — heavy use of buzzwords, synergy-speak, and executive jargon',
// };

const FORMALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

const FORMALITY_DESCRIPTIONS = {
  low: 'Light improvement with minimal wording changes',
  medium: 'Professional and polite with smooth phrasing',
  high: 'Highly formal, structured, and refined language',
};

module.exports = {
  TRANSLATION_MODES,
  // PARAPHRASE_DEGREES,
  MODE_DESCRIPTIONS,
  FORMALITY_LEVELS,
  FORMALITY_DESCRIPTIONS,
  // DEGREE_DESCRIPTIONS,
};