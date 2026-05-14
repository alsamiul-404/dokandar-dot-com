"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useBakiCustomers, useCreateCustomer } from "@/hooks/dokandar";
import { newCustomerSchema } from "@/lib/validations/baki";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableSkeleton } from "@/components/shared/module-loading-skeleton";
import { InlineLoadingLabel, ReportLoadingBanner } from "@/components/shared/loading-status";

export function BakiModule() {
  const { data, isLoading, isError } = useBakiCustomers();
  const createCustomer = useCreateCustomer();

  const form = useForm<z.infer<typeof newCustomerSchema>>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { name: "", phone: "" },
  });

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← ড্যাশবোর্ড
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">বাকি খাতা</h1>
        <p className="text-muted-foreground">গ্রাহক ও মোট বাকি — বিস্তারিতে টিপ দিন</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন গ্রাহক</CardTitle>
          <CardDescription>নাম ও মোবাইল (ঐচ্ছিক) যোগ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await createCustomer.mutateAsync(values);
                  form.reset({ name: "", phone: "" });
                } catch {
                  // axios error surfaced below
                }
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="min-w-[12rem] flex-1">
                    <FormLabel>নাম</FormLabel>
                    <FormControl>
                      <Input placeholder="করিম ভাই" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="min-w-[12rem] flex-1">
                    <FormLabel>মোবাইল</FormLabel>
                    <FormControl>
                      <Input placeholder="০১৭১২…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="h-12 min-w-[10rem]"
                disabled={createCustomer.isPending}
              >
                <InlineLoadingLabel
                  loading={createCustomer.isPending}
                  idle="গ্রাহক যোগ করুন"
                  loadingLabel="সংরক্ষণ হচ্ছে…"
                />
              </Button>
            </form>
          </Form>
          {createCustomer.isError ? (
            <p className="mt-2 text-sm text-destructive">
              {(createCustomer.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "সংরক্ষণ ব্যর্থ"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>গ্রাহক তালিকা</CardTitle>
          <CardDescription>মোট বাকি (টাকা)</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="space-y-4 p-4 sm:p-6">
              <ReportLoadingBanner
                title="গ্রাহক তালিকা লোড হচ্ছে…"
                hint="বাকি খাতার গ্রাহক ও মোট পাওনা আনা হচ্ছে"
              />
              <DataTableSkeleton rows={6} />
            </div>
          ) : isError ? (
            <p className="p-6 text-destructive">ডাটা আনা যায়নি</p>
          ) : !data?.length ? (
            <p className="p-6 text-muted-foreground">কোনো গ্রাহক নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">মোবাইল</TableHead>
                  <TableHead className="text-right">মোট বাকি</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => {
                  const due = Number(c.totalDue);
                  const low = due > 0;
                  return (
                    <TableRow key={c.id} className={cn(low && "bg-destructive/5")}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          low ? "text-destructive" : "text-emerald-700",
                        )}
                      >
                        {formatTaka(c.totalDue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/baki/${c.id}`}>বিস্তারিত</Link>
                        </Button>
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
