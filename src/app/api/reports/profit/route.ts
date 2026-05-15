import { endOfDay, parseISO, startOfDay } from "date-fns";
import Decimal from "decimal.js";
import { Prisma } from "@prisma/client";

import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCached, setCached, shopCacheKeys, shopCacheTtl } from "@/lib/cache/shop-cache";
import { getPrisma } from "@/lib/prisma";
import type { ProfitReport } from "@/lib/reports/types";
import { reportDateQuerySchema, zodFirstError } from "@/lib/validations/common";

type ProfitAggRow = {
  revenue: Prisma.Decimal | null;
  cost_on_books: Prisma.Decimal | null;
  units_sold: bigint | null;
  line_count: bigint | null;
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

  const cacheKey = shopCacheKeys.profitReport(auth.shopId, dateStr);
  const cached = await getCached<ProfitReport>(cacheKey);
  if (cached) {
    return jsonResponse(cached, { headers: { "X-Cache": "HIT" } });
  }

  const prisma = getPrisma();
  const [shop, rows] = await Promise.all([
    prisma.shop.findFirst({
      where: { id: auth.shopId },
      select: { name: true },
    }),
    prisma.$queryRaw<ProfitAggRow[]>`
      SELECT
        COALESCE(SUM(sl."lineTotal"), 0) AS revenue,
        COALESCE(SUM(p."buyPrice" * sl.quantity), 0) AS cost_on_books,
        COALESCE(SUM(sl.quantity), 0)::bigint AS units_sold,
        COUNT(*)::bigint AS line_count
      FROM "SaleLine" sl
      INNER JOIN "Sale" s ON s.id = sl."saleId"
      INNER JOIN "Product" p ON p.id = sl."productId"
      WHERE s."shopId" = ${auth.shopId}::uuid
        AND s."soldAt" >= ${from}
        AND s."soldAt" <= ${to}
    `,
  ]);

  const row = rows[0];
  const revenue = new Decimal(row?.revenue?.toString() ?? "0");
  const costOnBooks = new Decimal(row?.cost_on_books?.toString() ?? "0");
  const grossProfit = revenue.minus(costOnBooks);
  const unitsSold = Number(row?.units_sold ?? 0);
  const lineCount = Number(row?.line_count ?? 0);

  const payload: ProfitReport = {
    date: dateStr,
    shopName: shop?.name ?? "দোকান",
    revenue: revenue.toFixed(2),
    costOnBooks: costOnBooks.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    unitsSold,
    lineCount,
  };

  void setCached(cacheKey, payload, shopCacheTtl.profitReport);

  return jsonResponse(payload, { headers: { "X-Cache": "MISS" } });
}
