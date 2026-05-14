import { NextResponse } from "next/server";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import type { DailySalesReport, DailySalesSaleRow } from "@/lib/reports/types";
import { reportDateQuerySchema, zodFirstError } from "@/lib/validations/common";

type SaleForReport = {
  id: string;
  soldAt: Date;
  totalAmount: { toString(): string };
  cashPaid: { toString(): string };
  creditAmount: { toString(): string };
  customer: { name: string } | null;
  lines: Array<{
    quantity: number;
    unitPrice: { toString(): string };
    lineTotal: { toString(): string };
    product: { name: string };
  }>;
};

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
  const [shop, sales] = await Promise.all([
    prisma.shop.findFirst({
      where: { id: auth.shopId },
      select: { name: true },
    }),
    prisma.sale.findMany({
      where: {
        shopId: auth.shopId,
        soldAt: { gte: from, lte: to },
      },
      orderBy: { soldAt: "asc" },
      include: {
        customer: { select: { name: true } },
        lines: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
  ]);

  let totalSales = new Decimal(0);
  let cash = new Decimal(0);
  let baki = new Decimal(0);

  const saleRows: DailySalesSaleRow[] = (sales as SaleForReport[]).map((s) => {
    totalSales = totalSales.plus(s.totalAmount.toString());
    cash = cash.plus(s.cashPaid.toString());
    baki = baki.plus(s.creditAmount.toString());
    return {
      id: s.id,
      soldAt: s.soldAt.toISOString(),
      totalAmount: new Decimal(s.totalAmount.toString()).toFixed(2),
      cashPaid: new Decimal(s.cashPaid.toString()).toFixed(2),
      creditAmount: new Decimal(s.creditAmount.toString()).toFixed(2),
      customerName: s.customer?.name ?? null,
      lines: s.lines.map((l) => ({
        productName: l.product.name,
        quantity: l.quantity,
        unitPrice: new Decimal(l.unitPrice.toString()).toFixed(2),
        lineTotal: new Decimal(l.lineTotal.toString()).toFixed(2),
      })),
    };
  });

  const payload: DailySalesReport = {
    date: from.toISOString().slice(0, 10),
    shopName: shop?.name ?? "দোকান",
    saleCount: sales.length,
    totalSales: totalSales.toFixed(2),
    cash: cash.toFixed(2),
    baki: baki.toFixed(2),
    sales: saleRows,
  };

  return NextResponse.json(payload);
}
