export type DailySalesLineRow = {
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type DailySalesSaleRow = {
  id: string;
  soldAt: string;
  totalAmount: string;
  cashPaid: string;
  creditAmount: string;
  customerName: string | null;
  lines: DailySalesLineRow[];
};

export type DailySalesReport = {
  date: string;
  shopName: string;
  saleCount: number;
  totalSales: string;
  cash: string;
  baki: string;
  sales: DailySalesSaleRow[];
};

export type ProfitReport = {
  date: string;
  shopName: string;
  revenue: string;
  costOnBooks: string;
  grossProfit: string;
  unitsSold: number;
  lineCount: number;
};

export type CustomerLedgerPdfInput = {
  shopName: string;
  customerName: string;
  customerPhone: string | null;
  balance: string;
  entries: {
    recordedAt: string;
    entryType: string;
    amount: string;
    description: string | null;
  }[];
};
