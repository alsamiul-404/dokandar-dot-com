import type { Channel } from "amqplib";

import { connectAmqp } from "@/lib/queue/amqp-connect";
import { QUEUE_NAME, type QueueJob } from "@/lib/queue/types";

type AmqpConnection = Awaited<ReturnType<typeof connectAmqp>>;

const globalForAmqp = globalThis as unknown as {
  amqpConn?: AmqpConnection;
  amqpCh?: Channel;
  amqpDisabled?: boolean;
};

export function isRabbitMqEnabled(): boolean {
  return Boolean(process.env.RABBITMQ_URL?.trim()) && globalForAmqp.amqpDisabled !== true;
}

export async function pingRabbitMq(): Promise<boolean> {
  if (!process.env.RABBITMQ_URL?.trim()) return false;
  try {
    const conn = await connectAmqp();
    await conn.close();
    return true;
  } catch {
    return false;
  }
}

async function getChannel(): Promise<Channel | null> {
  if (globalForAmqp.amqpDisabled) return null;
  if (!process.env.RABBITMQ_URL?.trim()) return null;

  if (globalForAmqp.amqpCh && globalForAmqp.amqpConn) {
    return globalForAmqp.amqpCh;
  }

  try {
    const conn = await connectAmqp();
    const ch = await conn.createChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });

    conn.on("error", () => {
      globalForAmqp.amqpConn = undefined;
      globalForAmqp.amqpCh = undefined;
    });
    conn.on("close", () => {
      globalForAmqp.amqpConn = undefined;
      globalForAmqp.amqpCh = undefined;
    });

    globalForAmqp.amqpConn = conn;
    globalForAmqp.amqpCh = ch;
    return ch;
  } catch (e) {
    globalForAmqp.amqpDisabled = true;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[rabbitmq] unavailable:", e instanceof Error ? e.message : e);
    }
    return null;
  }
}

export async function publishJob(job: QueueJob): Promise<boolean> {
  const ch = await getChannel();
  if (!ch) return false;

  try {
    ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      contentType: "application/json",
    });
    return true;
  } catch {
    globalForAmqp.amqpCh = undefined;
    globalForAmqp.amqpConn = undefined;
    return false;
  }
}

export async function consumeJobs(
  handler: (job: QueueJob) => Promise<void>,
): Promise<void> {
  const conn = await connectAmqp();
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE_NAME, { durable: true });
  ch.prefetch(10);

  // eslint-disable-next-line no-console
  console.info(`[worker] consuming queue "${QUEUE_NAME}"`);

  await ch.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;
    try {
      const job = JSON.parse(msg.content.toString()) as QueueJob;
      await handler(job);
      ch.ack(msg);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[worker] job failed:", e);
      ch.nack(msg, false, false);
    }
  });

  await new Promise<void>(() => {
    /* run until SIGINT */
  });
}
