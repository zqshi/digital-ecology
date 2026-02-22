import { query } from "../../../libs/platform/src/db";

type RuntimeSignals = {
  passive_index: number;
  l3_incidents_last_24h: number;
  on_time_delivery_rate: number;
  first_pass_acceptance_rate: number;
  hard_stop: boolean;
};

const MISSION_BASE = process.env.MISSION_BASE || "http://127.0.0.1:8081";
const INTERVAL_MS = Number(process.env.BOOTSTRAP_INTERVAL_MS || 60_000);
const MAX_AUTONOMOUS_BUDGET = Number(process.env.BOOTSTRAP_MAX_BUDGET || 50);
const ACTOR_ID = process.env.BOOTSTRAP_ACTOR_ID || "bootstrap-loop";
const DEFAULT_MODE = process.env.AUTONOMY_MODE || "SUPERVISED";

async function loadSignals(): Promise<RuntimeSignals> {
  const rows = await query<RuntimeSignals>(
    `SELECT passive_index, l3_incidents_last_24h, on_time_delivery_rate, first_pass_acceptance_rate, hard_stop
     FROM runtime_signals
     WHERE id = 1
     LIMIT 1`
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

async function loadAutonomyMode(): Promise<{ mode: "AUTO" | "SUPERVISED" | "LOCKDOWN" }> {
  const rows = await query<{ mode: "AUTO" | "SUPERVISED" | "LOCKDOWN" }>(
    `SELECT mode FROM autonomy_mode WHERE id = 1 LIMIT 1`
  );
  return { mode: rows[0]?.mode || (DEFAULT_MODE as "AUTO" | "SUPERVISED" | "LOCKDOWN") };
}

function chooseMission(signals: RuntimeSignals) {
  if (signals.hard_stop) {
    return null;
  }

  if (signals.l3_incidents_last_24h > 0) {
    return {
      title: "Autonomous Risk Mitigation",
      objective: "Investigate and reduce repeated L3 incident patterns",
      constraints: ["read-only analysis", "no production policy write"],
      acceptanceCriteria: ["produce mitigation checklist", "link evidence refs"],
      deliveryFormat: "REPORT",
      budgetCap: Math.min(20, MAX_AUTONOMOUS_BUDGET),
      deadline: new Date(Date.now() + 2 * 3600_000).toISOString(),
      requesterId: ACTOR_ID,
    };
  }

  if (signals.passive_index >= 0.6) {
    return {
      title: "Autonomous Exploration Mission",
      objective: "Generate candidate improvements to reduce passive execution index",
      constraints: ["no direct production writes", "must produce rollback-ready suggestion"],
      acceptanceCriteria: ["at least 2 candidate improvements", "risk notes included"],
      deliveryFormat: "REPORT",
      budgetCap: Math.min(15, MAX_AUTONOMOUS_BUDGET),
      deadline: new Date(Date.now() + 3 * 3600_000).toISOString(),
      requesterId: ACTOR_ID,
    };
  }

  if (signals.on_time_delivery_rate < 0.85 || signals.first_pass_acceptance_rate < 0.7) {
    return {
      title: "Autonomous Delivery Quality Improvement",
      objective: "Improve mission decomposition quality and acceptance pass rate",
      constraints: ["no schema breaking changes"],
      acceptanceCriteria: ["root cause summary", "proposed fix list"],
      deliveryFormat: "REPORT",
      budgetCap: Math.min(25, MAX_AUTONOMOUS_BUDGET),
      deadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
      requesterId: ACTOR_ID,
    };
  }

  return null;
}

function isHighRiskMission(mission: { title: string; objective: string }): boolean {
  const text = `${mission.title} ${mission.objective}`.toLowerCase();
  return text.includes("policy") || text.includes("governance") || text.includes("federation");
}

async function submitMission(
  mission: Record<string, unknown>
): Promise<{ status: number; body: { missionId?: string; [key: string]: unknown } }> {
  const res = await fetch(`${MISSION_BASE}/v1/missions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-trace-id": `bootstrap-${Date.now()}`,
    },
    body: JSON.stringify(mission),
  });
  const body = (await res.json()) as { missionId?: string; [key: string]: unknown };
  return { status: res.status, body };
}

async function tick() {
  const signals = await loadSignals();
  const { mode } = await loadAutonomyMode();
  if (mode === "LOCKDOWN") {
    console.log("[bootstrap-loop] LOCKDOWN mode, skipping mission generation");
    return;
  }
  const mission = chooseMission(signals);
  if (!mission) {
    console.log("[bootstrap-loop] no mission generated for current signals");
    return;
  }
  if (mode === "SUPERVISED" && isHighRiskMission(mission)) {
    console.log("[bootstrap-loop] SUPERVISED mode blocked high-risk autonomous mission", mission.title);
    return;
  }

  const result = await submitMission(mission);
  if (result.status >= 200 && result.status < 300) {
    console.log("[bootstrap-loop] mission submitted", result.body.missionId);
  } else {
    console.error("[bootstrap-loop] mission submit failed", result.status, result.body);
  }
}

async function main() {
  console.log("[bootstrap-loop] started", { MISSION_BASE, INTERVAL_MS, MAX_AUTONOMOUS_BUDGET, DEFAULT_MODE });
  try {
    await tick();
  } catch (err: any) {
    console.error("[bootstrap-loop] initial tick failed", err?.message || "unknown");
  }
  setInterval(() => {
    tick().catch((err: any) => console.error("[bootstrap-loop] tick failed", err?.message || "unknown"));
  }, INTERVAL_MS);
}

main().catch((err: any) => {
  console.error("[bootstrap-loop] fatal", err?.message || "unknown");
});
