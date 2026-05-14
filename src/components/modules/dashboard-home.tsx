"use client";

import { useSalesSummary } from "@/hooks/dokandar";
import { formatTaka } from "@/lib/baki/format-money";
import { PdfDailySalesButton } from "@/components/modules/reports/pdf-daily-sales-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DashboardHomeTiles } from "./dashboard-home-tiles";

export function DashboardHome() {
  const { data, isPending, isError } = useSalesSummary();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1 px-0.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ড্যাশবোর্ড</h1>
        <p className="text-base text-muted-foreground">আজকের বিক্রয় সারাংশ ও মডিউল</p>
      </div>

      <section aria-labelledby="today-summary-heading">
        <h2 id="today-summary-heading" className="mb-3 text-lg font-semibold">
          আজকের হিসাব
        </h2>
        {isPending ? (
          <p className="text-muted-foreground">লোড হচ্ছে…</p>
        ) : isError || !data ? (
          <p className="text-destructive">সারাংশ আনা যায়নি</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">আজকের বিক্রয়</CardTitle>
                <CardDescription>
                  {data.saleCount} টি বিল ·{" "}
                  {new Date(data.date).toLocaleDateString("bn-BD")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {formatTaka(data.totalSales)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">নগদ</CardTitle>
                <CardDescription>আজ জমা হওয়া নগদ</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                  {formatTaka(data.cash)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">বাকি</CardTitle>
                <CardDescription>আজকের বিক্রয়ে বাকি অংশ</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-destructive">
                  {formatTaka(data.baki)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
          <PdfDailySalesButton className="w-full sm:w-auto" />
        </div>
      </section>

      <DashboardHomeTiles />
    </div>
  );
}
