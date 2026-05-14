import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { ProfitModule } from "@/components/modules/profit/profit-module";
import { authOptions } from "@/lib/auth-options";

export const metadata: Metadata = {
  title: "লাভ হিসাব",
};

export default async function ProfitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <ProfitModule />;
}
