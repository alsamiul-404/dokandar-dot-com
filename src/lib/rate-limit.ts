import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { checkRateLimitRedis } from "@/lib/redis/rate-limit-redis";

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Rate limit — Redis (fast) with Postgres fallback when Redis is unavailable.
 */
export async function checkRateLimit(
  bucketKey: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const redisResult = await checkRateLimitRedis(bucketKey, opts);
  if (redisResult !== null) {
    return redisResult;
  }
  return checkRateLimitPostgres(bucketKey, opts);
}

async function checkRateLimitPostgres(
  bucketKey: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const prisma = getPrisma();
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / opts.windowMs) * opts.windowMs);
  const windowEnd = windowStart.getTime() + opts.windowMs;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.rateLimitCounter.findUnique({
      where: { bucketKey },
    });

    if (!existing || existing.windowStart.getTime() !== windowStart.getTime()) {
      await tx.rateLimitCounter.upsert({
        where: { bucketKey },
        create: { bucketKey, windowStart, count: 1 },
        update: { windowStart, count: 1 },
      });
      return { ok: true as const };
    }

    if (existing.count >= opts.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((windowEnd - now) / 1000));
      return { ok: false as const, retryAfterSec };
    }

    await tx.rateLimitCounter.update({
      where: { bucketKey },
      data: { count: { increment: 1 } },
    });
    return { ok: true as const };
  });

  return result;
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}
