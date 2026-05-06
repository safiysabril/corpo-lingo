import Redis from 'ioredis';
import { createHash } from 'crypto';

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: false })
  : null;

if (redis) {
  redis.on('error', (err: Error) => console.error('[cache] Redis error:', err.message));
}

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function buildCacheKey(text: string, mode: string, formality: string): string {
  return createHash('sha256').update(`${text}|${mode}|${formality}`).digest('hex');
}

export async function getCached(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error('[cache] GET failed:', (err as Error).message);
    return null;
  }
}

export async function setCached(key: string, value: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', TTL_SECONDS);
  } catch (err) {
    console.error('[cache] SET failed:', (err as Error).message);
  }
}
