import { NextResponse } from "next/server";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { invalidUuidResponse, uuidParamSchema } from "@/lib/validations/common";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const idParsed = uuidParamSchema.safeParse(params.id);
  if (!idParsed.success) {
    return invalidUuidResponse();
  }

  const product = await getPrisma().product.findFirst({
    where: { id: idParsed.data, shopId: auth.shopId, isActive: true },
    include: {
      stockLogs: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "পণ্য নেই" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    buyPrice: product.buyPrice.toString(),
    unitPrice: product.unitPrice.toString(),
    stockLogs: product.stockLogs.map(
      (l: {
        id: string;
        quantityDelta: number;
        reason: string;
        note: string | null;
        createdAt: Date;
      }) => ({
        id: l.id,
        quantityDelta: l.quantityDelta,
        reason: l.reason,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
      }),
    ),
  });
}
