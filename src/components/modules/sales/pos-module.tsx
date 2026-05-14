"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Decimal from "decimal.js";

import {
  useBakiCustomers,
  useCheckoutMutation,
  useStockProducts,
} from "@/hooks/dokandar";
import { PdfDailySalesButton } from "@/components/modules/reports/pdf-daily-sales-button";
import { formatTaka } from "@/lib/baki/format-money";
import { checkoutSchema } from "@/lib/validations/sales";
import { zodFirstError } from "@/lib/validations/common";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PosModuleSkeleton } from "@/components/shared/module-loading-skeleton";
import { InlineLoadingLabel } from "@/components/shared/loading-status";

type Line = { productId: string; name: string; quantity: number; unitPrice: string };

export function PosModule() {
  const { status } = useSession();
  const { data: products, isPending: pLoad } = useStockProducts();
  const { data: customers } = useBakiCustomers();
  const checkout = useCheckoutMutation();

  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [lines, setLines] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [cashPaid, setCashPaid] = useState("");
  const [creditAmt, setCreditAmt] = useState("0");
  const [notes, setNotes] = useState("");
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const total = useMemo(() => {
    let t = new Decimal(0);
    for (const l of lines) {
      t = t.plus(new Decimal(l.unitPrice).mul(l.quantity));
    }
    return t;
  }, [lines]);

  if (status === "loading" || (pLoad && !products)) {
    return <PosModuleSkeleton />;
  }

  function addLine() {
    const p = products?.find((x) => x.id === pickProduct);
    const q = Math.max(1, Math.floor(Number(pickQty) || 1));
    if (!p) return;
    setLines((prev) => [
      ...prev.filter((l) => l.productId !== p.id),
      {
        productId: p.id,
        name: p.name,
        quantity: q,
        unitPrice: p.unitPrice,
      },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.productId !== id));
  }

  async function submit() {
    if (!lines.length) return;
    setCheckoutErr(null);
    const credit = new Decimal(creditAmt || "0");
    if (credit.gt(0) && !customerId) {
      setCheckoutErr("বাকি বিক্রয়ের জন্য গ্রাহক বাছাই করুন");
      return;
    }
    const parsed = checkoutSchema.safeParse({
      customerId: customerId || undefined,
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      cashPaidTaka: cashPaid.trim(),
      creditAmountTaka: creditAmt.trim() || "0",
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      setCheckoutErr(zodFirstError(parsed.error));
      return;
    }
    try {
      await checkout.mutateAsync(parsed.data);
      setLines([]);
      setCashPaid("");
      setCreditAmt("0");
      setCustomerId("");
      setNotes("");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "বিক্রয় ব্যর্থ";
      setCheckoutErr(msg);
    }
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← ড্যাশবোর্ড
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">দৈনিক বিক্রি (POS)</h1>
        <p className="text-muted-foreground">
          পণ্য যোগ করুন, নগদ ও বাকি লিখে বিক্রয় নিশ্চিত করুন
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>লাইন যোগ</CardTitle>
          <CardDescription>পণ্য ও পরিমাণ</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="min-w-[10rem] flex-1 space-y-2">
            <Label htmlFor="pos-p">পণ্য</Label>
            <select
              id="pos-p"
              className="flex h-14 min-h-[56px] w-full rounded-xl border-2 border-input bg-background px-3 text-lg font-medium"
              value={pickProduct}
              onChange={(e) => setPickProduct(e.target.value)}
            >
              <option value="">বাছাই করুন</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (মজুদ {p.stockOnHand})
                </option>
              ))}
            </select>
          </div>
          <div className="w-28 space-y-2">
            <Label htmlFor="pos-q">পরিমাণ</Label>
            <Input
              id="pos-q"
              type="number"
              min={1}
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="mt-6 h-14 min-h-[56px] text-lg"
            onClick={addLine}
          >
            লাইনে যোগ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>বিল</CardTitle>
          <CardDescription>মোট: {formatTaka(total)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0 sm:p-6">
          {!lines.length ? (
            <p className="px-6 py-4 text-muted-foreground">কোনো লাইন নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পণ্য</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-right">দর</TableHead>
                  <TableHead className="text-right">সারি</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.productId}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTaka(l.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatTaka(new Decimal(l.unitPrice).mul(l.quantity))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(l.productId)}
                      >
                        বাদ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="grid gap-3 border-t px-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>গ্রাহক (বাকির জন্য)</Label>
              <select
                className="flex h-14 min-h-[56px] w-full rounded-xl border-2 border-input bg-background px-3 text-lg font-medium"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">নগদ-only / হাটে গ্রাহক</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>নোট</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>নগদ জমা (টাকা)</Label>
              <Input
                inputMode="decimal"
                value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)}
                placeholder="মোট বিলের নগদ অংশ"
              />
            </div>
            <div className="space-y-2">
              <Label>বাকি (টাকা)</Label>
              <Input
                inputMode="decimal"
                value={creditAmt}
                onChange={(e) => setCreditAmt(e.target.value)}
                placeholder="০"
              />
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              type="button"
              className="h-14 min-h-[56px] w-full text-lg sm:w-auto"
              disabled={checkout.isPending || !lines.length}
              onClick={() => void submit()}
            >
              <InlineLoadingLabel
                loading={checkout.isPending}
                idle="বিক্রয় নিশ্চিত করুন"
                loadingLabel="সংরক্ষণ হচ্ছে…"
              />
            </Button>
            {checkoutErr || checkout.isError ? (
              <p className="mt-2 text-sm text-destructive">
                {checkoutErr ??
                  (checkout.error as { response?: { data?: { error?: string } } })
                    ?.response?.data?.error ??
                  "ব্যর্থ"}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-foreground/15 shadow-sm">
        <CardHeader>
          <CardTitle>রিপোর্ট</CardTitle>
          <CardDescription>আজকের বিক্রয়ের বাংলা পিডিএফ</CardDescription>
        </CardHeader>
        <CardContent>
          <PdfDailySalesButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
