/**
 * Global error handler — catches all errors passed via next(err).
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${err.message}`);

  // OpenAI / external API errors
  if (err.message?.includes('OpenAI')) {
    return res.status(502).json({
      success: false,
      error: 'Translation service is temporarily unavailable. Please try again later.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Config errors
  if (err.message?.includes('API key')) {
    return res.status(503).json({
      success: false,
      error: 'Translation service is not configured.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected error occurred.',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;