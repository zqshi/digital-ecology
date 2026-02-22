import { Kafka } from "kafkajs";
import { config } from "./config";

const kafka = new Kafka({ brokers: config.kafkaBrokers, clientId: "digital-ecology" });
const producer = kafka.producer();
let connected = false;

export async function emitEvent(topic: string, payload: unknown): Promise<void> {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
}
