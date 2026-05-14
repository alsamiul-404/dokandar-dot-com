import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { DashboardChrome } from "@/components/modules/dashboard-chrome";
import { authOptions } from "@/lib/auth-options";

export const metadata: Metadata = {
  title: "ড্যাশবোর্ড",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId || !session?.user?.shopName) {
    redirect("/auth");
  }

  return <DashboardChrome shopName={session.user.shopName}>{children}</DashboardChrome>;
}
