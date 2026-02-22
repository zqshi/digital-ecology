const fs = require("node:fs");
const path = require("node:path");

const MISSION_BASE = process.env.MISSION_BASE || "http://127.0.0.1:8081";
const INTERVAL_MS = Number(process.env.BOOTSTRAP_INTERVAL_MS || 60_000);
const MAX_AUTONOMOUS_BUDGET = Number(process.env.BOOTSTRAP_MAX_BUDGET || 50);
const ACTOR_ID = process.env.BOOTSTRAP_ACTOR_ID || "bootstrap-loop";
const DEFAULT_MODE = process.env.AUTONOMY_MODE || "SUPERVISED";

function loadSignals() {
  const p = path.resolve(process.cwd(), "data/signals/bootstrap-signals.json");
  if (!fs.existsSync(p)) {
    return {
      passive_index: 0,
      l3_incidents_last_24h: 0,
      on_time_delivery_rate: 1,
      first_pass_acceptance_rate: 1,
      hard_stop: false,
      suggestions: [],
    };
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function loadAutonomyMode() {
  const p = path.resolve(process.cwd(), "data/signals/autonomy-mode.json");
  if (!fs.existsSync(p)) {
    return { mode: DEFAULT_MODE };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    const mode = raw && typeof raw.mode === "string" ? raw.mode : DEFAULT_MODE;
    return { mode };
  } catch {
    return { mode: DEFAULT_MODE };
  }
}

function chooseMission(signals) {
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

  if (Array.isArray(signals.suggestions) && signals.suggestions.length > 0) {
    const top = signals.suggestions[0];
    return {
      title: `Autonomous Suggestion: ${top.title || "Optimization"}`,
      objective: top.objective || "Evaluate suggested optimization",
      constraints: top.constraints || ["safe mode"],
      acceptanceCriteria: top.acceptanceCriteria || ["evidence-backed recommendation"],
      deliveryFormat: "REPORT",
      budgetCap: Math.min(Number(top.budgetCap || 10), MAX_AUTONOMOUS_BUDGET),
      deadline: top.deadline || new Date(Date.now() + 3600_000).toISOString(),
      requesterId: ACTOR_ID,
    };
  }

  return null;
}

function isHighRiskMission(mission) {
  const text = `${mission.title} ${mission.objective}`.toLowerCase();
  return text.includes("policy") || text.includes("governance") || text.includes("federation");
}

async function submitMission(mission) {
  const res = await fetch(`${MISSION_BASE}/v1/missions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-trace-id": `bootstrap-${Date.now()}`,
    },
    body: JSON.stringify(mission),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function tick() {
  const signals = loadSignals();
  const { mode } = loadAutonomyMode();
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
  } catch (err) {
    console.error("[bootstrap-loop] initial tick failed", err.message);
  }
  setInterval(() => {
    tick().catch((err) => console.error("[bootstrap-loop] tick failed", err.message));
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error("[bootstrap-loop] fatal", err.message);
});
