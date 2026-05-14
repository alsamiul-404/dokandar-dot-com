"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Decimal from "decimal.js";

import { api } from "@/lib/axios-instance";
import type { DailySalesReport, ProfitReport } from "@/lib/reports/types";
import type { CheckoutInput } from "@/lib/validations/sales";
import type { NewProductInput } from "@/lib/validations/stock";

export type BakiCustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  totalDue: string;
};

export type BakiCustomerDetail = {
  customer: { id: string; name: string; phone: string | null };
  balance: string;
  entries: {
    id: string;
    amount: string;
    entryType: string;
    description: string | null;
    recordedAt: string;
  }[];
};

export type StockProductRow = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  buyPrice: string;
  unitPrice: string;
  stockOnHand: number;
  lowStockAlert: number;
  unit: string;
};

export type StockProductDetail = StockProductRow & {
  stockLogs: {
    id: string;
    quantityDelta: number;
    reason: string;
    note: string | null;
    createdAt: string;
  }[];
};

export type SalesSummary = {
  date: string;
  saleCount: number;
  totalSales: string;
  cash: string;
  baki: string;
};

function useShopEnabled() {
  const { data: session, status } = useSession();
  const shopId = session?.user?.shopId;
  return {
    enabled: status === "authenticated" && !!shopId,
    shopId,
    status,
  };
}

export function useBakiCustomers() {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["baki", "customers"],
    queryFn: async () => {
      const { data } = await api.get<BakiCustomerRow[]>("/baki/customers");
      return data;
    },
    enabled,
  });
}

export function useBakiCustomerDetail(id: string | undefined) {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["baki", "customer", id],
    queryFn: async () => {
      const { data } = await api.get<BakiCustomerDetail>(`/baki/customers/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; phone?: string }) => {
      const { data } = await api.post("/baki/customers", payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["baki", "customers"] });
    },
  });
}

type BakiEntryCtx = {
  prevDetail?: BakiCustomerDetail;
  prevList?: BakiCustomerRow[];
};

export function useBakiEntryMutation(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      kind: "ADD_BAKI" | "PAYMENT";
      amountTaka: string;
      note?: string;
    }) => {
      await api.post(`/baki/customers/${customerId}/entries`, payload);
    },
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: ["baki", "customer", customerId] });
      await qc.cancelQueries({ queryKey: ["baki", "customers"] });

      const prevDetail = qc.getQueryData<BakiCustomerDetail>([
        "baki",
        "customer",
        customerId,
      ]);
      const prevList = qc.getQueryData<BakiCustomerRow[]>(["baki", "customers"]);

      const amount = new Decimal(variables.amountTaka);
      const balanceDelta = variables.kind === "ADD_BAKI" ? amount : amount.neg();
      const entryAmountStr =
        variables.kind === "ADD_BAKI" ? amount.toFixed(2) : amount.neg().toFixed(2);
      const entryType = variables.kind === "ADD_BAKI" ? "ADJUSTMENT" : "PAYMENT";

      if (prevDetail) {
        const newBal = new Decimal(prevDetail.balance).plus(balanceDelta).toFixed(2);
        const optimisticEntry: BakiCustomerDetail["entries"][number] = {
          id: `optimistic-${Date.now()}`,
          amount: entryAmountStr,
          entryType,
          description: variables.note?.trim() ?? null,
          recordedAt: new Date().toISOString(),
        };
        qc.setQueryData(["baki", "customer", customerId], {
          ...prevDetail,
          balance: newBal,
          entries: [optimisticEntry, ...prevDetail.entries],
        });
      }

      if (prevList) {
        qc.setQueryData(
          ["baki", "customers"],
          prevList.map((c) =>
            c.id !== customerId
              ? c
              : {
                  ...c,
                  totalDue: new Decimal(c.totalDue).plus(balanceDelta).toFixed(2),
                },
          ),
        );
      }

      return { prevDetail, prevList } satisfies BakiEntryCtx;
    },
    onError: (_err, _vars, ctx) => {
      const c = ctx as BakiEntryCtx | undefined;
      if (c?.prevDetail !== undefined) {
        qc.setQueryData(["baki", "customer", customerId], c.prevDetail);
      }
      if (c?.prevList !== undefined) {
        qc.setQueryData(["baki", "customers"], c.prevList);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["baki", "customer", customerId] });
      void qc.invalidateQueries({ queryKey: ["baki", "customers"] });
    },
  });
}

export function useSmsReminderMutation(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>(
        `/baki/customers/${customerId}/sms`,
      );
      return data;
    },
  });
}

export function useStockProducts() {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["stock", "products"],
    queryFn: async () => {
      const { data } = await api.get<StockProductRow[]>("/stock/products");
      return data;
    },
    enabled,
  });
}

export function useStockProductDetail(id: string | undefined) {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["stock", "product", id],
    queryFn: async () => {
      const { data } = await api.get<StockProductDetail>(`/stock/products/${id}`);
      return data;
    },
    enabled: enabled && !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewProductInput) => {
      await api.post("/stock/products", payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["stock", "products"] });
    },
  });
}

type AdjustStockCtx = {
  prevDetail?: StockProductDetail;
  prevList?: StockProductRow[];
};

export function useAdjustStockMutation(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      direction: "add" | "remove";
      quantity: number;
      note?: string;
    }) => {
      await api.post(`/stock/products/${productId}/adjust`, payload);
    },
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: ["stock", "product", productId] });
      await qc.cancelQueries({ queryKey: ["stock", "products"] });

      const delta =
        variables.direction === "add" ? variables.quantity : -variables.quantity;

      const prevDetail = qc.getQueryData<StockProductDetail>([
        "stock",
        "product",
        productId,
      ]);
      const prevList = qc.getQueryData<StockProductRow[]>(["stock", "products"]);

      if (prevDetail) {
        const nextStock = prevDetail.stockOnHand + delta;
        const optimisticLog: StockProductDetail["stockLogs"][number] = {
          id: `optimistic-${Date.now()}`,
          quantityDelta: delta,
          reason: "ADJUSTMENT",
          note: variables.note?.trim() ?? null,
          createdAt: new Date().toISOString(),
        };
        qc.setQueryData(["stock", "product", productId], {
          ...prevDetail,
          stockOnHand: Math.max(0, nextStock),
          stockLogs: [optimisticLog, ...prevDetail.stockLogs],
        });
      }

      if (prevList) {
        qc.setQueryData(
          ["stock", "products"],
          prevList.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stockOnHand: Math.max(0, p.stockOnHand + delta),
                }
              : p,
          ),
        );
      }

      return { prevDetail, prevList } satisfies AdjustStockCtx;
    },
    onError: (_err, _vars, ctx) => {
      const c = ctx as AdjustStockCtx | undefined;
      if (c?.prevDetail !== undefined) {
        qc.setQueryData(["stock", "product", productId], c.prevDetail);
      }
      if (c?.prevList !== undefined) {
        qc.setQueryData(["stock", "products"], c.prevList);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["stock", "products"] });
      void qc.invalidateQueries({ queryKey: ["stock", "product", productId] });
    },
  });
}

export function useSalesSummary(date?: string) {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["sales", "summary", date ?? "today"],
    queryFn: async () => {
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      const { data } = await api.get<SalesSummary>(`/sales/summary${q}`);
      return data;
    },
    enabled,
  });
}

export function useDailySalesReport(date?: string) {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["reports", "daily-sales", date ?? "today"],
    queryFn: async () => {
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      const { data } = await api.get<DailySalesReport>(`/reports/daily-sales${q}`);
      return data;
    },
    enabled,
  });
}

export function useProfitReport(date?: string) {
  const { enabled } = useShopEnabled();
  return useQuery({
    queryKey: ["reports", "profit", date ?? "today"],
    queryFn: async () => {
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      const { data } = await api.get<ProfitReport>(`/reports/profit${q}`);
      return data;
    },
    enabled,
  });
}

export function useCheckoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CheckoutInput) => {
      const { data } = await api.post<{ ok: boolean; saleId: string }>(
        "/sales/checkout",
        payload,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["sales", "summary"] });
      void qc.invalidateQueries({ queryKey: ["reports", "daily-sales"] });
      void qc.invalidateQueries({ queryKey: ["reports", "profit"] });
      void qc.invalidateQueries({ queryKey: ["stock", "products"] });
      void qc.invalidateQueries({ queryKey: ["baki", "customers"] });
      if (variables.customerId) {
        void qc.invalidateQueries({
          queryKey: ["baki", "customer", variables.customerId],
        });
      }
    },
  });
}
