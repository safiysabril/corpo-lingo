import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

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
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
