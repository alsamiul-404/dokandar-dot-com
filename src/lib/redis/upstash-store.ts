import { Redis } from "@upstash/redis";

import type { RedisStore } from "@/lib/redis/store";

export function createUpstashStore(): RedisStore {
  const client = Redis.fromEnv();

  return {
    async ping() {
      try {
        const pong = await client.ping();
        return pong === "PONG";
      } catch {
        return false;
      }
    },

    async get(key) {
      const val = await client.get<string>(key);
      return val ?? null;
    },

    async set(key, value, ttlSec) {
      await client.set(key, value, { ex: ttlSec });
    },

    async del(...keys) {
      if (keys.length === 0) return;
      await client.del(...keys);
    },

    async incr(key) {
      return client.incr(key);
    },

    async expire(key, ttlSec) {
      await client.expire(key, ttlSec);
    },

    async delByPrefix(prefix) {
      let cursor = 0;
      do {
        const result = await client.scan(cursor, {
          match: `${prefix}*`,
          count: 100,
        });
        cursor = Number(result[0]);
        const keys = result[1] as string[];
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== 0);
    },
  };
}
