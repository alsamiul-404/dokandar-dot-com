import { NextResponse } from "next/server";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/sales";
import { zodFirstError } from "@/lib/validations/common";

export async function POST(req: Request) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const { customerId, lines, cashPaidTaka, creditAmountTaka, notes } = parsed.data;
  const cash = new Decimal(cashPaidTaka);
  const credit = new Decimal(creditAmountTaka ?? "0");

  if (credit.gt(0) && !customerId) {
    return NextResponse.json(
      { error: "বাকি বিক্রয়ের জন্য গ্রাহক বাছাই করুন" },
      { status: 400 },
    );
  }

  const db = getPrisma();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saleId: string = await db.$transaction(async (tx: any) => {
      const prepared: {
        productId: string;
        quantity: number;
        unitPrice: Decimal;
        lineTotal: Decimal;
      }[] = [];

      let total = new Decimal(0);

      for (const line of lines) {
        const p = await tx.product.findFirst({
          where: {
            id: line.productId,
            shopId: auth.shopId,
            isActive: true,
          },
        });
        if (!p) {
          throw new Error("PRODUCT_NOT_FOUND");
        }
        if (p.stockOnHand < line.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
        const unit = new Decimal(p.unitPrice.toString());
        const lineTotal = unit.mul(line.quantity);
        total = total.plus(lineTotal);
        prepared.push({
          productId: p.id,
          quantity: line.quantity,
          unitPrice: unit,
          lineTotal,
        });
      }

      if (!cash.plus(credit).minus(total).abs().lte(0.02)) {
        throw new Error("PAYMENT_MISMATCH");
      }

      const sale = await tx.sale.create({
        data: {
          shopId: auth.shopId,
          customerId: customerId ?? null,
          totalAmount: total.toFixed(4),
          cashPaid: cash.toFixed(4),
          creditAmount: credit.toFixed(4),
          notes: notes?.trim() || null,
          lines: {
            create: prepared.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice.toFixed(4),
              lineTotal: l.lineTotal.toFixed(4),
            })),
          },
        },
        select: { id: true },
      });

      for (const l of prepared) {
        await tx.product.update({
          where: { id: l.productId },
          data: { stockOnHand: { decrement: l.quantity } },
        });
        await tx.stockLog.create({
          data: {
            productId: l.productId,
            saleId: sale.id,
            quantityDelta: -l.quantity,
            reason: "SALE",
            note: null,
          },
        });
      }

      if (credit.gt(0) && customerId) {
        await tx.creditEntry.create({
          data: {
            shopId: auth.shopId,
            customerId,
            saleId: sale.id,
            amount: credit.toFixed(4),
            entryType: "SALE_CREDIT",
            description: "বিক্রয় বাকি",
          },
        });
      }

      return sale.id as string;
    });

    return NextResponse.json({ ok: true, saleId }, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json({ error: "একটি পণ্য পাওয়া যায়নি" }, { status: 400 });
      }
      if (e.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { error: "মজুদ কম — বিক্রয় সম্ভব নয়" },
          { status: 400 },
        );
      }
      if (e.message === "PAYMENT_MISMATCH") {
        return NextResponse.json(
          {
            error: "নগদ + বাকি মোট বিলের সমান হতে হবে (সংখ্যা মিলিয়ে দেখুন)",
          },
          { status: 400 },
        );
      }
    }
    return NextResponse.json({ error: "বিক্রয় সম্পন্ন হয়নি" }, { status: 500 });
  }
}
