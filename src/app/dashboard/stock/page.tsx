import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { StockModule } from "@/components/modules/stock/stock-module";

export const metadata: Metadata = {
  title: "স্টক হিসাব",
};

export default async function StockModulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <StockModule />;
}
