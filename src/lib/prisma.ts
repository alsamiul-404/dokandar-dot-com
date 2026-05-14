import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma singleton. `new PrismaClient()` runs on first `getPrisma()` call
 * (not at module load), so `next build` can complete before `prisma generate`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}
