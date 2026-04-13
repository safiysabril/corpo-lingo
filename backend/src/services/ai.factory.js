/**
 * AI Provider Factory
 *
 * Resolves the correct translation service based on the AI_PROVIDER
 * environment variable. Adding a new provider = add one case here.
 *
 * Supported values:
 *   openai  (default)
 *   groq
 */
function getTranslationService() {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  switch (provider) {
    case 'groq':
      return require('./groq.service');

    case 'openai':
      return require('./openai.service');

    default:
      throw new Error(
        `Unknown AI_PROVIDER "${provider}". Valid options: openai, groq`
      );
  }
}

module.exports = { getTranslationService };