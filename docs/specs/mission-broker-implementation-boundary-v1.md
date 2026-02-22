# Spec: Mission Broker Implementation Boundary

## Version
v1

## In Scope (M1)
- Mission domain model and lifecycle transition checks.
- API contract definitions (request/response/errors/idempotency requirements).
- Basic service layer with deterministic behavior for state changes.
- Audit field requirements at contract layer.

## Out of Scope (M1)
- Production-grade persistence and distributed transactions.
- Advanced optimization scheduler.
- Cross-domain routing and federation.
- Full arbitration automation.

## Hard Constraints
- No state transition bypassing the lifecycle state machine.
- No acceptance without corresponding mission existence and valid status transition.
- No critical path endpoint without required audit fields.

## Upgrade Path
- Replace in-memory repository with Postgres repository.
- Add policy checks before every transition.
- Add settlement hooks after `ACCEPTED -> SETTLED`.
- Add event emission using versioned schemas from `libs/event-schemas`.
