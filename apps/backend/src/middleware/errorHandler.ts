import type { Request, Response, NextFunction } from 'express';

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

function toStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined;
}

function toStatus(err: unknown): number {
  if (err !== null && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e['statusCode'] === 'number') return e['statusCode'];
    if (typeof e['status'] === 'number') return e['status'];
  }
  return 500;
}

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = toMessage(err);
  const isDev = process.env.NODE_ENV === 'development';
  console.error(`[Error] ${message}`);

  if (message.includes('OpenAI')) {
    res.status(502).json({
      success: false,
      error: 'Translation service is temporarily unavailable. Please try again later.',
      detail: isDev ? message : undefined,
    });
    return;
  }

  if (message.includes('API key')) {
    res.status(503).json({
      success: false,
      error: 'Translation service is not configured.',
      detail: isDev ? message : undefined,
    });
    return;
  }

  res.status(toStatus(err)).json({
    success: false,
    error: message,
    detail: isDev ? toStack(err) : undefined,
  });
}