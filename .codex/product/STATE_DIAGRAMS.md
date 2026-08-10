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
This is the accepted lifecycle for the current Care capability; recurrence and
durable cancellation history remain future decisions.

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
