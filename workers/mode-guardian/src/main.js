const fs = require("node:fs");
const path = require("node:path");

const INTERVAL_MS = Number(process.env.MODE_GUARDIAN_INTERVAL_MS || 60_000);
const SIGNALS_PATH = path.resolve(process.cwd(), "data/signals/bootstrap-signals.json");
const MODE_PATH = path.resolve(process.cwd(), "data/signals/autonomy-mode.json");
const AUDIT_PATH = path.resolve(process.cwd(), "data/audit/audit-events.ndjson");

function readJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2), "utf-8");
}

function appendAudit(event) {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_PATH, JSON.stringify(event) + "\n", "utf-8");
}

function shouldDowngrade(signals) {
  const passive = Number(signals.passive_index ?? 0);
  const onTime = Number(signals.on_time_delivery_rate ?? 1);
  const firstPass = Number(signals.first_pass_acceptance_rate ?? 1);
  const l3 = Number(signals.l3_incidents_last_24h ?? 0);
  const hardStop = Boolean(signals.hard_stop);

  if (hardStop) return "HARD_STOP_SIGNAL";
  if (l3 > 0) return "L3_INCIDENT_PRESENT";
  if (passive > 0.6) return "PASSIVE_INDEX_TOO_HIGH";
  if (onTime < 0.7) return "ON_TIME_DELIVERY_TOO_LOW";
  if (firstPass < 0.5) return "FIRST_PASS_ACCEPTANCE_TOO_LOW";
  return null;
}

function tick() {
  const mode = readJson(MODE_PATH, { mode: "SUPERVISED" });
  const signals = readJson(SIGNALS_PATH, {
    passive_index: 0,
    l3_incidents_last_24h: 0,
    on_time_delivery_rate: 1,
    first_pass_acceptance_rate: 1,
    hard_stop: false,
  });

  if (mode.mode !== "AUTO") {
    return;
  }

  const reason = shouldDowngrade(signals);
  if (!reason) {
    return;
  }

  writeJson(MODE_PATH, { mode: "SUPERVISED" });
  appendAudit({
    event_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    event_type: "AUDIT_EVENT_V1",
    timestamp: new Date().toISOString(),
    actor_id: "mode-guardian",
    action: "AUTONOMY_MODE_DOWNGRADE",
    resource: "autonomy-mode",
    trace_id: `guardian-${Date.now()}`,
    result: "SUCCESS",
    payload: {
      from: "AUTO",
      to: "SUPERVISED",
      reason,
      signals,
    },
  });

  console.log("[mode-guardian] downgraded AUTO -> SUPERVISED", reason);
}

function main() {
  console.log("[mode-guardian] started", { INTERVAL_MS, MODE_PATH, SIGNALS_PATH });
  tick();
  setInterval(tick, INTERVAL_MS);
}

main();
