const { MODE_DESCRIPTIONS, DEGREE_DESCRIPTIONS } = require('./constants');

/**
 * Builds the system prompt for the AI model based on mode and degree.
 */
function buildSystemPrompt(mode, degree) {
  const modeDesc = MODE_DESCRIPTIONS[mode];
  const degreeDesc = DEGREE_DESCRIPTIONS[degree];

  return `You are an expert corporate language translator. Your sole task is to rewrite informal or casual text into polished corporate language suitable for ${modeDesc}.

Paraphrasing intensity: ${degreeDesc}.

Rules:
- Return ONLY the translated text. No explanations, no preamble, no meta-commentary.
- Preserve the core meaning and intent of the original text.
- Do NOT add information that wasn't implied in the original.
- Match the formatting context: ${getFormatGuidance(mode)}
- Apply the correct intensity level precisely — do not over-corporatize for "few", do not under-corporatize for "high".`;
}

function getFormatGuidance(mode) {
  switch (mode) {
    case 'email':
      return 'Use email-appropriate salutations and sign-offs if the text implies them. Keep paragraphs concise.';
    case 'documentation':
      return 'Use clear, structured prose. Prefer active voice. Use numbered or bulleted lists if the input implies a sequence or list.';
    case 'formal':
      return 'Use formal sentence structure. Avoid contractions. Employ executive-level vocabulary.';
    default:
      return 'Use professional business language.';
  }
}

/**
 * Builds the user message sent to the model.
 */
function buildUserMessage(text) {
  return `Translate the following text into corporate language:\n\n"${text}"`;
}

module.exports = { buildSystemPrompt, buildUserMessage };
