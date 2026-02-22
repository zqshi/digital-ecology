# apps/audit-writer

Purpose: Persist audit records for critical actions in append-only NDJSON format (M1 scaffold).
Owner: Compliance Platform Team.
Inputs/Outputs: AuditEvent in, persistent audit file out.

## M1 Behavior
- Writes audit records to `data/audit/audit-events.ndjson`.
- No schema enforcement at runtime yet (enforced by producer contract in M1).
