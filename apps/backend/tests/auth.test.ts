import request from 'supertest';

// Mock the DB so register doesn't need a real Postgres. The pg Pool's `query`
// is a jest.fn we drive per-test.
jest.mock('../src/db', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  initDb: jest.fn(),
  poolConfig: jest.fn(),
}));

import pool from '../src/db';
import app from '../src/app';

const query = pool.query as unknown as jest.Mock;

describe('auth cookie flags', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    query.mockReset();
  });

  // register() runs: SELECT (email free) -> INSERT ... RETURNING id
  function mockSuccessfulRegister(id: number) {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id }] });
  }

  it('sets a Secure, HttpOnly, SameSite=Lax cookie in production', async () => {
    process.env.NODE_ENV = 'production';
    mockSuccessfulRegister(1);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Prod User', email: 'prod@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie).toBeDefined();
    const tokenCookie = setCookie[0];
    expect(tokenCookie).toMatch(/^token=/);
    expect(tokenCookie).toMatch(/;\s*HttpOnly/i);
    expect(tokenCookie).toMatch(/;\s*Secure/i);
    expect(tokenCookie).toMatch(/;\s*SameSite=Lax/i);
  });

  it('omits Secure on the cookie in development (still HttpOnly)', async () => {
    process.env.NODE_ENV = 'development';
    mockSuccessfulRegister(2);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Dev User', email: 'dev@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    const tokenCookie = (res.headers['set-cookie'] as unknown as string[])[0];
    expect(tokenCookie).toMatch(/;\s*HttpOnly/i);
    expect(tokenCookie).not.toMatch(/;\s*Secure/i);
  });
});
