import Redis from "ioredis";

import type { RedisStore } from "@/lib/redis/store";

export function createIoredisStore(): RedisStore {
  const url = process.env.REDIS_URL!.trim();
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 8_000,
    commandTimeout: 5_000,
    tls: url.startsWith("rediss://") ? {} : undefined,
  });

  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[redis/ioredis]", err.message);
    }
  });

  async function ensureConnected(): Promise<void> {
    if (client.status !== "ready") {
      await client.connect();
    }
  }

  return {
    async ping() {
      try {
        await ensureConnected();
        return (await client.ping()) === "PONG";
      } catch {
        return false;
      }
    },

    async get(key) {
      await ensureConnected();
      return client.get(key);
    },

    async set(key, value, ttlSec) {
      await ensureConnected();
      await client.set(key, value, "EX", ttlSec);
    },

    async del(...keys) {
      if (keys.length === 0) return;
      await ensureConnected();
      await client.del(...keys);
    },

    async incr(key) {
      await ensureConnected();
      return client.incr(key);
    },

    async expire(key, ttlSec) {
      await ensureConnected();
      await client.expire(key, ttlSec);
    },

    async delByPrefix(prefix) {
      await ensureConnected();
      let cursor = "0";
      do {
        const [next, keys] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        cursor = next;
        if (keys.length > 0) await client.del(...keys);
      } while (cursor !== "0");
    },
  };
}
