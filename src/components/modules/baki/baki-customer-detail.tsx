"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MessageSquareText } from "lucide-react";
import Decimal from "decimal.js";
import { useSession } from "next-auth/react";

import {
  useBakiCustomerDetail,
  useBakiEntryMutation,
  useSmsReminderMutation,
} from "@/hooks/dokandar";
import { addBakiSchema, takePaymentSchema } from "@/lib/validations/baki";
import { formatBakiLabel } from "@/lib/baki/ledger";
import { formatTaka } from "@/lib/baki/format-money";
import type { CustomerLedgerPdfInput } from "@/lib/reports/types";
import { PdfCustomerLedgerButton } from "@/components/modules/reports/pdf-customer-ledger-button";
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

type Props = { customerId: string };

export function BakiCustomerDetail({ customerId }: Props) {
  const { status, data: authSession } = useSession();
  const { data, isPending, isError } = useBakiCustomerDetail(customerId);
  const entryMut = useBakiEntryMutation(customerId);
  const smsMut = useSmsReminderMutation(customerId);
  const [smsMsg, setSmsMsg] = useState<string | null>(null);

  const addForm = useForm<z.infer<typeof addBakiSchema>>({
    resolver: zodResolver(addBakiSchema),
    defaultValues: { amountTaka: "", note: "" },
  });

  const payForm = useForm<z.infer<typeof takePaymentSchema>>({
    resolver: zodResolver(takePaymentSchema),
    defaultValues: { amountTaka: "", note: "" },
  });

  const ledgerPdfInput = useMemo((): CustomerLedgerPdfInput | null => {
    if (!data) return null;
    return {
      shopName: authSession?.user?.shopName ?? "দোকান",
      customerName: data.customer.name,
      customerPhone: data.customer.phone,
      balance: data.balance,
      entries: data.entries.map((e) => ({
        recordedAt: e.recordedAt,
        entryType: e.entryType,
        amount: e.amount,
        description: e.description,
      })),
    };
  }, [data, authSession?.user?.shopName]);

  if (status === "loading" || (isPending && !data)) {
    return <p className="p-6 text-lg text-muted-foreground">লোড হচ্ছে…</p>;
  }
  if (isError || !data) {
    return <p className="p-6 text-lg text-destructive">গ্রাহক পাওয়া যায়নি</p>;
  }

  const balance = new Decimal(data.balance);

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard/baki"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← বাকি খাতা
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{data.customer.name}</h1>
        <p className="text-muted-foreground">{data.customer.phone ?? "মোবাইল নেই"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>মোট বাকি</CardTitle>
          <CardDescription>সব লেনদেনের যোগফল</CardDescription>
        </CardHeader>
        <CardContent>
          <p
            className={
              balance.gt(0)
                ? "text-3xl font-extrabold text-destructive sm:text-4xl"
                : "text-3xl font-extrabold text-emerald-700 sm:text-4xl"
            }
          >
            {formatTaka(data.balance)}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 min-h-[48px] gap-2 rounded-xl border-2 border-foreground/20 text-base font-semibold"
          disabled={!data.customer.phone || smsMut.isPending}
          onClick={async () => {
            setSmsMsg(null);
            try {
              const res = await smsMut.mutateAsync();
              setSmsMsg(res.message);
            } catch {
              setSmsMsg("এসএমএস পাঠানো যায়নি");
            }
          }}
        >
          <MessageSquareText className="h-5 w-5" />
          এসএমএস রিমাইন্ডার পাঠান
        </Button>
        {smsMsg ? <p className="text-sm text-muted-foreground">{smsMsg}</p> : null}
        {!data.customer.phone ? (
          <p className="text-sm text-muted-foreground">এসএমএসের জন্য মোবাইল যোগ করুন</p>
        ) : null}
      </div>

      <PdfCustomerLedgerButton input={ledgerPdfInput} className="w-full sm:w-auto" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle>বাকি যোগ</CardTitle>
            <CardDescription>পাওনা বাড়বে</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...addForm}>
              <form
                className="space-y-3"
                onSubmit={addForm.handleSubmit(async (v) => {
                  await entryMut.mutateAsync({
                    kind: "ADD_BAKI",
                    amountTaka: v.amountTaka,
                    note: v.note,
                  });
                  addForm.reset({ amountTaka: "", note: "" });
                })}
              >
                <FormField
                  control={addForm.control}
                  name="amountTaka"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>টাকা</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
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
                <Button
                  type="submit"
                  disabled={entryMut.isPending}
                  className="h-12 min-h-[48px] text-base"
                >
                  {entryMut.isPending ? "সংরক্ষণ…" : "সেভ করুন"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle>জমা নিন</CardTitle>
            <CardDescription>বাকি কমবে</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...payForm}>
              <form
                className="space-y-3"
                onSubmit={payForm.handleSubmit(async (v) => {
                  await entryMut.mutateAsync({
                    kind: "PAYMENT",
                    amountTaka: v.amountTaka,
                    note: v.note,
                  });
                  payForm.reset({ amountTaka: "", note: "" });
                })}
              >
                <FormField
                  control={payForm.control}
                  name="amountTaka"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>জমা (টাকা)</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={payForm.control}
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
                <Button
                  type="submit"
                  disabled={entryMut.isPending}
                  className="h-12 min-h-[48px] text-base"
                >
                  {entryMut.isPending ? "সংরক্ষণ…" : "জমা সেভ"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {entryMut.isError ? (
        <p className="text-sm text-destructive">
          {(entryMut.error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error ?? "সমস্যা হয়েছে"}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>লেনদেনের ইতিহাস</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {!data.entries.length ? (
            <p className="p-6 text-muted-foreground">কোনো লেনদেন নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>সময়</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead className="text-right">টাকা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((e) => {
                  const amt = new Decimal(e.amount);
                  const pay = amt.lt(0) || e.entryType === "PAYMENT";
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(e.recordedAt).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell>{formatBakiLabel(e.entryType)}</TableCell>
                      <TableCell
                        className={
                          pay
                            ? "text-right font-semibold text-emerald-700"
                            : "text-right font-semibold text-destructive"
                        }
                      >
                        {pay ? `− ${formatTaka(amt.abs())}` : `+ ${formatTaka(amt)}`}
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
