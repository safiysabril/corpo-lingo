import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — catches all errors passed via next(err).
 */
export default function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(`[Error] ${err.message}`);

  // OpenAI / external API errors
  if (err.message?.includes('OpenAI')) {
    res.status(502).json({
      success: false,
      error: 'Translation service is temporarily unavailable. Please try again later.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  // Config errors
  if (err.message?.includes('API key')) {
    res.status(503).json({
      success: false,
      error: 'Translation service is not configured.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return;
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected error occurred.',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}