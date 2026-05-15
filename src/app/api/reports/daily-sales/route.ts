import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";

import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCached, setCached, shopCacheKeys, shopCacheTtl } from "@/lib/cache/shop-cache";
import { getPrisma } from "@/lib/prisma";
import type { DailySalesReport, DailySalesSaleRow } from "@/lib/reports/types";
import { reportDateQuerySchema, zodFirstError } from "@/lib/validations/common";

const MAX_SALES_PER_DAY = 500;

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
    return jsonResponse({ error: zodFirstError(dq.error) }, { status: 400 });
  }

  const day = dq.data.date ? parseISO(dq.data.date) : new Date();
  const from = startOfDay(day);
  const to = endOfDay(day);
  const dateStr = from.toISOString().slice(0, 10);

  const cacheKey = shopCacheKeys.dailySales(auth.shopId, dateStr);
  const cached = await getCached<DailySalesReport & { truncated?: boolean }>(cacheKey);
  if (cached) {
    return jsonResponse(cached, { headers: { "X-Cache": "HIT" } });
  }

  const saleFilter = {
    shopId: auth.shopId,
    soldAt: { gte: from, lte: to },
  };

  const prisma = getPrisma();
  const [shop, agg, sales, totalSaleCount] = await Promise.all([
    prisma.shop.findFirst({
      where: { id: auth.shopId },
      select: { name: true },
    }),
    prisma.sale.aggregate({
      where: saleFilter,
      _sum: {
        totalAmount: true,
        cashPaid: true,
        creditAmount: true,
      },
    }),
    prisma.sale.findMany({
      where: saleFilter,
      orderBy: { soldAt: "asc" },
      take: MAX_SALES_PER_DAY,
      include: {
        customer: { select: { name: true } },
        lines: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
    prisma.sale.count({ where: saleFilter }),
  ]);

  const totalSales = new Decimal(agg._sum.totalAmount?.toString() ?? "0");
  const cash = new Decimal(agg._sum.cashPaid?.toString() ?? "0");
  const baki = new Decimal(agg._sum.creditAmount?.toString() ?? "0");

  const saleRows: DailySalesSaleRow[] = (sales as SaleForReport[]).map((s) => ({
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
  }));

  const payload: DailySalesReport & { truncated?: boolean } = {
    date: dateStr,
    shopName: shop?.name ?? "দোকান",
    saleCount: totalSaleCount,
    totalSales: totalSales.toFixed(2),
    cash: cash.toFixed(2),
    baki: baki.toFixed(2),
    sales: saleRows,
    ...(totalSaleCount > MAX_SALES_PER_DAY ? { truncated: true } : {}),
  };

  void setCached(cacheKey, payload, shopCacheTtl.dailySales);

  return jsonResponse(payload, { headers: { "X-Cache": "MISS" } });
}
