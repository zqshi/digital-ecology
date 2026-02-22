# apps/mission-broker

Purpose: Receive human missions, decompose tasks, allocate resources, orchestrate delivery and acceptance.
Owner: Delivery Platform Team.
Inputs/Outputs: HumanMission in, DeliveryPackage out.

## Scope (M1)
- `POST /v1/missions`: create mission.
- `GET /v1/missions/{mission_id}`: mission status.
- `POST /v1/missions/{mission_id}/acceptance`: submit acceptance decision.
- Emit audit and mission lifecycle events.

## Non-Scope (M1)
- Advanced optimization scheduling.
- Cross-domain federation routing.

## Mission Lifecycle
- `SUBMITTED`
- `CONTRACTED`
- `ALLOCATING`
- `EXECUTING`
- `DELIVERED`
- `ACCEPTED` | `REWORK_REQUIRED` | `DISPUTED`
- `SETTLED`

## Required Integrations
- `services/policy-pdp`
- `services/settlement-engine`
- `apps/audit-writer`
- `libs/event-schemas`

## SLO Targets (M1)
- Mission intake P95 <= 30m.
- On-time delivery >= 85%.
- First-pass acceptance >= 70%.
