# Spec: Bootstrap Loop (Autonomous Evolution)

## Version
v1

## Purpose
Enable autonomous mission generation without requiring human-issued goals for every cycle.

## Non-Goal
Bootstrap loop is not the product goal. It is an execution mechanism to accelerate ecosystem evolution under governance constraints.

## Inputs
- `data/signals/bootstrap-signals.json` (or default fallback)

## Output
- Internal mission requests submitted to `POST /v1/missions`.

## Governance Boundaries
1. Bootstrap loop must go through mission-broker contract flow.
2. Bootstrap loop must not exceed autonomous budget cap.
3. Bootstrap loop must stop mission generation if `hard_stop=true`.
4. Bootstrap-generated missions cannot bypass policy and audit.
5. Bootstrap output must be measured by ecosystem-level outcomes (stability, collaboration, governance quality), not by mission volume.

## Signal Model
- `passive_index` number [0, 1]
- `l3_incidents_last_24h` integer >= 0
- `on_time_delivery_rate` number [0, 1]
- `first_pass_acceptance_rate` number [0, 1]
- `hard_stop` boolean
- `suggestions` array (optional)

## Decision Priority
1. Risk mitigation (`l3_incidents_last_24h > 0`)
2. Anti-passive exploration (`passive_index >= 0.6`)
3. Delivery quality repair (`on_time_delivery_rate < 0.85` or `first_pass_acceptance_rate < 0.7`)
4. Suggestion-driven optimization

## Failure Handling
- Mission submission failure logs error and retries next cycle.
- No direct write to policy/governance state.
