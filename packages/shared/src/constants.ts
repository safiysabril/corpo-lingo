/**
 * Translation modes — determines the context/format of corporate output.
 */
export const TRANSLATION_MODES = {
  EMAIL: 'email',
  DOCUMENTATION: 'documentation',
  FORMAL: 'formal',
} as const;

export type TranslationMode = typeof TRANSLATION_MODES[keyof typeof TRANSLATION_MODES];

export const MODE_DESCRIPTIONS: Record<TranslationMode, string> = {
  [TRANSLATION_MODES.EMAIL]: 'professional business email communication',
  [TRANSLATION_MODES.DOCUMENTATION]: 'technical documentation and internal reports',
  [TRANSLATION_MODES.FORMAL]: 'formal corporate communications, memos, and presentations',
};

/**
 * Formality levels — how aggressively the text is corporatized.
 */
export const FORMALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type FormalityLevel = typeof FORMALITY_LEVELS[keyof typeof FORMALITY_LEVELS];

export const FORMALITY_DESCRIPTIONS: Record<FormalityLevel, string> = {
  low: 'Light improvement with minimal wording changes',
  medium: 'Professional and polite with smooth phrasing',
  high: 'Highly formal, structured, and refined language',
};
