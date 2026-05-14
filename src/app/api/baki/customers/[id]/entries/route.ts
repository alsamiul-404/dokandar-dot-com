import { NextResponse } from "next/server";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getCustomerBalance } from "@/lib/baki/ledger";
import { getPrisma } from "@/lib/prisma";
import { bakiEntryPostSchema } from "@/lib/validations/baki";
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = bakiEntryPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const customer = await getPrisma().customer.findFirst({
    where: { id: idParsed.data, shopId: auth.shopId },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "গ্রাহক নেই" }, { status: 404 });
  }

  const { kind, amountTaka, note } = parsed.data;
  const amount = new Decimal(amountTaka);

  if (kind === "ADD_BAKI") {
    if (amount.lte(0)) {
      return NextResponse.json(
        { error: "টাকার পরিমাণ শূন্যের বেশি হতে হবে" },
        { status: 400 },
      );
    }
    await getPrisma().creditEntry.create({
      data: {
        shopId: auth.shopId,
        customerId: customer.id,
        amount: amount.toFixed(4),
        entryType: "ADJUSTMENT",
        description: note?.trim() || null,
      },
    });
  } else {
    if (amount.lte(0)) {
      return NextResponse.json(
        { error: "জমার পরিমাণ শূন্যের বেশি হতে হবে" },
        { status: 400 },
      );
    }
    const balance = await getCustomerBalance(auth.shopId, customer.id);
    if (amount.gt(balance)) {
      return NextResponse.json(
        {
          error: `মোট বাকি ${balance.toFixed(2)} টাকার বেশি জমা নেওয়া যাবে না`,
        },
        { status: 400 },
      );
    }
    await getPrisma().creditEntry.create({
      data: {
        shopId: auth.shopId,
        customerId: customer.id,
        amount: amount.neg().toFixed(4),
        entryType: "PAYMENT",
        description: note?.trim() || null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
