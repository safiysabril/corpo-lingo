import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import pool from '../db';
import type { RegisterPayload, LoginPayload, UserProfile } from '@corpo-lingo/shared';
import type { AuthenticatedRequest } from '../middleware/authenticate';
import { sendPasswordResetEmail } from '../services/email.service';
import { OAuth2Client } from 'google-auth-library';
import { JWT_SECRET } from '../config/jwtSecret';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const googleOAuthClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'postmessage', // popup auth-code flow returns the code to the browser JS
});

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
  password_hash: string | null;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as RegisterPayload;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ success: false, error: 'Email already in use.' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, hash],
  );

  const user: UserProfile = { id: result.rows[0].id, name, email };
  const token = jwt.sign({ sub: user.id, email, name }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });

  res.cookie(COOKIE_NAME, token, cookieOptions()).status(201).json({ success: true, user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginPayload;

  const result = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email],
  );
  const row = result.rows[0] as UserRow | undefined;

  if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  const user: UserProfile = { id: row.id, name: row.name, email: row.email };
  const token = jwt.sign({ sub: user.id, email: row.email, name: row.name }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });

  res.cookie(COOKIE_NAME, token, cookieOptions()).status(200).json({ success: true, user });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ success: false, error: 'Missing Google authorization code.' });
    return;
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(503).json({ success: false, error: 'Google sign-in is not configured.' });
    return;
  }

  // Exchange the authorization code for tokens server-side. This call uses the
  // client secret, which never leaves the backend. Then verify the returned ID
  // token (signature, audience, expiry, issuer) to read the user's profile.
  let payload;
  try {
    const { tokens } = await googleOAuthClient.getToken({ code, redirect_uri: 'postmessage' });
    if (!tokens.id_token) throw new Error('No ID token in Google token response.');
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ success: false, error: 'Google sign-in failed.' });
    return;
  }

  if (!payload?.email || !payload.sub) {
    res.status(401).json({ success: false, error: 'Google account is missing required profile fields.' });
    return;
  }
  if (payload.email_verified === false) {
    res.status(401).json({ success: false, error: 'Your Google email address is not verified.' });
    return;
  }

  const googleSub = payload.sub;
  const email = payload.email;
  const name = payload.name || email.split('@')[0];

  // Match by Google id, else by email (links Google to an existing password
  // account), else create a new passwordless account.
  let row = (await pool.query('SELECT id, name, email FROM users WHERE google_sub = $1', [googleSub]))
    .rows[0] as { id: number; name: string; email: string } | undefined;

  if (!row) {
    const byEmail = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (byEmail.rows[0]) {
      await pool.query('UPDATE users SET google_sub = $1 WHERE id = $2', [googleSub, byEmail.rows[0].id]);
      row = byEmail.rows[0];
    } else {
      const created = await pool.query(
        'INSERT INTO users (name, email, google_sub) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, googleSub],
      );
      row = created.rows[0];
    }
  }

  const user: UserProfile = { id: row!.id, name: row!.name, email: row!.email };
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });

  res.cookie(COOKIE_NAME, token, cookieOptions()).status(200).json({ success: true, user });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME).json({ success: true });
}

export function me(req: Request, res: Response): void {
  const { sub, email, name } = (req as AuthenticatedRequest).user;
  res.json({ success: true, user: { id: sub, email, name } });
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
  const user = result.rows[0] as { id: number; name: string } | undefined;

  // Always respond 200 — prevents email enumeration attacks
  if (!user) {
    res.json({ success: true });
    return;
  }

  // Invalidate any previous unused tokens for this user
  await pool.query(
    'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
    [user.id],
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt],
  );

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail(email, user.name, resetUrl);

  res.json({ success: true });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string };

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await pool.query(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash],
  );
  const row = result.rows[0] as { id: number; user_id: number } | undefined;

  if (!row) {
    res.status(400).json({ success: false, error: 'This reset link is invalid or has expired.' });
    return;
  }

  const newHash = await bcrypt.hash(password, 12);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, row.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

  res.json({ success: true });
}
