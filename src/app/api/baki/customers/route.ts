import { NextResponse } from "next/server";
import Decimal from "decimal.js";

import { requireShopApi } from "@/lib/api/require-shop";
import { getPrisma } from "@/lib/prisma";
import { newCustomerSchema } from "@/lib/validations/baki";
import { zodFirstError } from "@/lib/validations/common";

export async function GET() {
  const auth = await requireShopApi();
  if (!auth.ok) return auth.response;

  const prisma = getPrisma();
  const [customers, sums] = await Promise.all([
    prisma.customer.findMany({
      where: { shopId: auth.shopId },
      orderBy: { name: "asc" },
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

  const payload = customers.map(
    (c: { id: string; name: string; phone: string | null }) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalDue: (dueMap.get(c.id) ?? new Decimal(0)).toFixed(2),
    }),
  );

  return NextResponse.json(payload);
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

  const parsed = newCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstError(parsed.error) }, { status: 400 });
  }

  const customer = await getPrisma().customer.create({
    data: {
      shopId: auth.shopId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    },
    select: { id: true, name: true, phone: true },
  });

  return NextResponse.json({ ...customer, totalDue: "0.00" }, { status: 201 });
}
