# Spec: Autonomy Operation Mode

## Version
v1

## Purpose
Define how the ecosystem switches between operation modes while preserving governance, safety, and evolution continuity.

## Modes

### 1. AUTO
- System self-generates and executes missions under pre-registered boundaries.
- Human confirmation is not required for routine mission creation, decomposition, and execution.
- Policy, audit, budget caps, and hard-stop remain mandatory.

### 2. SUPERVISED
- Default mode during early rollout.
- System can self-generate missions, but selected classes (high-risk, budget-expanding, governance-impacting) require human confirmation.

### 3. LOCKDOWN
- Emergency mode.
- Mission generation is paused except explicit recovery playbooks.
- Used when hard-stop or severe systemic anomalies are triggered.

## Entry Conditions

### Enter AUTO (all required)
1. Go/No-Go is Green for 4 consecutive weeks.
2. Hard-stop not triggered in the last 30 days.
3. Autonomous metrics meet threshold:
- autonomous_goal_rate >= 20%
- passive_index <= 40%
- on_time_delivery_rate >= 85%
- first_pass_acceptance_rate >= 70%
4. Audit completeness = 100% for critical mission paths.

### Enter SUPERVISED
- Initial bootstrapping phase.
- Or fallback from AUTO due to threshold drift.

### Enter LOCKDOWN (any one)
1. Hard-stop line triggered.
2. L4 incident occurs.
3. Audit integrity failure in critical path.
4. Consecutive 2 weeks of severe delivery degradation (on_time_delivery_rate < 70% or first_pass_acceptance_rate < 50%).

## Exit Conditions

### AUTO -> SUPERVISED
- Any key threshold violated for 1 week.
- Governance council marks risk escalation.

### SUPERVISED -> LOCKDOWN
- Hard-stop or L4 incident.

### LOCKDOWN -> SUPERVISED
- Incident resolved, rollback completed, and postmortem approved.

### SUPERVISED -> AUTO
- AUTO entry conditions satisfied again.

## Confirmation Matrix

- Routine autonomous mission: AUTO = no human confirmation, SUPERVISED = no confirmation unless tagged high-risk.
- High-risk transition: always requires dual approval.
- Governance rule change: always requires governance flow.
- Budget cap increase: requires human governance approval.
- Cross-domain federation change: requires human governance approval.

## Required Signals
- passive_index
- l3_incidents_last_24h
- on_time_delivery_rate
- first_pass_acceptance_rate
- hard_stop
- audit_integrity

## Runtime Contract
- Mode value is stored in `data/signals/autonomy-mode.json`.
- Bootstrap loop and mission control components must read mode before each cycle.
- Mode transitions must emit audit events.

