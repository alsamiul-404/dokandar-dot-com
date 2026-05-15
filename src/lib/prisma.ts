import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma singleton. `new PrismaClient()` runs on first `getPrisma()` call
 * (not at module load), so `next build` can complete before `prisma generate`.
 *
 * Use Supabase Transaction pooler (port 6543, `pgbouncer=true`) in DATABASE_URL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}
