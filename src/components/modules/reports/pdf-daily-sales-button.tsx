"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { useDailySalesReport } from "@/hooks/dokandar";
import { downloadDailySalesPdf } from "@/lib/pdf/daily-sales-pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  /** `YYYY-MM-DD`; omit for today */
  date?: string;
  className?: string;
};

export function PdfDailySalesButton({ date, className }: Props) {
  const { data, isLoading, isError } = useDailySalesReport(date);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 min-h-[48px] gap-2 rounded-xl border-2 border-foreground/20 text-base font-semibold",
        className,
      )}
      disabled={isLoading || isError || !data || busy}
      onClick={() => {
        if (!data) return;
        setBusy(true);
        void downloadDailySalesPdf(data).finally(() => setBusy(false));
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          রিপোর্ট লোড হচ্ছে…
        </>
      ) : busy ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          পিডিএফ তৈরি হচ্ছে…
        </>
      ) : (
        <>
          <Download className="h-5 w-5 shrink-0" aria-hidden />
          দৈনিক বিক্রয় পিডিএফ
        </>
      )}
    </Button>
  );
}
