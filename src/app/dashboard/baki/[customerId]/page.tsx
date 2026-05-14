import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { BakiCustomerDetail } from "@/components/modules/baki/baki-customer-detail";

export const metadata: Metadata = {
  title: "গ্রাহক — বাকি খাতা",
};

type Props = { params: { customerId: string } };

export default async function BakiCustomerDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <BakiCustomerDetail customerId={params.customerId} />;
}
