import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";

export type ShopApiAuth =
  | { ok: true; shopId: string }
  | { ok: false; response: NextResponse };

export async function requireShopApi(): Promise<ShopApiAuth> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "লগইন প্রয়োজন" }, { status: 401 }),
    };
  }
  return { ok: true, shopId: session.user.shopId };
}
