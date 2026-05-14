import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BakiCustomerNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-xl font-bold">গ্রাহক পাওয়া যায়নি</h1>
      <p className="text-muted-foreground">এই লিংকের গ্রাহক নেই বা আপনার দোকানের নয়।</p>
      <Button asChild className="h-12 rounded-xl">
        <Link href="/dashboard/baki">বাকি খাতায় ফিরুন</Link>
      </Button>
    </div>
  );
}
