import { query } from "../../../libs/platform/src/db";

const INTERVAL_MS = Number(process.env.SIGNAL_COLLECTOR_INTERVAL_MS || 60_000);
const L3_HARD_STOP_THRESHOLD = Number(process.env.L3_HARD_STOP_THRESHOLD || 3);
const AUTONOMOUS_ACTOR_ID = process.env.BOOTSTRAP_ACTOR_ID || "bootstrap-loop";

type NumRow = { value: number };

async function singleValue(sql: string, params: unknown[] = []): Promise<number> {
  const rows = await query<NumRow>(sql, params);
  return Number(rows[0]?.value ?? 0);
}

async function collectSignals() {
  const totalMissions = await singleValue(
    `SELECT COUNT(*)::float8 AS value FROM missions WHERE created_at >= NOW() - INTERVAL '24 hours'`
  );
  const autonomousMissions = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM missions
     WHERE created_at >= NOW() - INTERVAL '24 hours'
       AND requester_id = $1`,
    [AUTONOMOUS_ACTOR_ID]
  );
  const passiveIndex = totalMissions > 0 ? autonomousMissions / totalMissions : 0;

  const l3Incidents = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM audit_events
     WHERE timestamp >= NOW() - INTERVAL '24 hours'
       AND (
         action ILIKE '%L3%'
         OR payload->>'severity' = 'L3'
       )`
  );

  const closedMissions = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM missions
     WHERE status IN ('ACCEPTED', 'SETTLED', 'DISPUTED', 'REWORK_REQUIRED')
       AND updated_at >= NOW() - INTERVAL '30 days'`
  );
  const onTimeClosed = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM missions
     WHERE status IN ('ACCEPTED', 'SETTLED')
       AND updated_at >= NOW() - INTERVAL '30 days'
       AND updated_at <= deadline`
  );
  const onTimeDeliveryRate = closedMissions > 0 ? onTimeClosed / closedMissions : 1;

  const acceptanceCount = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM audit_events
     WHERE action = 'MISSION_ACCEPTANCE'
       AND timestamp >= NOW() - INTERVAL '30 days'`
  );
  const firstPassAccepted = await singleValue(
    `SELECT COUNT(*)::float8 AS value
     FROM audit_events
     WHERE action = 'MISSION_ACCEPTANCE'
       AND timestamp >= NOW() - INTERVAL '30 days'
       AND payload->>'decision' = 'ACCEPT'`
  );
  const firstPassAcceptanceRate = acceptanceCount > 0 ? firstPassAccepted / acceptanceCount : 1;

  const hardStop = l3Incidents >= L3_HARD_STOP_THRESHOLD;

  await query(
    `INSERT INTO runtime_signals (
      id, passive_index, l3_incidents_last_24h, on_time_delivery_rate,
      first_pass_acceptance_rate, hard_stop, updated_at
     )
     VALUES (1, $1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
      passive_index = EXCLUDED.passive_index,
      l3_incidents_last_24h = EXCLUDED.l3_incidents_last_24h,
      on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
      first_pass_acceptance_rate = EXCLUDED.first_pass_acceptance_rate,
      hard_stop = EXCLUDED.hard_stop,
      updated_at = NOW()`,
    [passiveIndex, Math.trunc(l3Incidents), onTimeDeliveryRate, firstPassAcceptanceRate, hardStop]
  );

  console.log("[signal-collector] signals updated", {
    passiveIndex: Number(passiveIndex.toFixed(4)),
    l3IncidentsLast24h: Math.trunc(l3Incidents),
    onTimeDeliveryRate: Number(onTimeDeliveryRate.toFixed(4)),
    firstPassAcceptanceRate: Number(firstPassAcceptanceRate.toFixed(4)),
    hardStop,
  });
}

function main() {
  console.log("[signal-collector] started", { INTERVAL_MS, L3_HARD_STOP_THRESHOLD, AUTONOMOUS_ACTOR_ID });
  collectSignals().catch((err: any) =>
    console.error("[signal-collector] initial collect failed", err?.message || "unknown")
  );
  setInterval(() => {
    collectSignals().catch((err: any) =>
      console.error("[signal-collector] collect failed", err?.message || "unknown")
    );
  }, INTERVAL_MS);
}

main();
