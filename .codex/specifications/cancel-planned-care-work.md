# Cancel Planned Care Work

**Status:** Ready for implementation.

## Product value

An authenticated keeper can remove a planned care intention that is no longer
valid without falsely recording that the work was performed.

## Meaning

Cancellation means that the keeper no longer intends to perform this planned
care action. It is not evidence that care was performed and it is not a
historical Aquarium event.

The cancellation is non-durable in the current product model: the
`PlannedCareWork` document is removed and no replacement record is created.
There is no `cancelled` status, `CancelledPlannedCareWork`, `cancelledAt`,
`CareWork`, Domain Event or Timeline item.

## Actor and preconditions

- The actor is an authenticated keeper.
- Active Context contains an Aquarium owned by that keeper.
- The target `PlannedCareWork` belongs to that Aquarium and keeper.
- The target still exists and has not already been completed or cancelled.

## Main flow

1. The keeper opens `Cuidados planificados`.
2. The keeper chooses `Cancelar` for one planned intention.
3. Veril asks for confirmation because the intention will disappear.
4. The keeper confirms.
5. Veril removes the owned planned intention.
6. The item disappears only after persistence succeeds.

## Failure and concurrency behaviour

- Unauthenticated, missing-context, ownership and unavailable-plan failures are
  rejected without deleting another keeper's data.
- A failed deletion leaves the item visible and shows a recoverable error.
- Repeated submissions are prevented while cancellation is pending.
- If completion and cancellation race, the first operation that successfully
  commits determines the result. A later operation treats an unavailable plan
  as already completed or cancelled and does not create a second Care Work.
- Completion keeps its existing atomic creation of `CareWork` and deletion of
  `PlannedCareWork`.
- No distributed lock or generic lifecycle mechanism is introduced.

## Security and persistence

Rules remain authoritative. The future cancellation write must allow only an
authenticated owner to delete a plan belonging to the requested Aquarium.
Completion must remain authorized as an atomic creation-plus-deletion operation,
and its Care Work creation constraints must not be weakened.

The implementation may reuse the existing Planned Care adapter and must not
create a new collection, identity, timestamp or generic delete port. The
current Rules deny direct deletion; changing that permission is part of the
implementation slice, not this documentation-only preparation.

## Timeline and product surfaces

Cancellation is **not in Timeline**. Timeline answers what happened in the
Aquarium, while cancellation only removes an unperformed intention. It belongs
on the full `Cuidados planificados` surface, not in the concise Upcoming Care
Preview. After success, normal route re-entry refreshes the Workspace preview.

No special empty state, undo flow or Dashboard surface is introduced. The
existing `No hay cuidados planificados` state remains sufficient. Undo is not
justified while cancellation has no durable record.

## Lifecycle

```text
PlannedCareWork ── complete ──> CareWork
       │
       └──────── cancel ───────> removed
```

`PlannedCareWork` remains an intention and `CareWork` remains durable
historical evidence. This closes the minimum lifecycle foundation for a future
occurrence-based recurrence model without designing recurrence itself.

Cancellation must not introduce generic `Task`, status, recurrence, reminders,
notifications, automation, Signal Store, Dashboard infrastructure, Functions,
Blaze or offline synchronization.

## Testing strategy

- Application: success, authentication, Active Context, ownership, unavailable
  plan and infrastructure failure.
- Infrastructure: owner-scoped deletion, no Care Work created by cancellation,
  and preservation of atomic completion.
- Rules: owner deletion allowed for cancellation; anonymous, cross-owner and
  cross-Aquarium deletion denied; valid completion remains allowed and spoofed
  completion remains denied.
- Angular: confirmation, pending, success, failure and item retention on
  failure.
- E2E: plan, open planned care, cancel, verify disappearance, return to the
  Workspace and verify the preview does not show the cancelled plan.

## Deferred scope

Durable cancellation history, Timeline inclusion, reasons, undo, recurrence,
notifications, reminders, Dashboard formalization, offline support and
collaboration remain deferred.

## Definition of Ready

PASS. Product value, deletion semantics, aggregate boundaries, authorization,
Rules impact, concurrency outcome, UI placement, testing and deferred scope
are explicit. Implementation remains limited to cancelling an owned planned
care intention.
