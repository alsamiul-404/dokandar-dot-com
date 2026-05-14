import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { PosModule } from "@/components/modules/sales/pos-module";

export const metadata: Metadata = {
  title: "দৈনিক বিক্রি",
};

export default async function DailySalesModulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <PosModule />;
}
