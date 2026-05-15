import Decimal from "decimal.js";

import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCached, setCached, shopCacheKeys, shopCacheTtl } from "@/lib/cache/shop-cache";
import { getPrisma } from "@/lib/prisma";
import { dispatchCacheInvalidate } from "@/lib/queue/publish";
import { newCustomerSchema } from "@/lib/validations/baki";
import { MAX_LIST_LIMIT, zodFirstError } from "@/lib/validations/common";

export async function GET() {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const cacheKey = shopCacheKeys.bakiCustomers(auth.shopId);
  const cached = await getCached<unknown[]>(cacheKey);
  if (cached) {
    return jsonResponse(cached, { headers: { "X-Cache": "HIT" } });
  }

  const prisma = getPrisma();
  const [customers, sums] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId: auth.shopId },
      orderBy: { name: "asc" },
      take: MAX_LIST_LIMIT,
      select: { id: true, name: true, phone: true },
    }),
    prisma.creditEntry.groupBy({
      by: ["customerId"],
      where: { shopId: auth.shopId },
      _sum: { amount: true },
    }),
  ]);

  const dueMap = new Map<string, Decimal>();
  for (const row of sums) {
    dueMap.set(row.customerId, new Decimal(row._sum.amount?.toString() ?? "0"));
  }

  const payload = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    totalDue: (dueMap.get(c.id) ?? new Decimal(0)).toFixed(2),
  }));

  void setCached(cacheKey, payload, shopCacheTtl.bakiCustomers);

  return jsonResponse(payload, { headers: { "X-Cache": "MISS" } });
}

export async function POST(req: Request) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = newCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const customer = await getPrisma().customer.create({
    data: {
      shopId: auth.shopId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    },
    select: { id: true, name: true, phone: true },
  });

  void dispatchCacheInvalidate(auth.shopId, "baki");

  return jsonResponse({ ...customer, totalDue: "0.00" }, { status: 201 });
}
