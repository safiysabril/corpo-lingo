const { MODE_DESCRIPTIONS, FORMALITY_DESCRIPTIONS } = require('./constants');

/**
 * Builds the system prompt for the AI model based on mode and degree.
 */
// function buildSystemPrompt(mode, degree) {
//   const modeDesc = MODE_DESCRIPTIONS[mode];
//   const degreeDesc = DEGREE_DESCRIPTIONS[degree];

//   return `You are an expert corporate language translator. Your sole task is to rewrite informal or casual text into polished corporate language suitable for ${modeDesc}.

// Paraphrasing intensity: ${degreeDesc}.

// Rules:
// - Return ONLY the translated text. No explanations, no preamble, no meta-commentary.
// - Preserve the core meaning and intent of the original text.
// - Do NOT add information that wasn't implied in the original.
// - Match the formatting context: ${getFormatGuidance(mode)}
// - Apply the correct intensity level precisely — do not over-corporatize for "few", do not under-corporatize for "high".`;
// }

function buildSystemPrompt(mode, formality) {
  return `
You are a corporate writing assistant.

Your task is to rewrite user input based on:
- Mode: ${mode}
- Formality level: ${formality} 

General Rules:
- Preserve the original meaning exactly
- Do NOT add new information
- Do NOT hallucinate context
- Avoid unnecessary buzzwords (e.g., leverage, synergy, utilize)
- Keep language clear, natural, and professional

Selected Formality Level Definitions:
${getFormalityRules(formality)}

Mode Rules:
${getModeRules(mode)}

Output Rules:
- Return ONLY the rewritten text
- No explanations
- No meta commentary
`;
}

// function getFormatGuidance(mode) {
//   switch (mode) {
//     case 'email':
//       return 'Use email-appropriate salutations and sign-offs if the text implies them. Keep paragraphs concise.';
//     case 'documentation':
//       return 'Use clear, structured prose. Prefer active voice. Use numbered or bulleted lists if the input implies a sequence or list.';
//     case 'formal':
//       return 'Use formal sentence structure. Avoid contractions. Employ executive-level vocabulary.';
//     default:
//       return 'Use professional business language.';
//   }
// }


function getModeRules(mode) {
  switch (mode) {
    case 'email':
      return `
- email:
  - Must include greeting and closing e.g. "Hi team," and "Best regards"
  - Conversational but professional`;

    case 'formal':
      return `
- formal:
  - No greeting or closing
  - Neutral professional tone
  - Clean sentence structure`;

    case 'documentation':
      return `
- documentation:
  - Instructional or descriptive
  - No conversational tone
  - Direct and concise`;

    default:
      return '';
  }
}

function getFormalityRules(formality) {
  switch (formality) {
    case 'low':
      return `
- low:
  - Light improvement only
  - Minimal wording changes
  - Slightly more polite than original`;

    case 'medium':
      return `
- medium:
  - Clearly professional and polite
  - Smooth phrasing
  - Suitable for workplace communication`;

    case 'high':
      return `
- high:
  - Highly formal and structured
  - Very polite and refined
  - No slang or casual tone
  - Still natural (avoid exaggerated corporate jargon)`;

    default:
      return '';
  }
}

/**
 * Builds the user message sent to the model.
 */
function buildUserMessage(text) {
  return `Translate the following text into corporate language:\n\n"${text}"`;
}

module.exports = { buildSystemPrompt, buildUserMessage };
