import { NextResponse } from "next/server";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
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

  const sales = await getPrisma().sale.findMany({
    where: {
      shopId: auth.shopId,
      soldAt: { gte: from, lte: to },
    },
    select: {
      totalAmount: true,
      cashPaid: true,
      creditAmount: true,
    },
  });

  let totalSales = new Decimal(0);
  let cash = new Decimal(0);
  let baki = new Decimal(0);
  for (const s of sales) {
    totalSales = totalSales.plus(s.totalAmount.toString());
    cash = cash.plus(s.cashPaid.toString());
    baki = baki.plus(s.creditAmount.toString());
  }

  return NextResponse.json({
    date: from.toISOString().slice(0, 10),
    saleCount: sales.length,
    totalSales: totalSales.toFixed(2),
    cash: cash.toFixed(2),
    baki: baki.toFixed(2),
  });
}
