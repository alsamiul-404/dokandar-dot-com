import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function StockProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-xl font-bold">পণ্য পাওয়া যায়নি</h1>
      <p className="text-muted-foreground">এই লিংকের পণ্য নেই বা আপনার দোকানের নয়।</p>
      <Button asChild className="h-12 rounded-xl">
        <Link href="/dashboard/stock">স্টক তালিকায় ফিরুন</Link>
      </Button>
    </div>
  );
}
