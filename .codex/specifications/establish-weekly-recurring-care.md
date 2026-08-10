# Establish Weekly Recurring Care

**Status:** Accepted for implementation.

## Actor and value

An authenticated keeper establishes one weekly recurring Care intention for the
selected Aquarium so that a routine remains visible and actionable without
manually recreating it after every completion or cancellation.

## Scope

This slice supports exactly one weekly calendar rule: the keeper chooses a
description and a first local date/time. That first occurrence establishes the
weekday and `HH:mm` local time for later occurrences.

It includes the truthful minimum lifecycle:

```text
create recurring plan + first occurrence
complete or cancel occurrence
create the next appropriate occurrence
stop recurring plan + remove its outstanding occurrence
```

It does not add monthly rules, multiple weekdays, arbitrary intervals, editing,
pause, reminders, notifications, Dashboard work, Timeline entries, offline
creation, Functions, Scheduler, Blaze, Signal Store or a generic Task model.

## Time and calendar semantics

- Calendar Care belongs to the Aquarium's explicit IANA time zone. The browser
  zone is only a suggested value that the keeper must confirm when the Aquarium
  has none.
- Existing Aquariums are not silently migrated. The first successful recurring
  Care setup persists the confirmed zone on that Aquarium atomically with the
  Recurring Care Plan and its first occurrence.
- The first occurrence is explicit and is the only anchor persisted for the
  weekly rule. Its local weekday and minute precision (`HH:mm`) are derived in
  the Aquarium time zone; duplicate weekday/time fields are not stored.
- The rule is schedule-driven: it preserves its local weekday and local clock
  time through DST, rather than adding fixed `7 × 24`-hour UTC intervals.
- For a nonexistent local time at a DST spring transition, use the first valid
  local minute after the gap. For an ambiguous time at a fall transition, use
  the earlier corresponding instant.

## Domain model

`RecurringCarePlan` is an independent aggregate with its own UUID v4 identity,
`AquariumId`, description, first occurrence instant, `recordedAt`, and a
reference to its current outstanding `PlannedCareWorkId`.

Its timezone is not copied into the plan: the authoritative timezone belongs to
the Aquarium. A concrete recurring occurrence remains `PlannedCareWork`; it
adds `recurringCarePlanId` and provenance `recurring-plan`. Manual planned Care
remains unchanged with no recurrence link and provenance `manual`.

`CareWork` remains unchanged. Completing a recurring occurrence creates a
normal manually confirmed CareWork with the existing UUID correlation between
the PlannedCareWork and CareWork identities. `RecurringCarePlanId` is never an
occurrence or CareWork identity.

## Occurrence policy

- Each active recurring plan has at most one concrete outstanding occurrence.
- An outstanding occurrence remains actionable indefinitely when overdue; no
  missed backlog is created while Veril is closed.
- Completion or cancellation consumes the occurrence. The next one is the
  first scheduled weekly instant strictly after the later of its `plannedFor`
  instant and the action time. This avoids recreating old missed weeks and
  avoids skipping a future occurrence completed early.
- Cancelling one occurrence continues the series and materializes that next
  occurrence atomically.
- `StopRecurringCarePlan` is separate from cancellation. It deletes the plan
  and any outstanding occurrence atomically; neither deletion creates a Fact,
  CareWork, timestamped cancellation record or Timeline item.

## Persistence, authorization and concurrency

- `recurringCarePlans` is a top-level collection. It is not nested in Aquarium
  and does not share a polymorphic collection with occurrences.
- Creation writes the recurring plan and its first PlannedCareWork atomically.
  Transition operations read the recurring plan and current occurrence in a
  Firestore transaction, then replace the occurrence and update the plan's
  outstanding reference atomically.
- The outstanding reference provides idempotency for concurrent browser tabs:
  a retried transaction observes an existing occurrence and does not create a
  duplicate.
- Rules remain authoritative for authentication, owner and Aquarium ownership,
  required document shape, and recurrence-to-occurrence structural linkage.
  They do not recompute the calendar rule. A keeper can only affect future
  Care planning for their own Aquarium; calendar manipulation cannot grant
  cross-Aquarium access or create a historical Fact.

## UI

The keeper opens a dedicated `Programar cuidado semanal` form from Planned Care.
The form contains description, first date/time and the Aquarium timezone. The
timezone is shown read-only when already established; when missing, the browser
zone may be prefilled but needs explicit confirmation.

Concrete generated occurrences appear normally in Upcoming Care and the full
planned-care list. The planned-care list offers an explicit `Detener
recurrencia` action for a recurring occurrence; it is distinct from
`Cancelar`, which only cancels that occurrence.

## Failures

- Authentication, Active Context, ownership and missing-Aquarium failures stop
  the operation before a write.
- A missing or concurrently consumed occurrence produces a recoverable result
  and no duplicate CareWork or occurrence.
- Recurrent setup and transition operations are online-required. Firestore
  transaction failure is surfaced as a recoverable error.

## Testing

- Domain: weekly next occurrence, DST policies, early/late completion,
  cancellation, overdue occurrence retention and stop semantics.
- Application: authentication, Active Context, one-outstanding invariant and
  recurrence advancement.
- Infrastructure and Rules: atomic write/transition, owner isolation,
  occurrence linkage, malformed DTO rejection and concurrent transactions.
- Angular: timezone confirmation/display, weekly-form validation, recurring
  occurrence visibility and explicit stop action.
- E2E: create a weekly recurrence, complete or cancel its occurrence, and
  verify exactly one next occurrence.

## Definition of Ready

PASS. Product value, calendar grammar, timezone ownership, DST policy,
schedule-driven behavior, overdue handling, materialization, idempotency,
authorization, persistence, lifecycle operations, test scope and deferred work
are explicit.
