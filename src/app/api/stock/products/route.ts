import { NextResponse } from "next/server";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { newProductSchema } from "@/lib/validations/stock";
import { zodFirstError } from "@/lib/validations/common";

export async function GET() {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const rows = await getPrisma().product.findMany({
    where: { shopId: auth.shopId, isActive: true },
    orderBy: { name: "asc" },
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

  return NextResponse.json(
    rows.map(
      (p: {
        id: string;
        name: string;
        sku: string | null;
        category: string;
        buyPrice: { toString(): string };
        unitPrice: { toString(): string };
        stockOnHand: number;
        lowStockAlert: number;
        unit: string;
      }) => ({
        ...p,
        buyPrice: p.buyPrice.toString(),
        unitPrice: p.unitPrice.toString(),
      }),
    ),
  );
}

export async function POST(req: Request) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON" }, { status: 400 });
  }

  const parsed = newProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
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

  return NextResponse.json(
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
