import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { createAndStoreOtp } from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { sendOtpSms } from "@/lib/sms";
import { requestOtpBodySchema } from "@/lib/validations/auth";
import { zodFirstError } from "@/lib/validations/common";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = requestOtpBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const phone = normalizeBdPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন" },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (parsed.data.intent === "login" && !existing) {
    return NextResponse.json({ error: "এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status: 404 });
  }
  if (parsed.data.intent === "signup" && existing) {
    return NextResponse.json(
      { error: "এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে" },
      { status: 409 },
    );
  }

  const code = createAndStoreOtp(phone);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(
      `[auth/otp] ${phone} stored OTP=${code} (mock ${process.env.AUTH_MOCK_OTP_CODE ?? "123456"} valid when allowed)`,
    );
  }

  const sms = await sendOtpSms(phone, code);
  const smsSkipped =
    process.env.SMS_DISABLE_SEND === "true" ||
    (process.env.NODE_ENV !== "production" && !process.env.SSL_WIRELESS_API_KEY?.trim());

  if (!sms.ok && !smsSkipped) {
    return NextResponse.json(
      { error: sms.error ?? "এসএমএস পাঠানো যায়নি" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    smsSent: sms.ok,
    smsSkipped: smsSkipped || !sms.ok,
  });
}
