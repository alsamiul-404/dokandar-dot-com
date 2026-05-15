"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateProduct, useStockProducts } from "@/hooks/dokandar";
import { newProductSchema, type NewProductInput } from "@/lib/validations/stock";
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
import { AutocompleteInput } from "@/components/shared/autocomplete-input";
import { Input } from "@/components/ui/input";
import { mergeCategorySuggestions } from "@/lib/form-suggestions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModulePageGlassSkeleton } from "@/components/shared/module-loading-skeleton";
import { InlineLoadingLabel } from "@/components/shared/loading-status";

export function StockModule() {
  const { status } = useSession();
  const { data, isPending, isError } = useStockProducts();
  const createProduct = useCreateProduct();

  const form = useForm<z.infer<typeof newProductSchema>>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      name: "",
      category: "",
      sku: "",
      buyPriceTaka: "",
      sellPriceTaka: "",
      lowStockAlert: 5,
      initialQty: 0,
    },
  });

  const shopCategories = useMemo(
    () => (data ?? []).map((p) => p.category).filter(Boolean),
    [data],
  );

  if (status === "loading" || (isPending && !data)) {
    return <ModulePageGlassSkeleton sections={2} />;
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← ড্যাশবোর্ড
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">স্টক / মজুদ</h1>
        <p className="text-muted-foreground">কম মজুদ লাল চিহ্নিত — বিস্তারিতে সমন্বয়</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>নতুন পণ্য</CardTitle>
          <CardDescription>ক্রয়/বিক্রয় দর ও সতর্কতা স্তর</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={form.handleSubmit(async (values) => {
                await createProduct.mutateAsync(values as NewProductInput);
                form.reset({
                  name: "",
                  category: "",
                  sku: "",
                  buyPriceTaka: "",
                  sellPriceTaka: "",
                  lowStockAlert: 5,
                  initialQty: 0,
                });
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>নাম</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ক্যাটাগরি</FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        value={field.value}
                        onChange={field.onChange}
                        suggestions={mergeCategorySuggestions(shopCategories, field.value)}
                        placeholder="লিখুন — মুদি, তেল-মসলা…"
                        emptyHint="ক্যাটাগরি লিখুন — পরামর্শ আসবে"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>কোড</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buyPriceTaka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ক্রয় দর</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellPriceTaka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বিক্রয় দর</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockAlert"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>কম মজুদ সতর্কতা</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>শুরুর মজুদ</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={createProduct.isPending}>
                  <InlineLoadingLabel
                    loading={createProduct.isPending}
                    idle="পণ্য যোগ করুন"
                    loadingLabel="সংরক্ষণ হচ্ছে…"
                  />
                </Button>
              </div>
            </form>
          </Form>
          {createProduct.isError ? (
            <p className="mt-2 text-sm text-destructive">
              {(createProduct.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "ব্যর্থ"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>পণ্য তালিকা</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isError ? (
            <p className="p-6 text-destructive">ডাটা আনা যায়নি</p>
          ) : !data?.length ? (
            <p className="p-6 text-muted-foreground">কোনো পণ্য নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden md:table-cell">ক্যাটাগরি</TableHead>
                  <TableHead className="text-right">মজুদ</TableHead>
                  <TableHead className="text-right">ক্রয়</TableHead>
                  <TableHead className="text-right">বিক্রয়</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => {
                  const isLow = p.lowStockAlert > 0 && p.stockOnHand < p.lowStockAlert;
                  return (
                    <TableRow
                      key={p.id}
                      className={cn(
                        isLow && "bg-destructive/10 ring-1 ring-destructive/30",
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{p.name}</span>
                          {isLow ? (
                            <span className="text-xs font-bold text-destructive">
                              কম মজুদ
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {p.category || "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          isLow ? "text-destructive" : "",
                        )}
                      >
                        {p.stockOnHand}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(p.buyPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTaka(p.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/stock/${p.id}`}>বিস্তারিত</Link>
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
