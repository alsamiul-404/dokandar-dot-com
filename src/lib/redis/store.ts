/**
 * Cloud-first Redis abstraction.
 * Priority: Upstash REST (Vercel/serverless) → REDIS_URL TCP (Redis Cloud, etc.)
 */

export type RedisStore = {
  ping(): Promise<boolean>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSec: number): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
};

const globalForStore = globalThis as unknown as {
  redisStore: RedisStore | null | undefined;
  redisDisabled: boolean | undefined;
};

export type RedisBackend = "upstash" | "ioredis" | "none";

export function getRedisBackend(): RedisBackend {
  if (process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    return "upstash";
  }
  if (process.env.REDIS_URL?.trim()) {
    return "ioredis";
  }
  return "none";
}

export function isRedisEnabled(): boolean {
  return getRedisBackend() !== "none" && globalForStore.redisDisabled !== true;
}

export async function getRedisStore(): Promise<RedisStore | null> {
  if (globalForStore.redisDisabled) return null;
  if (globalForStore.redisStore) return globalForStore.redisStore;

  const backend = getRedisBackend();
  if (backend === "none") return null;

  try {
    const store =
      backend === "upstash"
        ? (await import("@/lib/redis/upstash-store")).createUpstashStore()
        : (await import("@/lib/redis/ioredis-store")).createIoredisStore();

    const ok = await store.ping();
    if (!ok) {
      globalForStore.redisDisabled = true;
      return null;
    }

    globalForStore.redisStore = store;
    return store;
  } catch (e) {
    globalForStore.redisDisabled = true;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[redis] init failed:", e instanceof Error ? e.message : e);
    }
    return null;
  }
}
