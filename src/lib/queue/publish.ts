import {
  invalidateAllShopCache,
  invalidateShopBaki,
  invalidateShopSales,
  invalidateShopStock,
} from "@/lib/cache/shop-cache";
import { isRabbitMqEnabled, publishJob } from "@/lib/queue/rabbitmq";
import type { QueueJob } from "@/lib/queue/types";
import { formatOtpSmsMessage, sendSslWirelessSms } from "@/lib/sms";

/** Queue OTP SMS (fast API response). Falls back to synchronous send. */
export async function dispatchOtpSms(
  phone: string,
  code: string,
): Promise<{ queued: boolean; sent: boolean; skipped: boolean; error?: string }> {
  const smsSkipped =
    process.env.SMS_DISABLE_SEND === "true" ||
    (process.env.NODE_ENV !== "production" && !process.env.SSL_WIRELESS_API_KEY?.trim());

  if (smsSkipped) {
    return { queued: false, sent: false, skipped: true };
  }

  const csmsId = `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const job: QueueJob = {
    type: "sms.otp",
    payload: { phone, code, csmsId },
  };

  if (isRabbitMqEnabled()) {
    const queued = await publishJob(job);
    if (queued) {
      return { queued: true, sent: true, skipped: false };
    }
  }

  const message = formatOtpSmsMessage(code);
  const result = await sendSslWirelessSms({ toPhone: phone, message, csmsId });
  return {
    queued: false,
    sent: result.ok,
    skipped: false,
    error: result.ok ? undefined : result.error,
  };
}

export async function dispatchCacheInvalidate(
  shopId: string,
  scope: "stock" | "baki" | "sales" | "all",
  date?: string,
): Promise<void> {
  const job: QueueJob = {
    type: "cache.invalidate",
    payload: { shopId, scope, date },
  };

  if (isRabbitMqEnabled() && (await publishJob(job))) {
    return;
  }

  await applyCacheInvalidate(shopId, scope, date);
}

export async function applyCacheInvalidate(
  shopId: string,
  scope: "stock" | "baki" | "sales" | "all",
  date?: string,
): Promise<void> {
  switch (scope) {
    case "stock":
      await invalidateShopStock(shopId);
      break;
    case "baki":
      await invalidateShopBaki(shopId);
      break;
    case "sales":
      await invalidateShopSales(shopId, date);
      break;
    case "all":
      await invalidateAllShopCache(shopId);
      break;
  }
}
