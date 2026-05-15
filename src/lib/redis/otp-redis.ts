import { createHash, timingSafeEqual } from "node:crypto";

import { getRedisStore } from "@/lib/redis/store";

const OTP_TTL_SEC = 5 * 60;

function otpKey(phone: string): string {
  return `dokandar:otp:${phone}`;
}

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

export async function storeOtpRedis(normalizedPhone: string, code: string): Promise<boolean> {
  const redis = await getRedisStore();
  if (!redis) return false;
  try {
    await redis.set(otpKey(normalizedPhone), hashOtpCode(code), OTP_TTL_SEC);
    return true;
  } catch {
    return false;
  }
}

export async function verifyOtpRedis(
  normalizedPhone: string,
  code: string,
  consume: boolean,
): Promise<boolean | null> {
  const redis = await getRedisStore();
  if (!redis) return null;

  try {
    const stored = await redis.get(otpKey(normalizedPhone));
    if (!stored || !codesMatch(stored, code.trim())) {
      return false;
    }
    if (consume) {
      await redis.del(otpKey(normalizedPhone));
    }
    return true;
  } catch {
    return null;
  }
}

export async function consumeOtpRedis(normalizedPhone: string): Promise<void> {
  const redis = await getRedisStore();
  if (!redis) return;
  try {
    await redis.del(otpKey(normalizedPhone));
  } catch {
    /* ignore */
  }
}
