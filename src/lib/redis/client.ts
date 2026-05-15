/**
 * @deprecated Use `getRedisStore()` from `@/lib/redis/store`.
 * Re-exports for backward compatibility.
 */
export { getRedisBackend, getRedisStore, isRedisEnabled } from "@/lib/redis/store";

export async function ensureRedis() {
  const { getRedisStore } = await import("@/lib/redis/store");
  return getRedisStore();
}
