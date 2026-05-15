import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCached, setCached, shopCacheKeys, shopCacheTtl } from "@/lib/cache/shop-cache";
import { getPrisma } from "@/lib/prisma";
import { dispatchCacheInvalidate } from "@/lib/queue/publish";
import { newProductSchema } from "@/lib/validations/stock";
import { MAX_LIST_LIMIT, zodFirstError } from "@/lib/validations/common";

export async function GET() {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const cacheKey = shopCacheKeys.stockProducts(auth.shopId);
  const cached = await getCached<unknown[]>(cacheKey);
  if (cached) {
    return jsonResponse(cached, { headers: { "X-Cache": "HIT" } });
  }

  const rows = await getPrisma().product.findMany({
    where: { shopId: auth.shopId, isActive: true },
    orderBy: { name: "asc" },
    take: MAX_LIST_LIMIT,
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      buyPrice: true,
      unitPrice: true,
      stockOnHand: true,
      lowStockAlert: true,
      unit: true,
    },
  });

  const payload = rows.map((p) => ({
    ...p,
    buyPrice: p.buyPrice.toString(),
    unitPrice: p.unitPrice.toString(),
  }));

  void setCached(cacheKey, payload, shopCacheTtl.stockProducts);

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

  const parsed = newProductSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const db = getPrisma();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await db.$transaction(async (tx: any) => {
    const p = await tx.product.create({
      data: {
        shopId: auth.shopId,
        name: d.name,
        category: d.category ?? "",
        sku: d.sku ?? null,
        buyPrice: d.buyPriceTaka,
        unitPrice: d.sellPriceTaka,
        lowStockAlert: d.lowStockAlert,
        stockOnHand: d.initialQty,
      },
    });
    if (d.initialQty > 0) {
      await tx.stockLog.create({
        data: {
          productId: p.id,
          quantityDelta: d.initialQty,
          reason: "OPENING",
          note: "নতুন পণ্য — শুরুর মজুদ",
        },
      });
    }
    return p;
  });

  void dispatchCacheInvalidate(auth.shopId, "stock");

  return jsonResponse(
    {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      buyPrice: product.buyPrice.toString(),
      unitPrice: product.unitPrice.toString(),
      stockOnHand: product.stockOnHand,
      lowStockAlert: product.lowStockAlert,
      unit: product.unit,
    },
    { status: 201 },
  );
}
