import { NextResponse } from "next/server";

import { requireShopApi } from "@/lib/api/require-shop";
import { getCustomerBalance } from "@/lib/baki/ledger";
import { getPrisma } from "@/lib/prisma";
import { bakiSmsPostSchema } from "@/lib/validations/baki";
import {
  invalidUuidResponse,
  uuidParamSchema,
  zodFirstError,
} from "@/lib/validations/common";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const idParsed = uuidParamSchema.safeParse(params.id);
  if (!idParsed.success) {
    return invalidUuidResponse();
  }

  let json: unknown = {};
  try {
    const text = await req.text();
    json = text.trim() === "" ? {} : JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const bodyParsed = bakiSmsPostSchema.safeParse(json);
  if (!bodyParsed.success) {
    return NextResponse.json({ error: zodFirstError(bodyParsed.error) }, { status: 400 });
  }

  const customer = await getPrisma().customer.findFirst({
    where: { id: idParsed.data, shopId: auth.shopId },
    select: { id: true, name: true, phone: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "গ্রাহক নেই" }, { status: 404 });
  }

  if (!customer.phone) {
    return NextResponse.json({ error: "মোবাইল নম্বর নেই" }, { status: 400 });
  }

  const balance = await getCustomerBalance(auth.shopId, customer.id);

  return NextResponse.json({
    ok: true,
    message: "এসএমএস রিমাইন্ডার (পরীক্ষা) — পরে SSL Wireless / Twilio যুক্ত হবে",
    mock: {
      to: customer.phone,
      customerName: customer.name,
      totalDue: balance.toFixed(2),
    },
  });
}
