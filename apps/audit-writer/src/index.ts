import { query } from "../../../libs/platform/src/db";
import { emitEvent } from "../../../libs/platform/src/events";

export interface AuditRecord {
  event_id: string;
  event_type: "AUDIT_EVENT_V1";
  timestamp: string;
  actor_id: string;
  action: string;
  resource: string;
  trace_id: string;
  result: "SUCCESS" | "FAILURE" | "DENY";
  payload: Record<string, unknown>;
}

export async function writeAuditEvent(event: AuditRecord): Promise<void> {
  await query(
    `
    INSERT INTO audit_events (event_id, event_type, timestamp, actor_id, action, resource, trace_id, result, payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
    `,
    [
      event.event_id,
      event.event_type,
      event.timestamp,
      event.actor_id,
      event.action,
      event.resource,
      event.trace_id,
      event.result,
      JSON.stringify(event.payload),
    ]
  );

  await emitEvent("audit-events", event);
}
