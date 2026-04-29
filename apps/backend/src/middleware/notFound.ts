import type { Request, Response } from 'express';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${_req.method} ${_req.originalUrl}`,
  });
}