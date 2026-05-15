import { randomBytes } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api/json-response";
import { hashPassword } from "@/lib/password";
import { verifyOtp } from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { signupPhoneSchema } from "@/lib/validations/auth";
import { zodFirstError } from "@/lib/validations/common";

const SIGNUP_LIMIT = 3;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "অবৈধ অনুরোধ" }, { status: 400 });
  }

  const parsed = signupPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const phone = normalizeBdPhone(parsed.data.phone);
  if (!phone) {
    return jsonResponse({ error: "সঠিক বাংলাদেশি মোবাইল দিন" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const [phoneRl, ipRl] = await Promise.all([
    checkRateLimit(`signup:phone:${phone}`, {
      limit: SIGNUP_LIMIT,
      windowMs: SIGNUP_WINDOW_MS,
    }),
    checkRateLimit(`signup:ip:${ip}`, { limit: 10, windowMs: SIGNUP_WINDOW_MS }),
  ]);
  if (!phoneRl.ok) return rateLimitResponse(phoneRl.retryAfterSec);
  if (!ipRl.ok) return rateLimitResponse(ipRl.retryAfterSec);

  if (!(await verifyOtp(phone, parsed.data.otp, { consume: false }))) {
    return jsonResponse({ error: "OTP ভুল বা মেয়াদ শেষ" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return jsonResponse(
      { error: "এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে" },
      { status: 409 },
    );
  }

  const { shopName, name } = parsed.data;
  const passwordHash = await hashPassword(
    randomBytes(32).toString("hex") + Date.now().toString(),
  );

  try {
    await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name: shopName, ownerName: name },
      });
      await tx.user.create({
        data: {
          phone,
          name,
          passwordHash,
          shopId: shop.id,
        },
      });
    });
    await verifyOtp(phone, parsed.data.otp, { consume: true });
  } catch {
    return jsonResponse(
      { error: "সাইন আপ সম্পন্ন হয়নি। আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }

  return jsonResponse({ ok: true }, { status: 201 });
}
