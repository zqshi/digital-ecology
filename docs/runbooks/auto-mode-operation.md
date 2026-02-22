# Runbook: AUTO Mode Operation

## Goal
Run ecosystem in AUTO mode while preserving safety via automatic downgrade.

## Prerequisites
1. `data/signals/autonomy-mode.json` is set to `AUTO`.
2. `workers/bootstrap-loop` is running.
3. `workers/mode-guardian` is running.

## Start Sequence
1. Start mission-broker.
2. Start runtime-gateway.
3. Start bootstrap-loop.
4. Start mode-guardian.

## Automatic Downgrade Conditions
Mode guardian will downgrade `AUTO -> SUPERVISED` when any condition is met:
- `hard_stop = true`
- `l3_incidents_last_24h > 0`
- `passive_index > 0.6`
- `on_time_delivery_rate < 0.7`
- `first_pass_acceptance_rate < 0.5`

## Verification
- Check current mode file:
`cat data/signals/autonomy-mode.json`
- Check audit records for mode downgrade:
search action `AUTONOMY_MODE_DOWNGRADE` in `data/audit/audit-events.ndjson`

## Rollback
If AUTO is unstable, force:
`{ "mode": "SUPERVISED" }` in `data/signals/autonomy-mode.json`.

