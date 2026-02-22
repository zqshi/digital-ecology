# Runbook: Autonomy Mode Switch

## Trigger
Need to switch operation mode between `AUTO`, `SUPERVISED`, and `LOCKDOWN`.

## Procedure
1. Edit `data/signals/autonomy-mode.json`.
2. Set `mode` to one of:
- `AUTO`
- `SUPERVISED`
- `LOCKDOWN`
3. Save file.
4. Verify bootstrap loop logs the active mode in next cycle.

## Diagnostics
- Check mode file:
`cat data/signals/autonomy-mode.json`
- Check bootstrap logs for mode behavior:
- `LOCKDOWN` => skipping generation
- `SUPERVISED` => high-risk missions blocked
- `AUTO` => autonomous generation allowed

## Rollback
If unexpected behavior appears, set mode back to `SUPERVISED` immediately.

## Governance Note
Do not enter `AUTO` unless thresholds in `docs/specs/autonomy-operation-mode-v1.md` are satisfied.
