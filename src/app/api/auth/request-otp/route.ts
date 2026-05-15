import { jsonResponse } from "@/lib/api/json-response";
import { getPrisma } from "@/lib/prisma";
import { createAndStoreOtp, pruneExpiredOtps } from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { dispatchOtpSms } from "@/lib/queue/publish";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { requestOtpBodySchema } from "@/lib/validations/auth";
import { zodFirstError } from "@/lib/validations/common";

const OTP_PHONE_LIMIT = 5;
const OTP_PHONE_WINDOW_MS = 15 * 60 * 1000;
const OTP_IP_LIMIT = 30;
const OTP_IP_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = requestOtpBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const phone = normalizeBdPhone(parsed.data.phone);
  if (!phone) {
    return jsonResponse(
      { error: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন" },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const [phoneRl, ipRl] = await Promise.all([
    checkRateLimit(`otp:phone:${phone}`, {
      limit: OTP_PHONE_LIMIT,
      windowMs: OTP_PHONE_WINDOW_MS,
    }),
    checkRateLimit(`otp:ip:${ip}`, { limit: OTP_IP_LIMIT, windowMs: OTP_IP_WINDOW_MS }),
  ]);

  if (!phoneRl.ok) return rateLimitResponse(phoneRl.retryAfterSec);
  if (!ipRl.ok) return rateLimitResponse(ipRl.retryAfterSec);

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (parsed.data.intent === "login" && !existing) {
    return jsonResponse({ error: "এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status: 404 });
  }
  if (parsed.data.intent === "signup" && existing) {
    return jsonResponse(
      { error: "এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে" },
      { status: 409 },
    );
  }

  void pruneExpiredOtps();
  const code = await createAndStoreOtp(phone);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(
      `[auth/otp] ${phone} OTP=${code} (mock ${process.env.AUTH_MOCK_OTP_CODE ?? "123456"} when allowed)`,
    );
  }

  const sms = await dispatchOtpSms(phone, code);

  if (!sms.skipped && !sms.sent) {
    return jsonResponse(
      { error: sms.error ?? "এসএমএস পাঠানো যায়নি" },
      { status: 502 },
    );
  }

  return jsonResponse({
    ok: true,
    smsSent: sms.sent,
    smsQueued: sms.queued,
    smsSkipped: sms.skipped,
  });
}
