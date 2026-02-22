# apps/runtime-gateway

Purpose: Enforce runtime policy checks before high-value mission state transitions.
Owner: Platform Security Team.
Inputs/Outputs: Transition check request in, allow/deny decision out.

## Scope (M1)
- `POST /v1/transition/check`
- Integrate with `services/policy-pdp`.
- Requires `x-actor-id` header and must match `actorId` in body.

## Non-Scope (M1)
- Full traffic gateway features (routing, auth federation, rate limiting policies).
