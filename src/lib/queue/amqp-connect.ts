import amqp from "amqplib";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

/**
 * Connect to CloudAMQP / RabbitMQ.
 * On Windows, run Node with `NODE_OPTIONS=--use-system-ca` (see npm run worker).
 */
export async function connectAmqp(): Promise<AmqpConnection> {
  const url = process.env.RABBITMQ_URL?.trim();
  if (!url) {
    throw new Error("RABBITMQ_URL is not set");
  }

  return amqp.connect(url, {
    heartbeat: 30,
    timeout: 20_000,
  });
}
