import { query } from "../../../libs/platform/src/db";
import { writeAuditEvent } from "../../../apps/audit-writer/src/index";

type RuntimeSignals = {
  passive_index: number;
  l3_incidents_last_24h: number;
  on_time_delivery_rate: number;
  first_pass_acceptance_rate: number;
  hard_stop: boolean;
};

const INTERVAL_MS = Number(process.env.MODE_GUARDIAN_INTERVAL_MS || 60_000);

function shouldDowngrade(signals: RuntimeSignals): string | null {
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

async function loadMode(): Promise<"AUTO" | "SUPERVISED" | "LOCKDOWN"> {
  const rows = await query<{ mode: "AUTO" | "SUPERVISED" | "LOCKDOWN" }>(
    `SELECT mode FROM autonomy_mode WHERE id = 1 LIMIT 1`
  );
  return rows[0]?.mode || "SUPERVISED";
}

async function loadSignals(): Promise<RuntimeSignals> {
  const rows = await query<RuntimeSignals>(
    `SELECT passive_index, l3_incidents_last_24h, on_time_delivery_rate, first_pass_acceptance_rate, hard_stop
     FROM runtime_signals WHERE id = 1 LIMIT 1`
  );
  if (!rows[0]) {
    throw new Error("RUNTIME_SIGNALS_NOT_FOUND");
  }
  return {
    passive_index: Number(rows[0].passive_index),
    l3_incidents_last_24h: Number(rows[0].l3_incidents_last_24h),
    on_time_delivery_rate: Number(rows[0].on_time_delivery_rate),
    first_pass_acceptance_rate: Number(rows[0].first_pass_acceptance_rate),
    hard_stop: Boolean(rows[0].hard_stop),
  };
}

async function setMode(mode: "AUTO" | "SUPERVISED" | "LOCKDOWN"): Promise<void> {
  await query(
    `INSERT INTO autonomy_mode (id, mode, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET mode = EXCLUDED.mode, updated_at = NOW()`,
    [mode]
  );
}

async function tick() {
  const mode = await loadMode();
  if (mode !== "AUTO") {
    return;
  }

  const signals = await loadSignals();
  const reason = shouldDowngrade(signals);
  if (!reason) {
    return;
  }

  await setMode("SUPERVISED");
  await writeAuditEvent({
    event_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    event_type: "AUDIT_EVENT_V1",
    timestamp: new Date().toISOString(),
    actor_id: "mode-guardian",
    action: "AUTONOMY_MODE_DOWNGRADE",
    resource: "autonomy-mode",
    trace_id: `guardian-${Date.now()}`,
    result: "SUCCESS",
    payload: { from: "AUTO", to: "SUPERVISED", reason, signals },
  });

  console.log("[mode-guardian] downgraded AUTO -> SUPERVISED", reason);
}

function main() {
  console.log("[mode-guardian] started", { INTERVAL_MS });
  tick().catch((err: any) => console.error("[mode-guardian] initial tick failed", err?.message || "unknown"));
  setInterval(() => {
    tick().catch((err: any) => console.error("[mode-guardian] tick failed", err?.message || "unknown"));
  }, INTERVAL_MS);
}

main();
