import "dotenv/config";

export const config = {
  dbUrl: process.env.DATABASE_URL || "postgres://de_user:de_pass@127.0.0.1:55432/digital_ecology",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "127.0.0.1:9092").split(","),
  opaUrl: process.env.OPA_URL || "http://127.0.0.1:8181/v1/data/digital_ecology/mission/allow",
  autonomyMode: process.env.AUTONOMY_MODE || "SUPERVISED",
};
