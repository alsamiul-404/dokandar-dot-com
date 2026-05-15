import { NextResponse } from "next/server";

import { getInfraStatus } from "@/lib/infra/cloud-env";
import { getPrisma } from "@/lib/prisma";
import { pingRabbitMq } from "@/lib/queue/rabbitmq";
import { getRedisBackend, getRedisStore } from "@/lib/redis/store";

export async function GET() {
  const infra = getInfraStatus();

  const checks: Record<string, "ok" | "skip" | "fail"> = {
    api: "ok",
    database: "skip",
    redis: infra.redis.configured ? "skip" : "skip",
    rabbitmq: infra.rabbitmq.configured ? "skip" : "skip",
  };

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "fail";
  }

  if (infra.redis.configured) {
    const store = await getRedisStore();
    if (store && (await store.ping())) {
      checks.redis = "ok";
    } else {
      checks.redis = "fail";
    }
  }

  if (infra.rabbitmq.configured) {
    checks.rabbitmq = (await pingRabbitMq()) ? "ok" : "fail";
  }

  const healthy = Object.values(checks).every((v) => v !== "fail");

  return NextResponse.json(
    {
      ok: healthy,
      service: "dokandar-app",
      checks,
      infra: {
        mode: "cloud",
        redisBackend: getRedisBackend(),
        productionReady: infra.productionReady,
        hints: infra.hints,
      },
      features: {
        redisCache: checks.redis === "ok",
        rabbitmqQueue: checks.rabbitmq === "ok",
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
