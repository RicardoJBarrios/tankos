# Lifecycle States

Accepted lifecycles are identified explicitly. The remaining diagrams are
candidate states that still require a use-case decision before implementation.

## Planned Care Work

```text
planned ── complete ──> CareWork
planned ── cancel ────> removed
```

The planned intention has no persisted lifecycle status. Completion creates a
durable `CareWork` fact and removes the intention atomically. Cancellation
removes the unperformed intention without creating a Fact or Timeline item.
This is the accepted lifecycle for concrete Planned Care Work. Durable
cancellation history remains a future decision.

## Weekly Recurring Care

```text
RecurringCarePlan + first PlannedCareWork
  ├── complete occurrence ──> CareWork + next PlannedCareWork
  ├── cancel occurrence ────> removed occurrence + next PlannedCareWork
  └── stop recurrence ──────> removed plan + removed outstanding occurrence
```

The recurrence definition is not historical evidence. A planned occurrence is
always concrete and remains the only actionable future intention. Completion
keeps the existing CareWork fact semantics; cancelling or stopping creates no
Fact and no Timeline item.

## Alert

```text
detected -> acknowledged -> resolved
detected -> resolved
```

The meaning of detection, acknowledgement, severity and resolution is pending.

## Livestock association

```text
associated -> no longer associated
```

Transfer, loss, removal, grouping and historical retention are pending.

## Equipment association

```text
associated -> no longer associated
```

Installation, activation, shared use and failure states are pending.
