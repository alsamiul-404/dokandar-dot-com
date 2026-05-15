import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import { normalizeBdPhone } from "@/lib/phone";
import { consumeOtpRedis, storeOtpRedis, verifyOtpRedis } from "@/lib/redis/otp-redis";

const OTP_TTL_MS = 5 * 60 * 1000;
const MOCK_OTP = "123456";

function hashOtpCode(code: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "dokandar-dev-otp";
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

function codesMatch(storedHash: string, code: string): boolean {
  const computed = hashOtpCode(code);
  try {
    return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

/**
 * Generate a 6-digit OTP — Redis (fast) + Postgres (durable fallback).
 */
export async function createAndStoreOtp(normalizedPhone: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const prisma = getPrisma();
  await Promise.all([
    storeOtpRedis(normalizedPhone, code),
    prisma.$transaction([
      prisma.otpChallenge.deleteMany({
        where: { phone: normalizedPhone, consumedAt: null },
      }),
      prisma.otpChallenge.create({
        data: {
          phone: normalizedPhone,
          codeHash: hashOtpCode(code),
          expiresAt,
        },
      }),
    ]),
  ]);

  return code;
}

/**
 * Verify OTP — Redis first, then Postgres. Mock code in dev when allowed.
 */
export async function verifyOtp(
  phone: string,
  otp: string,
  opts?: { consume?: boolean },
): Promise<boolean> {
  const consume = opts?.consume !== false;
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return false;

  const trimmed = otp.trim();
  const mockAllowed =
    process.env.AUTH_ALLOW_MOCK_OTP === "true" || process.env.NODE_ENV !== "production";

  if (mockAllowed && trimmed === (process.env.AUTH_MOCK_OTP_CODE ?? MOCK_OTP)) {
    return true;
  }

  const redisResult = await verifyOtpRedis(normalized, trimmed, consume);
  if (redisResult === true) {
    if (consume) {
      await markOtpConsumedDb(normalized);
    }
    return true;
  }
  if (redisResult === false) {
    return false;
  }

  return verifyOtpDb(normalized, trimmed, consume);
}

async function markOtpConsumedDb(normalizedPhone: string): Promise<void> {
  const prisma = getPrisma();
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone: normalizedPhone,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (challenge) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
  }
}

async function verifyOtpDb(
  normalized: string,
  trimmed: string,
  consume: boolean,
): Promise<boolean> {
  const prisma = getPrisma();
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone: normalized,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true },
  });

  if (!challenge || !codesMatch(challenge.codeHash, trimmed)) {
    return false;
  }

  if (consume) {
    await Promise.all([
      prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
      consumeOtpRedis(normalized),
    ]);
  }

  return true;
}

/** Remove expired OTP rows (Postgres cleanup). */
export async function pruneExpiredOtps(): Promise<void> {
  await getPrisma().otpChallenge.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}
