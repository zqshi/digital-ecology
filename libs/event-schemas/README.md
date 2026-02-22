# libs/event-schemas

Purpose: Versioned JSON Schemas for cross-service event and contract compatibility.
Owner: Data Platform Team.
Inputs/Outputs: Schema definitions used by APIs, event bus producers/consumers, and contract tests.

## Current Schemas (v1)
- `audit-event.v1.schema.json`
- `human-mission.v1.schema.json`
- `delivery-package.v1.schema.json`

## Rules
- Additive changes only within same major version.
- Breaking changes require new major schema file.
- Every schema change must include a compatibility note in docs/specs.
