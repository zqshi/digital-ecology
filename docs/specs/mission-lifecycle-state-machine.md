# Spec: Mission Lifecycle State Machine

## Version
v1

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED
    SUBMITTED --> CONTRACTED: contract_created
    CONTRACTED --> ALLOCATING: budget_approved
    ALLOCATING --> EXECUTING: allocations_committed
    EXECUTING --> DELIVERED: delivery_package_ready

    DELIVERED --> ACCEPTED: acceptance_decision(ACCEPT)
    DELIVERED --> REWORK_REQUIRED: acceptance_decision(REWORK)
    DELIVERED --> DISPUTED: acceptance_decision(DISPUTE)

    REWORK_REQUIRED --> EXECUTING: rework_assigned
    DISPUTED --> EXECUTING: arbitration_resolve_rework
    DISPUTED --> ACCEPTED: arbitration_resolve_accept

    ACCEPTED --> SETTLED: settlement_completed
```

## Transition Guards
- No transition without policy check.
- `ALLOCATING` requires budget reservation.
- `SETTLED` requires acceptance proof and settlement record.

## Illegal Transitions
- Direct `SUBMITTED -> EXECUTING`.
- Direct `DELIVERED -> SETTLED`.
