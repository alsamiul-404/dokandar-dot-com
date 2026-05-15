import type { RateLimitOptions, RateLimitResult } from "@/lib/rate-limit";
import { getRedisStore } from "@/lib/redis/store";

export async function checkRateLimitRedis(
  bucketKey: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const redis = await getRedisStore();
  if (!redis) return null;

  const windowId = Math.floor(Date.now() / opts.windowMs);
  const key = `dokandar:rl:${bucketKey}:${windowId}`;
  const ttlSec = Math.ceil(opts.windowMs / 1000);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttlSec);
    }

    if (count > opts.limit) {
      const windowEnd = (windowId + 1) * opts.windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000));
      return { ok: false, retryAfterSec };
    }
    return { ok: true };
  } catch {
    return null;
  }
}
