# Spec: Runtime Gateway Transition Check API

## Version
v1

## Endpoint
`POST /v1/transition/check`

## Purpose
Policy Enforcement Point (PEP) endpoint to evaluate mission status transition requests.

## Headers
- `x-actor-id` (required)

## Request fields
- `actorId` string (must match header `x-actor-id`)
- `missionId` string
- `fromStatus` enum
- `toStatus` enum
- `highRisk` boolean (optional)
- `dualApproval` boolean (optional)

## Response
- `allowed` boolean
- `reason` string

## Error codes
- `RTG_401_MISSING_ACTOR_HEADER`
- `RTG_403_ACTOR_MISMATCH`
- `RTG_404_NOT_FOUND`
- `RTG_500_INTERNAL_ERROR`
