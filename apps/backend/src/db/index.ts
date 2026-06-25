import { Pool, type PoolConfig } from 'pg';

// Exported so the SSL gating can be unit-tested without opening a connection.
// In production we connect over SSL (rejectUnauthorized:false suits managed
// Postgres with self-signed certs); locally SSL is off.
export function poolConfig(): PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig());

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function initDb(): Promise<void> {
  const maxRetries = 12;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_sub    TEXT UNIQUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Migrate pre-existing databases (CREATE TABLE IF NOT EXISTS won't alter):
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;

    CREATE TABLE IF NOT EXISTS translations (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      input      TEXT NOT NULL,
      output     TEXT NOT NULL,
      mode       TEXT NOT NULL,
      formality  TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_translations_user_id ON translations(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prt_hash ON password_reset_tokens(token_hash);
      `);
      console.log('Database initialized successfully');
      return;
    } catch (err) {
      if (attempt < maxRetries) {
        console.error(`DB connection attempt ${attempt}/${maxRetries} failed: ${(err as Error).message}`);
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await sleep(delayMs);
      } else {
        throw err;
      }
    }
  }
}

export default pool;
