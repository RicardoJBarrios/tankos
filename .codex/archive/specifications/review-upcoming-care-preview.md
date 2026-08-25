# Review Upcoming Care Preview

**Status:** Accepted and implemented.

## Product value

An authenticated keeper with an active Aquarium can see the next planned care
actions without leaving the Aquarium Dashboard. This improves orientation and
reduces navigation while keeping planning and completion as separate use cases.

## Scope

The Workspace shows at most three incomplete `PlannedCareWork` items. It shows
the description and planned date/time, and links to the complete planned-care
list. It does not create, edit or complete planned work.

## Source and ordering

The source is the existing `plannedCareWorks` collection through the existing
Planned Care reader. The canonical order is:

1. `plannedFor` ascending;
2. `recordedAt` ascending;
3. `PlannedCareWorkId` ascending.

Plans whose `plannedFor` is before the current time remain visible while they
are incomplete. They are not a new status or domain category; the canonical
order naturally places them before later plans.

Completed plans never appear because completion creates `CareWork` and removes
the corresponding `PlannedCareWork`.

## Preconditions and authorization

- The keeper is authenticated.
- Active Context contains an Aquarium owned by that keeper.
- Firestore Rules remain authoritative for the owner- and Aquarium-scoped read.
- Without Active Context, the preview does not query and offers recovery to
  Aquarium selection.

## Observable behaviour

- While loading, the section exposes an accessible loading state.
- With plans, it shows at most three items in canonical order and a link to
  `Cuidados planificados`.
- With no plans, it explicitly says `No hay cuidados planificados` and offers
  `Planificar cuidado`.
- A read failure affects only this section and offers retry; the Workspace,
  Aquarium identity, other sections and actions remain usable.
- The section remains readable on narrow screens, without horizontal or nested
  scrolling.

## Application and persistence boundary

This is a read-only application/UI increment. It introduces no aggregate, domain
event, collection, field, index or source of truth. The existing reader's
capability-local limit is sufficient; no generic pagination or projection is
introduced.

The preview adds one bounded owner- and Aquarium-scoped read with a maximum of
three returned documents. It remains compatible with the Spark-first baseline
and does not require Functions, Blaze, background jobs or remote services.

## State

Loading, data, empty and failure state remain local to the preview section. No
cross-section refresh coordination is required: route re-entry reconstructs the
Workspace sections and their reads. Signal Store is not required.

## Testing

- Application coverage verifies Active Context and the existing reader contract.
- Adapter coverage verifies the existing ordering, limit and malformed-data
  rejection; it is not duplicated solely for the preview.
- Rules coverage remains focused on the owner-scoped query.
- Angular coverage verifies loading, results, empty, error and navigation.
- The canonical browser journey verifies that planned care is visible from the
  Workspace and that the full planned-care list remains reachable.

## Deferred scope

Recurrence, reminders, notifications, overdue alerts, categories, priority,
Dashboard formalization, shared Workspace stores, projections and offline
support remain outside this increment.

## Acceptance criteria

- The active Workspace displays at most three incomplete planned-care items.
- The items use the existing Planned Care ordering.
- Overdue incomplete plans remain visible without new domain state.
- Empty and failure states are explicit and isolated to the section.
- The full planned-care list remains reachable.
- No new domain model, persistence model, authorization rule or Nx project is
  required.

## Definition of Ready

PASS. The actor, value, scope, source, ordering, limit, overdue behaviour,
authorization, state, cost boundary, testing path and deferred scope are
explicit. Implementation is limited to the Workspace preview and its
proportional validation.
