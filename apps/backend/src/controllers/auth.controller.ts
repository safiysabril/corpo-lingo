import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import type { RegisterPayload, LoginPayload, UserProfile } from '@corpo-lingo/shared';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

export function register(req: Request, res: Response): void {
  const { name, email, password } = req.body as RegisterPayload;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already in use.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hash);

  const user: UserProfile = { id: Number(result.lastInsertRowid), name, email };
  const token = jwt.sign({ sub: user.id, email, name }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie(COOKIE_NAME, token, cookieOptions()).status(201).json({ success: true, user });
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body as LoginPayload;

  const row = db
    .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
    .get(email) as UserRow | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  const user: UserProfile = { id: row.id, name: row.name, email: row.email };
  const token = jwt.sign({ sub: user.id, email: row.email, name: row.name }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie(COOKIE_NAME, token, cookieOptions()).status(200).json({ success: true, user });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME).json({ success: true });
}

export function me(req: Request, res: Response): void {
  const { sub, email, name } = (req as AuthenticatedRequest).user;
  res.json({ success: true, user: { id: sub, email, name } });
}
