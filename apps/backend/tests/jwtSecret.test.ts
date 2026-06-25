import { isWeakJwtSecret } from '../src/config/jwtSecret';

// Pure-function unit test for the production JWT-secret guard (server.ts uses
// isWeakJwtSecret to fail fast at startup). No env or DB needed.
describe('isWeakJwtSecret', () => {
  it('rejects an unset or empty secret', () => {
    expect(isWeakJwtSecret(undefined)).toBe(true);
    expect(isWeakJwtSecret('')).toBe(true);
  });

  it('rejects the known placeholder values', () => {
    expect(isWeakJwtSecret('dev-secret-change-in-production')).toBe(true);
    // the value shipped in apps/backend/.env.example (49 chars — caught by the
    // known-weak set, not the length check)
    expect(isWeakJwtSecret('change-this-to-a-long-random-secret-in-production')).toBe(true);
  });

  it('rejects secrets shorter than 32 characters', () => {
    expect(isWeakJwtSecret('short')).toBe(true);
    expect(isWeakJwtSecret('a'.repeat(31))).toBe(true);
  });

  it('accepts a strong, unique secret of 32+ characters', () => {
    expect(isWeakJwtSecret('a'.repeat(32))).toBe(false);
    expect(isWeakJwtSecret('S0me-Really-Long-Random-Secret-Value-123456')).toBe(false);
  });
});
