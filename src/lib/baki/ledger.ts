import Decimal from "decimal.js";

import { getPrisma } from "@/lib/prisma";

export async function getCustomerBalance(
  shopId: string,
  customerId: string,
): Promise<Decimal> {
  const agg = await getPrisma().creditEntry.aggregate({
    where: { shopId, customerId },
    _sum: { amount: true },
  });
  return new Decimal(agg._sum.amount?.toString() ?? "0");
}

export function formatBakiLabel(type: string): string {
  switch (type) {
    case "SALE_CREDIT":
      return "বিক্রয় বাকি";
    case "PAYMENT":
      return "জমা";
    case "ADJUSTMENT":
    default:
      return "বাকি / সমন্বয়";
  }
}
