import { NextResponse } from "next/server";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import type { ProfitReport } from "@/lib/reports/types";
import { reportDateQuerySchema, zodFirstError } from "@/lib/validations/common";

export async function GET(req: Request) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const dq = reportDateQuerySchema.safeParse({
    date: url.searchParams.get("date") || undefined,
  });
  if (!dq.success) {
    return NextResponse.json({ error: zodFirstError(dq.error) }, { status: 400 });
  }

  const day = dq.data.date ? parseISO(dq.data.date) : new Date();
  const from = startOfDay(day);
  const to = endOfDay(day);

  const prisma = getPrisma();
  const [shop, lines] = await Promise.all([
    prisma.shop.findFirst({
      where: { id: auth.shopId },
      select: { name: true },
    }),
    prisma.saleLine.findMany({
      where: {
        sale: {
          shopId: auth.shopId,
          soldAt: { gte: from, lte: to },
        },
      },
      include: {
        product: { select: { buyPrice: true, name: true } },
      },
    }),
  ]);

  let revenue = new Decimal(0);
  let costOnBooks = new Decimal(0);
  let unitsSold = 0;

  for (const l of lines) {
    const lineTotal = new Decimal(l.lineTotal.toString());
    const buy = new Decimal(l.product.buyPrice.toString());
    revenue = revenue.plus(lineTotal);
    costOnBooks = costOnBooks.plus(buy.mul(l.quantity));
    unitsSold += l.quantity;
  }

  const grossProfit = revenue.minus(costOnBooks);

  const payload: ProfitReport = {
    date: from.toISOString().slice(0, 10),
    shopName: shop?.name ?? "দোকান",
    revenue: revenue.toFixed(2),
    costOnBooks: costOnBooks.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    unitsSold,
    lineCount: lines.length,
  };

  return NextResponse.json(payload);
}
