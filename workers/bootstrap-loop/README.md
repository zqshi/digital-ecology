# workers/bootstrap-loop

Purpose: Drive autonomous internal evolution by generating self-initiated missions from system signals.
Owner: Evolution Platform Team.
Inputs/Outputs: Signals in, internal HumanMission-compatible mission requests out.

## Safety Boundaries (M1)
- Must not bypass mission-broker contract flow.
- Must respect autonomous budget cap per cycle.
- Must stop on hard-stop signals.
- Must serve ecosystem-level goals; mission generation volume is not a success metric.

## Operation Mode
- Reads mode from `data/signals/autonomy-mode.json` with values:
  - `AUTO`: autonomous mission generation allowed (within constraints)
  - `SUPERVISED`: block high-risk autonomous missions
  - `LOCKDOWN`: disable autonomous mission generation

## Run
- `node workers/bootstrap-loop/src/main.js`
