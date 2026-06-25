import { poolConfig } from '../src/db';

// Verifies the NODE_ENV gating of DB SSL without opening a real connection.
// (Importing ../src/db constructs a pg.Pool, but pg connects lazily, so no
// database is contacted by this test.)
describe('poolConfig — DB SSL gating', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('enables SSL (without cert verification) in production', () => {
    process.env.NODE_ENV = 'production';
    expect(poolConfig().ssl).toEqual({ rejectUnauthorized: false });
  });

  it('disables SSL outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(poolConfig().ssl).toBe(false);
  });
});
