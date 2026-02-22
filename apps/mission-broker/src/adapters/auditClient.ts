import { writeAuditEvent } from "../../../../apps/audit-writer/src/index";

function nowIso(): string {
  return new Date().toISOString();
}

export async function emitAudit(input: {
  actorId: string;
  action: string;
  resource: string;
  traceId: string;
  result: "SUCCESS" | "FAILURE" | "DENY";
  payload: Record<string, unknown>;
}): Promise<void> {
  await writeAuditEvent({
    event_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    event_type: "AUDIT_EVENT_V1",
    timestamp: nowIso(),
    actor_id: input.actorId,
    action: input.action,
    resource: input.resource,
    trace_id: input.traceId,
    result: input.result,
    payload: input.payload,
  });
}
