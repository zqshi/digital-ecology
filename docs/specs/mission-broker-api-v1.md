# Spec: Mission Broker API

## Version
v1

## Purpose
Define human mission intake, query, and acceptance APIs for the human-to-ecosystem delivery loop.

## Endpoints

### POST /v1/missions
Create a mission.

Request fields:
- `title` string
- `objective` string
- `constraints` array[string]
- `budgetCap` number (also accepts `budget_cap` for compatibility)
- `deadline` string (ISO-8601)
- `deliveryFormat` string (also accepts `delivery_format` for compatibility)
- `acceptanceCriteria` array[string] (also accepts `acceptance_criteria`)
- `requesterId` string (also accepts `requester_id`)

Response fields:
- `mission_id` string
- `status` enum (`SUBMITTED`)
- `trace_id` string

### GET /v1/missions/{mission_id}
Query mission status.

Response fields:
- `mission_id` string
- `status` enum
- `allocation_summary` object
- `delivery_summary` object
- `updated_at` string (ISO-8601)

### POST /v1/missions/{mission_id}/acceptance
Submit acceptance decision.

Request fields:
- `decision` enum (`ACCEPT`, `REWORK`, `DISPUTE`)
- `comments` string
- `reviewer_id` string

Response fields:
- `mission_id` string
- `status` enum
- `next_action` string

### POST /v1/missions/{mission_id}/transition (Internal)
Move mission status along lifecycle for orchestration workflows.

Request fields:
- `actorId` string
- `toStatus` enum (`CONTRACTED|ALLOCATING|EXECUTING|DELIVERED|ACCEPTED|REWORK_REQUIRED|DISPUTED|SETTLED`)
- `highRisk` boolean (optional)
- `dualApproval` boolean (optional)

Response fields:
- `missionId` string
- `status` enum

## Error Codes
- `MBR_400_INVALID_REQUEST`
- `MBR_401_UNAUTHORIZED`
- `MBR_403_POLICY_DENIED`
- `MBR_404_MISSION_NOT_FOUND`
- `MBR_409_INVALID_STATE_TRANSITION`
- `MBR_500_INTERNAL_ERROR`

## Idempotency
- `POST /v1/missions` requires `Idempotency-Key` header.
- Acceptance endpoint is idempotent by `(mission_id, decision, reviewer_id)` within 24h.

## Audit Fields (Required)
- `actor_id`
- `action`
- `resource`
- `timestamp`
- `trace_id`

## Compatibility Policy
- Backward compatible additive changes only in v1.
- Breaking changes require v2 endpoint namespace.
