/**
 * Verify cloud Redis (Upstash) + RabbitMQ (CloudAMQP) from your `.env`.
 *   npm run check:infra
 */
import "dotenv/config";

import { getInfraStatus } from "../src/lib/infra/cloud-env";
import { pingRabbitMq } from "../src/lib/queue/rabbitmq";
import { getRedisBackend, getRedisStore } from "../src/lib/redis/store";

async function main() {
  const infra = getInfraStatus();

  console.log("\n=== Dokandar cloud infra check ===\n");
  console.log("Redis backend:", getRedisBackend());

  if (!infra.redis.configured) {
    console.log("Redis: NOT CONFIGURED");
  } else {
    const store = await getRedisStore();
    const ok = store ? await store.ping() : false;
    console.log(ok ? "Redis: OK (connected)" : "Redis: FAIL (check Upstash credentials)");
  }

  if (!infra.rabbitmq.configured) {
    console.log("RabbitMQ: NOT CONFIGURED");
  } else {
    const ok = await pingRabbitMq();
    console.log(
      ok ? "RabbitMQ: OK (CloudAMQP connected)" : "RabbitMQ: FAIL (check RABBITMQ_URL)",
    );
  }

  if (infra.hints.length > 0) {
    console.log("\nHints:");
    for (const h of infra.hints) {
      console.log(`  • ${h}`);
    }
  }

  console.log(
    infra.productionReady
      ? "\n✓ Dev and production can use the same cloud URLs in .env / Vercel.\n"
      : "\n✗ Add missing env vars (see .env.example).\n",
  );

  process.exit(infra.productionReady ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
