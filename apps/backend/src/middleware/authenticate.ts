import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthenticatedRequest extends Request {
  user: { sub: number; email: string; name: string };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = (req as Request & { cookies: Record<string, string> }).cookies?.token;
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; email: string; name: string };
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired session.' });
  }
}
