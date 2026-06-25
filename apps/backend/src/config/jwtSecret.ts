// Single source of truth for the JWT signing secret and its validation, so the
// fallbacks used by sign/verify and the production startup guard can never drift.

const DEV_FALLBACK = 'dev-secret-change-in-production';

// Values that must never be accepted as a real secret in production: the dev
// fallback above and the placeholder shipped in apps/backend/.env.example.
const KNOWN_WEAK_SECRETS = new Set<string>([
  DEV_FALLBACK,
  'change-this-to-a-long-random-secret-in-production',
]);

const MIN_SECRET_LENGTH = 32;

/**
 * True when `secret` is unsafe for production use — unset, a known placeholder,
 * or too short to be a meaningful HMAC key.
 */
export function isWeakJwtSecret(secret: string | undefined): boolean {
  return !secret || KNOWN_WEAK_SECRETS.has(secret) || secret.length < MIN_SECRET_LENGTH;
}

/**
 * The secret used by every jwt sign/verify call. In development it falls back to
 * a fixed dev value so the app boots without setup; in production a weak value is
 * rejected at startup by the `isWeakJwtSecret` guard in server.ts (which runs
 * before `app.listen`), so this fallback is never reached with a real request.
 */
export const JWT_SECRET: string = process.env.JWT_SECRET || DEV_FALLBACK;
