import { NextResponse } from "next/server";

import { requireShopApi } from "@/lib/api/require-shop";
import { getCustomerBalance } from "@/lib/baki/ledger";
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

  const customer = await getPrisma().customer.findFirst({
    where: { id: idParsed.data, shopId: auth.shopId },
    include: {
      creditEntries: { orderBy: { recordedAt: "desc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "গ্রাহক নেই" }, { status: 404 });
  }

  const balance = await getCustomerBalance(auth.shopId, customer.id);

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    },
    balance: balance.toFixed(2),
    entries: customer.creditEntries.map(
      (e: {
        id: string;
        amount: { toString(): string };
        entryType: string;
        description: string | null;
        recordedAt: Date;
      }) => ({
        id: e.id,
        amount: e.amount.toString(),
        entryType: e.entryType,
        description: e.description,
        recordedAt: e.recordedAt.toISOString(),
      }),
    ),
  });
}
