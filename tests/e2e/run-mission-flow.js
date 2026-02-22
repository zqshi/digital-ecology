const fs = require("node:fs");
const path = require("node:path");

const MISSION_BASE = process.env.MISSION_BASE || "http://127.0.0.1:8081";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-trace-id": `trace-${Date.now()}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

async function get(url) {
  const res = await fetch(url);
  const json = await res.json();
  return { status: res.status, body: json };
}

async function main() {
  const create = await post(`${MISSION_BASE}/v1/missions`, {
    title: "M1 e2e mission",
    objective: "Validate mission flow",
    requesterId: "human-1",
    budgetCap: 100,
    deadline: new Date(Date.now() + 3600_000).toISOString(),
    acceptanceCriteria: ["result has summary"],
    constraints: ["no external side effects"],
    deliveryFormat: "REPORT",
  });

  assert(create.status === 201, `create failed: ${create.status}`);
  const missionId = create.body.missionId;
  assert(missionId, "missionId missing");

  for (const toStatus of ["CONTRACTED", "ALLOCATING", "EXECUTING", "DELIVERED"]) {
    const tr = await post(`${MISSION_BASE}/v1/missions/${missionId}/transition`, {
      actorId: "orchestrator-1",
      toStatus,
    });
    assert(tr.status === 200, `transition to ${toStatus} failed: ${tr.status} ${JSON.stringify(tr.body)}`);
  }

  const acceptance = await post(`${MISSION_BASE}/v1/missions/${missionId}/acceptance`, {
    decision: "ACCEPT",
    reviewerId: "reviewer-1",
    comments: "looks good",
  });
  assert(acceptance.status === 200, `acceptance failed: ${acceptance.status}`);

  const statusRes = await get(`${MISSION_BASE}/v1/missions/${missionId}`);
  assert(statusRes.status === 200, "status query failed");
  assert(
    ["ACCEPTED", "SETTLED"].includes(statusRes.body.status),
    `unexpected final status: ${statusRes.body.status}`
  );

  const auditPath = path.resolve(process.cwd(), "data/audit/audit-events.ndjson");
  assert(fs.existsSync(auditPath), "audit file missing");
  const lines = fs.readFileSync(auditPath, "utf-8").trim().split("\n").filter(Boolean);
  assert(lines.length > 0, "audit file has no events");

  console.log("e2e mission flow passed", { missionId, auditEvents: lines.length });
}

main().catch((err) => {
  console.error("e2e mission flow failed", err.message);
  process.exit(1);
});
