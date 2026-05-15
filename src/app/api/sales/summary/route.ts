import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";

import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCached, setCached, shopCacheKeys, shopCacheTtl } from "@/lib/cache/shop-cache";
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
    return jsonResponse({ error: zodFirstError(dq.error) }, { status: 400 });
  }

  const day = dq.data.date ? parseISO(dq.data.date) : new Date();
  const from = startOfDay(day);
  const to = endOfDay(day);
  const dateStr = from.toISOString().slice(0, 10);

  const cacheKey = shopCacheKeys.salesSummary(auth.shopId, dateStr);
  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return jsonResponse(cached, { headers: { "X-Cache": "HIT" } });
  }

  const prisma = getPrisma();
  const [agg, saleCount] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        shopId: auth.shopId,
        soldAt: { gte: from, lte: to },
      },
      _sum: {
        totalAmount: true,
        cashPaid: true,
        creditAmount: true,
      },
    }),
    prisma.sale.count({
      where: {
        shopId: auth.shopId,
        soldAt: { gte: from, lte: to },
      },
    }),
  ]);

  const totalSales = new Decimal(agg._sum.totalAmount?.toString() ?? "0");
  const cash = new Decimal(agg._sum.cashPaid?.toString() ?? "0");
  const baki = new Decimal(agg._sum.creditAmount?.toString() ?? "0");

  const payload = {
    date: dateStr,
    saleCount,
    totalSales: totalSales.toFixed(2),
    cash: cash.toFixed(2),
    baki: baki.toFixed(2),
  };

  void setCached(cacheKey, payload, shopCacheTtl.salesSummary);

  return jsonResponse(payload, { headers: { "X-Cache": "MISS" } });
}
