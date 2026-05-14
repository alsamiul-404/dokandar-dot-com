"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import type { CustomerLedgerPdfInput } from "@/lib/reports/types";
import { downloadCustomerLedgerPdf } from "@/lib/pdf/customer-ledger-pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  input: CustomerLedgerPdfInput | null;
  className?: string;
};

export function PdfCustomerLedgerButton({ input, className }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-12 min-h-[48px] gap-2 rounded-xl border-2 border-foreground/20 text-base font-semibold",
        className,
      )}
      disabled={!input || busy}
      onClick={() => {
        if (!input) return;
        setBusy(true);
        void downloadCustomerLedgerPdf(input).finally(() => setBusy(false));
      }}
    >
      {busy ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          পিডিএফ তৈরি হচ্ছে…
        </>
      ) : (
        <>
          <Download className="h-5 w-5 shrink-0" aria-hidden />
          খাতার পিডিএফ
        </>
      )}
    </Button>
  );
}
