"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { useProfitReport } from "@/hooks/dokandar";
import { formatTaka } from "@/lib/baki/format-money";
import { PdfDailySalesButton } from "@/components/modules/reports/pdf-daily-sales-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfitDatePicker } from "@/components/modules/profit/profit-date-picker";
import { ProfitModuleSkeleton } from "@/components/shared/module-loading-skeleton";
import { DataRefreshOverlay } from "@/components/shared/loading-status";
import { cn } from "@/lib/utils";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProfitModule() {
  const { status } = useSession();
  const [date, setDate] = useState(todayIso);
  const { data, isPending, isError, isFetching } = useProfitReport(date);

  const bnDate = useMemo(
    () =>
      data?.date
        ? new Date(data.date).toLocaleDateString("bn-BD", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
    [data?.date],
  );

  if (status === "loading" || (isPending && !data)) {
    return <ProfitModuleSkeleton />;
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard"
          className="text-base font-medium text-foreground underline-offset-4 hover:underline"
        >
          ← ড্যাশবোর্ড
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">লাভ হিসাব</h1>
        <p className="text-lg text-muted-foreground">
          বিক্রয় লাইন অনুযায়ী (বিক্রয় মূল্য − পণ্যের ক্রয় দর) × পরিমাণ
        </p>
      </div>

      <Card className="overflow-hidden border border-border/70 shadow-lg ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="border-b border-border/50 bg-muted/25 pb-4 backdrop-blur-sm">
          <CardTitle className="text-xl">তারিখ বাছাই</CardTitle>
          <CardDescription className="text-base">
            নির্দিষ্ট দিনের আনুমানিক মোট লাভ (বর্তমান ক্রয় দর ব্যবহার)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-6">
          <ProfitDatePicker value={date} onChange={setDate} isRefreshing={isFetching} />
        </CardContent>
      </Card>

      {isError || !data ? (
        <p className="text-lg text-destructive">ডাটা আনা যায়নি</p>
      ) : (
        <div className="relative isolate">
          {isFetching ? (
            <DataRefreshOverlay label="লাভ হিসাব আপডেট হচ্ছে…" className="rounded-2xl" />
          ) : null}
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              isFetching && "pointer-events-none select-none opacity-[0.72]",
            )}
          >
          <Card className="border-2 border-foreground/15 bg-card shadow-md sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">{bnDate}</CardTitle>
              <CardDescription className="text-base">
                দোকান: {data.shopName} · বিক্রয় লাইন: {data.lineCount} · মোট ইউনিট:{" "}
                {data.unitsSold}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-sky-800/25 bg-sky-50 dark:border-sky-400/30 dark:bg-sky-950/40">
            <CardHeader>
              <CardTitle className="text-lg">মোট বিক্রয় (রাজস্ব)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold tabular-nums text-sky-950 dark:text-sky-100">
                {formatTaka(data.revenue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-800/25 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-950/40">
            <CardHeader>
              <CardTitle className="text-lg">ক্রয় খরচ (বই)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold tabular-nums text-amber-950 dark:text-amber-100">
                {formatTaka(data.costOnBooks)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-800/30 bg-emerald-50 dark:border-emerald-400/35 dark:bg-emerald-950/50 sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">আনুমানিক মোট লাভ</CardTitle>
              <CardDescription className="text-base text-foreground/80">
                রাজস্ব − (ক্রয় দর × বিক্রিত পরিমাণ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black tabular-nums text-emerald-900 dark:text-emerald-200">
                {formatTaka(data.grossProfit)}
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      <Card className="border-2 border-foreground/15 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">পিডিএফ রিপোর্ট</CardTitle>
          <CardDescription className="text-base">
            নির্বাচিত তারিখের দৈনিক বিক্রয় (বিস্তারিত)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PdfDailySalesButton date={date} className="w-full sm:w-auto" />
        </CardContent>
      </Card>

      <Button
        asChild
        variant="outline"
        className="h-12 min-h-[48px] rounded-xl text-base"
      >
        <Link href="/dashboard/daily-sales">দৈনিক বিক্রয়ে যান</Link>
      </Button>
    </div>
  );
}
