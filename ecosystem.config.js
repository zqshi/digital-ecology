module.exports = {
  apps: [
    {
      name: "mission-broker",
      script: "npm",
      args: "run start:mission-broker",
      cwd: "/Users/zqs/Downloads/project/digital ecology",
      env: {
        NODE_ENV: "production",
        HOST: process.env.HOST || "127.0.0.1",
        PORT: process.env.MISSION_PORT || "8081",
        DATABASE_URL: process.env.DATABASE_URL,
        KAFKA_BROKERS: process.env.KAFKA_BROKERS,
        OPA_URL: process.env.OPA_URL
      }
    },
    {
      name: "runtime-gateway",
      script: "npm",
      args: "run start:runtime-gateway",
      cwd: "/Users/zqs/Downloads/project/digital ecology",
      env: {
        NODE_ENV: "production",
        HOST: process.env.HOST || "127.0.0.1",
        PORT: process.env.RUNTIME_GATEWAY_PORT || "8082",
        DATABASE_URL: process.env.DATABASE_URL,
        KAFKA_BROKERS: process.env.KAFKA_BROKERS,
        OPA_URL: process.env.OPA_URL
      }
    },
    {
      name: "bootstrap-loop",
      script: "npm",
      args: "run start:bootstrap-loop",
      cwd: "/Users/zqs/Downloads/project/digital ecology",
      env: {
        NODE_ENV: "production",
        MISSION_BASE: `http://${process.env.HOST || "127.0.0.1"}:${process.env.MISSION_PORT || "8081"}`,
        BOOTSTRAP_INTERVAL_MS: process.env.BOOTSTRAP_INTERVAL_MS || "60000",
        BOOTSTRAP_MAX_BUDGET: process.env.BOOTSTRAP_MAX_BUDGET || "50",
        BOOTSTRAP_ACTOR_ID: process.env.BOOTSTRAP_ACTOR_ID || "bootstrap-loop",
        AUTONOMY_MODE: process.env.AUTONOMY_MODE || "SUPERVISED",
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: "mode-guardian",
      script: "npm",
      args: "run start:mode-guardian",
      cwd: "/Users/zqs/Downloads/project/digital ecology",
      env: {
        NODE_ENV: "production",
        MODE_GUARDIAN_INTERVAL_MS: process.env.MODE_GUARDIAN_INTERVAL_MS || "60000",
        DATABASE_URL: process.env.DATABASE_URL,
        KAFKA_BROKERS: process.env.KAFKA_BROKERS
      }
    },
    {
      name: "signal-collector",
      script: "npm",
      args: "run start:signal-collector",
      cwd: "/Users/zqs/Downloads/project/digital ecology",
      env: {
        NODE_ENV: "production",
        SIGNAL_COLLECTOR_INTERVAL_MS: process.env.SIGNAL_COLLECTOR_INTERVAL_MS || "60000",
        L3_HARD_STOP_THRESHOLD: process.env.L3_HARD_STOP_THRESHOLD || "3",
        BOOTSTRAP_ACTOR_ID: process.env.BOOTSTRAP_ACTOR_ID || "bootstrap-loop",
        DATABASE_URL: process.env.DATABASE_URL
      }
    }
  ]
};
