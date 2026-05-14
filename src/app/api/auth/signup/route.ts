import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyOtp } from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { signupPhoneSchema } from "@/lib/validations/auth";
import { zodFirstError } from "@/lib/validations/common";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ অনুরোধ" }, { status: 400 });
  }

  const parsed = signupPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const phone = normalizeBdPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "সঠিক বাংলাদেশি মোবাইল দিন" }, { status: 400 });
  }

  if (!verifyOtp(phone, parsed.data.otp, { consume: false })) {
    return NextResponse.json({ error: "OTP ভুল বা মেয়াদ শেষ" }, { status: 400 });
  }

  const existing = await getPrisma().user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      { error: "এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে" },
      { status: 409 },
    );
  }

  const { shopName, name } = parsed.data;
  const passwordHash = await hashPassword(
    randomBytes(32).toString("hex") + Date.now().toString(),
  );

  try {
    const shop = await getPrisma().shop.create({
      data: { name: shopName, ownerName: name },
    });
    try {
      await getPrisma().user.create({
        data: {
          phone,
          name,
          passwordHash,
          shopId: shop.id,
        },
      });
    } catch (inner) {
      await getPrisma()
        .shop.delete({ where: { id: shop.id } })
        .catch(() => undefined);
      throw inner;
    }
  } catch {
    return NextResponse.json(
      { error: "সাইন আপ সম্পন্ন হয়নি। আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
