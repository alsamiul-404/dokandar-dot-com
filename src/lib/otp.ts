import { randomInt } from "node:crypto";

import { normalizeBdPhone } from "@/lib/phone";

const OTP_TTL_MS = 5 * 60 * 1000;
const MOCK_OTP = "123456";

type OtpRecord = { code: string; expiresAt: number };

const globalForOtp = globalThis as unknown as {
  __dokandarOtpStore?: Map<string, OtpRecord>;
};

function getStore(): Map<string, OtpRecord> {
  if (!globalForOtp.__dokandarOtpStore) {
    globalForOtp.__dokandarOtpStore = new Map();
  }
  return globalForOtp.__dokandarOtpStore;
}

function pruneExpired(store: Map<string, OtpRecord>) {
  const now = Date.now();
  for (const k of Array.from(store.keys())) {
    const v = store.get(k);
    if (v && v.expiresAt <= now) store.delete(k);
  }
}

/**
 * Generate a 6-digit OTP and store it for `phone` (must already be normalized).
 */
export function createAndStoreOtp(normalizedPhone: string): string {
  const store = getStore();
  pruneExpired(store);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  store.set(normalizedPhone, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

/**
 * Returns true when `otp` is valid for `phone` (any raw form accepted; normalized internally).
 * - In non-production, or when `AUTH_ALLOW_MOCK_OTP=true`, the fixed mock code matches.
 * - Otherwise only a non-expired stored OTP matches. When `consume` is true (default), a
 *   successful stored OTP is removed so it cannot be reused.
 */
export function verifyOtp(
  phone: string,
  otp: string,
  opts?: { consume?: boolean },
): boolean {
  const consume = opts?.consume !== false;
  const normalized = normalizeBdPhone(phone);
  if (!normalized) return false;

  const trimmed = otp.trim();
  const mockAllowed =
    process.env.AUTH_ALLOW_MOCK_OTP === "true" || process.env.NODE_ENV !== "production";

  if (mockAllowed && trimmed === (process.env.AUTH_MOCK_OTP_CODE ?? MOCK_OTP)) {
    return true;
  }

  const store = getStore();
  const rec = store.get(normalized);
  if (!rec || rec.expiresAt <= Date.now()) {
    return false;
  }
  if (rec.code !== trimmed) {
    return false;
  }
  if (consume) {
    store.delete(normalized);
  }
  return true;
}
