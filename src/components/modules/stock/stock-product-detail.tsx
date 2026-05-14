"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdjustStockMutation, useStockProductDetail } from "@/hooks/dokandar";
import { adjustStockSchema } from "@/lib/validations/stock";
import { stockLogReasonBn } from "@/lib/stock/reason-labels";
import { formatTaka } from "@/lib/baki/format-money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailPageGlassSkeleton } from "@/components/shared/module-loading-skeleton";
import { InlineLoadingLabel } from "@/components/shared/loading-status";

type Props = { productId: string };

export function StockProductDetail({ productId }: Props) {
  const { status } = useSession();
  const { data, isPending, isError } = useStockProductDetail(productId);
  const adjust = useAdjustStockMutation(productId);

  const form = useForm<z.infer<typeof adjustStockSchema>>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { direction: "add", quantity: 1, note: "" },
  });

  if (status === "loading" || (isPending && !data)) {
    return <DetailPageGlassSkeleton />;
  }
  if (isError || !data) {
    return <p className="p-6 text-destructive">পণ্য নেই</p>;
  }

  const isLow = data.lowStockAlert > 0 && data.stockOnHand < data.lowStockAlert;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard/stock"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← স্টক তালিকা
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{data.name}</h1>
        <p className="text-muted-foreground">
          ক্যাটাগরি: {data.category || "—"} · কোড: {data.sku ?? "—"}
        </p>
      </div>

      <Card className={cn(isLow && "border-destructive ring-2 ring-destructive/25")}>
        <CardHeader>
          <CardTitle>মজুদ ও দর</CardTitle>
          {isLow ? (
            <CardDescription className="text-destructive">
              কম মজুদ সতর্কতা
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">মজুদ</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isLow ? "text-destructive" : "",
              )}
            >
              {data.stockOnHand} {data.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ক্রয়</p>
            <p className="text-xl font-semibold">{formatTaka(data.buyPrice)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">বিক্রয়</p>
            <p className="text-xl font-semibold">{formatTaka(data.unitPrice)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>মজুদ সমন্বয়</CardTitle>
          <CardDescription>প্রতিবার স্টক লগ তৈরি হবে</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (v) => {
                await adjust.mutateAsync({
                  direction: v.direction,
                  quantity: v.quantity,
                  note: v.note,
                });
                form.reset({ direction: v.direction, quantity: 1, note: "" });
              })}
            >
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ধরন</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
                        {...field}
                      >
                        <option value="add">যোগ</option>
                        <option value="remove">বাদ</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পরিমাণ</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>নোট</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={adjust.isPending}>
                <InlineLoadingLabel
                  loading={adjust.isPending}
                  idle="সমন্বয় সেভ"
                  loadingLabel="সংরক্ষণ হচ্ছে…"
                />
              </Button>
            </form>
          </Form>
          {adjust.isError ? (
            <p className="mt-2 text-sm text-destructive">
              {(adjust.error as { response?: { data?: { error?: string } } })?.response
                ?.data?.error ?? "ব্যর্থ"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>স্টক লগ</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {!data.stockLogs.length ? (
            <p className="p-6 text-muted-foreground">কোনো লগ নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>সময়</TableHead>
                  <TableHead>কারণ</TableHead>
                  <TableHead className="text-right">পরিবর্তন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stockLogs.map((l) => {
                  const pos = l.quantityDelta > 0;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell>{stockLogReasonBn(l.reason)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          pos ? "text-emerald-700" : "text-destructive",
                        )}
                      >
                        {pos ? "+" : ""}
                        {l.quantityDelta}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
