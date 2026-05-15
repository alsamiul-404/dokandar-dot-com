import { getRedisStore } from "@/lib/redis/store";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisStore();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
  const redis = await getRedisStore();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), ttlSec);
  } catch {
    /* ignore */
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const redis = await getRedisStore();
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch {
    /* ignore */
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  const redis = await getRedisStore();
  if (!redis) return;
  try {
    await redis.delByPrefix(prefix);
  } catch {
    /* ignore */
  }
}
