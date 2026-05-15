/**
 * RabbitMQ background worker — run alongside the Next.js app:
 *   npm run worker
 *
 * Requires RABBITMQ_URL (CloudAMQP amqps://) + SSL Wireless vars for SMS jobs.
 * Uses NODE_OPTIONS=--use-system-ca for TLS on Windows (see package.json).
 */
import "dotenv/config";

import { applyCacheInvalidate } from "@/lib/queue/publish";
import { consumeJobs } from "@/lib/queue/rabbitmq";
import type { QueueJob } from "@/lib/queue/types";
import { formatOtpSmsMessage, sendSslWirelessSms } from "@/lib/sms";

async function handleJob(job: QueueJob): Promise<void> {
  switch (job.type) {
    case "sms.otp": {
      const { phone, code, csmsId } = job.payload;
      const message = formatOtpSmsMessage(code);
      const result = await sendSslWirelessSms({ toPhone: phone, message, csmsId });
      if (!result.ok) {
        throw new Error(result.error ?? "SMS failed");
      }
      // eslint-disable-next-line no-console
      console.info(`[worker] OTP SMS sent to ${phone}`);
      break;
    }
    case "sms.raw": {
      const { phone, message, csmsId } = job.payload;
      const result = await sendSslWirelessSms({ toPhone: phone, message, csmsId });
      if (!result.ok) {
        throw new Error(result.error ?? "SMS failed");
      }
      // eslint-disable-next-line no-console
      console.info(`[worker] SMS sent to ${phone}`);
      break;
    }
    case "cache.invalidate": {
      const { shopId, scope, date } = job.payload;
      await applyCacheInvalidate(shopId, scope, date);
      // eslint-disable-next-line no-console
      console.info(`[worker] cache invalidated shop=${shopId} scope=${scope}`);
      break;
    }
    default: {
      const _exhaustive: never = job;
      throw new Error(`Unknown job type: ${(_exhaustive as QueueJob).type}`);
    }
  }
}

async function main() {
  if (!process.env.RABBITMQ_URL?.trim()) {
    // eslint-disable-next-line no-console
    console.error("Set RABBITMQ_URL in .env (e.g. amqp://guest:guest@localhost:5672)");
    process.exit(1);
  }

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));

  await consumeJobs(handleJob);
}

main().catch((e) => {
  console.error("[worker] fatal:", e);
  process.exit(1);
});
