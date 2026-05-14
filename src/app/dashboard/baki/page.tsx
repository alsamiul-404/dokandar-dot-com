import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { BakiModule } from "@/components/modules/baki/baki-module";

export const metadata: Metadata = {
  title: "বাকি খাতা",
};

export default async function BakiKhataPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <BakiModule />;
}
