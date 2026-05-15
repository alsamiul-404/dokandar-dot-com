import { cacheDel, cacheDelByPrefix, cacheGet, cacheSet } from "@/lib/redis/cache";

const TTL = {
  stockProducts: 90,
  bakiCustomers: 90,
  salesSummary: 45,
  profitReport: 45,
  dailySales: 45,
  customerDetail: 60,
} as const;

export const shopCacheKeys = {
  stockProducts: (shopId: string) => `dokandar:shop:${shopId}:stock:products`,
  bakiCustomers: (shopId: string) => `dokandar:shop:${shopId}:baki:customers`,
  salesSummary: (shopId: string, date: string) =>
    `dokandar:shop:${shopId}:sales:summary:${date}`,
  profitReport: (shopId: string, date: string) =>
    `dokandar:shop:${shopId}:reports:profit:${date}`,
  dailySales: (shopId: string, date: string) =>
    `dokandar:shop:${shopId}:reports:daily-sales:${date}`,
  customerDetail: (shopId: string, customerId: string, limit: number, cursor?: string) =>
    `dokandar:shop:${shopId}:baki:customer:${customerId}:l${limit}:c${cursor ?? "0"}`,
};

export async function getCached<T>(key: string): Promise<T | null> {
  return cacheGet<T>(key);
}

export async function setCached(key: string, value: unknown, ttlSec: number): Promise<void> {
  await cacheSet(key, value, ttlSec);
}

export { TTL as shopCacheTtl };

export async function invalidateShopStock(shopId: string): Promise<void> {
  await cacheDel(shopCacheKeys.stockProducts(shopId));
}

export async function invalidateShopBaki(shopId: string): Promise<void> {
  await Promise.all([
    cacheDel(shopCacheKeys.bakiCustomers(shopId)),
    cacheDelByPrefix(`dokandar:shop:${shopId}:baki:customer:`),
  ]);
}

export async function invalidateShopSales(shopId: string, date?: string): Promise<void> {
  if (date) {
    await Promise.all([
      cacheDel(shopCacheKeys.salesSummary(shopId, date)),
      cacheDel(shopCacheKeys.profitReport(shopId, date)),
      cacheDel(shopCacheKeys.dailySales(shopId, date)),
    ]);
  } else {
    await cacheDelByPrefix(`dokandar:shop:${shopId}:sales:`);
    await cacheDelByPrefix(`dokandar:shop:${shopId}:reports:`);
  }
}

export async function invalidateAllShopCache(shopId: string): Promise<void> {
  await cacheDelByPrefix(`dokandar:shop:${shopId}:`);
}
