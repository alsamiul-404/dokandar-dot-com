import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth-options";
import { StockProductDetail } from "@/components/modules/stock/stock-product-detail";

export const metadata: Metadata = {
  title: "পণ্য — স্টক",
};

type Props = { params: { productId: string } };

export default async function StockProductDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.shopId) {
    redirect("/auth");
  }

  return <StockProductDetail productId={params.productId} />;
}
