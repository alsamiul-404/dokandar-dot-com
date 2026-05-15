import { getRedisBackend } from "@/lib/redis/store";

export type InfraStatus = {
  redis: { configured: boolean; backend: string };
  rabbitmq: { configured: boolean };
  productionReady: boolean;
  hints: string[];
};

/**
 * Same cloud env vars for local dev and production (Upstash + CloudAMQP).
 * No Docker required — copy credentials from cloud dashboards into `.env` / Vercel.
 */
export function getInfraStatus(): InfraStatus {
  const redisBackend = getRedisBackend();
  const redisConfigured = redisBackend !== "none";
  const rabbitConfigured = Boolean(process.env.RABBITMQ_URL?.trim());

  const hints: string[] = [];
  if (!redisConfigured) {
    hints.push(
      "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (https://console.upstash.com)",
    );
  }
  if (!rabbitConfigured) {
    hints.push("Set RABBITMQ_URL from CloudAMQP (https://www.cloudamqp.com)");
  }
  if (rabbitConfigured && !process.env.WORKER_ENABLED?.trim()) {
    hints.push("Run `npm run worker` on Railway/Render (or locally) with the same RABBITMQ_URL");
  }

  const productionReady = redisConfigured && rabbitConfigured;

  return {
    redis: { configured: redisConfigured, backend: redisBackend },
    rabbitmq: { configured: rabbitConfigured },
    productionReady,
    hints,
  };
}

export function isCloudInfraRequired(): boolean {
  return process.env.REQUIRE_CLOUD_INFRA === "true" || process.env.NODE_ENV === "production";
}
