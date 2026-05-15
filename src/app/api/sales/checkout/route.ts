import Decimal from "decimal.js";

import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { dispatchCacheInvalidate } from "@/lib/queue/publish";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations/sales";
import { zodFirstError } from "@/lib/validations/common";

const CHECKOUT_LIMIT = 120;
const CHECKOUT_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const rl = await checkRateLimit(`checkout:shop:${auth.shopId}`, {
    limit: CHECKOUT_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
  });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const { customerId, lines, cashPaidTaka, creditAmountTaka, notes } = parsed.data;
  const cash = new Decimal(cashPaidTaka);
  const credit = new Decimal(creditAmountTaka ?? "0");

  if (credit.gt(0) && !customerId) {
    return jsonResponse(
      { error: "বাকি বিক্রয়ের জন্য গ্রাহক বাছাই করুন" },
      { status: 400 },
    );
  }

  const db = getPrisma();
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saleId: string = await db.$transaction(async (tx: any) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          shopId: auth.shopId,
          isActive: true,
        },
      });

      const productMap = new Map<string, (typeof products)[number]>(
        products.map((p: (typeof products)[number]) => [p.id, p]),
      );

      const prepared: {
        productId: string;
        quantity: number;
        unitPrice: Decimal;
        lineTotal: Decimal;
      }[] = [];

      let total = new Decimal(0);

      for (const line of lines) {
        const p = productMap.get(line.productId);
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

      await Promise.all(
        prepared.map((l) =>
          tx.product.update({
            where: { id: l.productId },
            data: { stockOnHand: { decrement: l.quantity } },
          }),
        ),
      );

      await tx.stockLog.createMany({
        data: prepared.map((l) => ({
          productId: l.productId,
          saleId: sale.id,
          quantityDelta: -l.quantity,
          reason: "SALE" as const,
          note: null,
        })),
      });

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

    const dateStr = new Date().toISOString().slice(0, 10);
    void dispatchCacheInvalidate(auth.shopId, "stock");
    void dispatchCacheInvalidate(auth.shopId, "sales", dateStr);
    if (customerId) {
      void dispatchCacheInvalidate(auth.shopId, "baki");
    }

    return jsonResponse({ ok: true, saleId }, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "PRODUCT_NOT_FOUND") {
        return jsonResponse({ error: "একটি পণ্য পাওয়া যায়নি" }, { status: 400 });
      }
      if (e.message === "INSUFFICIENT_STOCK") {
        return jsonResponse(
          { error: "মজুদ কম — বিক্রয় সম্ভব নয়" },
          { status: 400 },
        );
      }
      if (e.message === "PAYMENT_MISMATCH") {
        return jsonResponse(
          {
            error: "নগদ + বাকি মোট বিলের সমান হতে হবে (সংখ্যা মিলিয়ে দেখুন)",
          },
          { status: 400 },
        );
      }
    }
    return jsonResponse({ error: "বিক্রয় সম্পন্ন হয়নি" }, { status: 500 });
  }
}
