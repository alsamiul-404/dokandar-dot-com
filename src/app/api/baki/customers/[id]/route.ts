import { jsonResponse } from "@/lib/api/json-response";
import { requireShopApi } from "@/lib/api/require-shop";
import { getCustomerBalance } from "@/lib/baki/ledger";
import { getPrisma } from "@/lib/prisma";
import {
  invalidUuidResponse,
  paginationQuerySchema,
  uuidParamSchema,
  zodFirstError,
} from "@/lib/validations/common";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const idParsed = uuidParamSchema.safeParse(params.id);
  if (!idParsed.success) {
    return invalidUuidResponse();
  }

  const url = new URL(req.url);
  const pq = paginationQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!pq.success) {
    return jsonResponse({ error: zodFirstError(pq.error) }, { status: 400 });
  }

  const { limit, cursor } = pq.data;
  const prisma = getPrisma();

  const customer = await prisma.customer.findFirst({
    where: { id: idParsed.data, shopId: auth.shopId },
    select: { id: true, name: true, phone: true },
  });

  if (!customer) {
    return jsonResponse({ error: "গ্রাহক নেই" }, { status: 404 });
  }

  const entryWhere = {
    shopId: auth.shopId,
    customerId: customer.id,
    ...(cursor ? { id: { lt: cursor } } : {}),
  };

  const [balance, entries, totalEntries] = await Promise.all([
    getCustomerBalance(auth.shopId, customer.id),
    prisma.creditEntry.findMany({
      where: entryWhere,
      orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: {
        id: true,
        amount: true,
        entryType: true,
        description: true,
        recordedAt: true,
      },
    }),
    prisma.creditEntry.count({
      where: { shopId: auth.shopId, customerId: customer.id },
    }),
  ]);

  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return jsonResponse({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    },
    balance: balance.toFixed(2),
    entries: page.map((e) => ({
      id: e.id,
      amount: e.amount.toString(),
      entryType: e.entryType,
      description: e.description,
      recordedAt: e.recordedAt.toISOString(),
    })),
    pagination: {
      totalEntries,
      hasMore,
      nextCursor,
    },
  });
}
