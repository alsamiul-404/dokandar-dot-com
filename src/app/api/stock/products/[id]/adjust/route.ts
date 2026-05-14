import { NextResponse } from "next/server";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { adjustStockSchema } from "@/lib/validations/stock";
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = adjustStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const { direction, quantity, note } = parsed.data;
  const delta = direction === "add" ? quantity : -quantity;

  const db = getPrisma();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      const p = await tx.product.findFirst({
        where: { id: idParsed.data, shopId: auth.shopId },
      });
      if (!p) throw new Error("NOT_FOUND");
      const next = p.stockOnHand + delta;
      if (next < 0) throw new Error("INSUFFICIENT_STOCK");
      await tx.product.update({
        where: { id: idParsed.data },
        data: { stockOnHand: next },
      });
      await tx.stockLog.create({
        data: {
          productId: idParsed.data,
          quantityDelta: delta,
          reason: "ADJUSTMENT",
          note: note?.trim() || null,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "মজুদের চেয়ে বেশি বাদ দেওয়া যাবে না" },
        { status: 400 },
      );
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "পণ্য নেই" }, { status: 404 });
    }
    return NextResponse.json({ error: "সমন্বয় ব্যর্থ" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
