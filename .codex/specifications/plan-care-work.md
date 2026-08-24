# Plan Care Work

**Status:** Accepted and implemented.

## Actor and value

An authenticated keeper records an intention to perform care work in the
selected Aquarium so that the intention can be reviewed before it becomes a
completed Care Work fact.

## Preconditions

- The keeper is authenticated.
- Active Context contains an Aquarium owned by the keeper.
- The description is not empty after trimming.
- `plannedFor` and `recordedAt` are valid timestamps.

## Main flow

1. The keeper opens `Planificar cuidado` from the Aquarium Dashboard.
2. The keeper enters a description and planned date/time.
3. Veril persists a new `PlannedCareWork` in `plannedCareWorks`.
4. The keeper can open the planned-care list and see the intention.

## Domain model

`PlannedCareWork` is an independent aggregate with its own
`PlannedCareWorkId`, `AquariumId`, `description`, `plannedFor`, `recordedAt`
and manual provenance. It is not a `CareWork`, `Task`, `Reminder`, `Schedule`
or generic activity.

The slice has no status field. Completing a plan creates a new `CareWork` fact
and removes the plan in one atomic persistence operation; it does not mutate a
completed Care Work fact. The operation copies the description and uses the
completion instant for both `performedAt` and `recordedAt`. The resulting
`CareWorkId` uses the same underlying UUID as the `PlannedCareWorkId` only as a
correlation convention; the branded identities remain distinct. No domain
event is required.

## Persistence and security

- Collection: `plannedCareWorks`.
- Reads and writes are owner-scoped and Aquarium-scoped.
- Firestore Rules remain authoritative and fail closed.
- The client does not use Active Context as authorization.
- Invalid persisted documents are rejected at the adapter boundary.

## Observable behaviour

- The form is hidden without Active Context and offers recovery to `Mis acuarios`.
- Loading, validation, pending, success and recoverable error states are
  accessible and presented in Spanish.
- After success, the keeper can open `Cuidados planificados`.
- Completing an intention removes it from the planned list and makes the new
  Care Work visible in completed Care Work and Timeline.
- An empty planned-care list is valid and offers `Planificar cuidado`.
- Uncompleted planned work does not appear in Timeline or Current Measurements.

## Explicitly deferred

Recurrence, reminders, priority, categories, delegation, notifications,
automation, Dashboard and projections are outside this slice. Cancellation is
defined separately by `cancel-planned-care-work.md`.

## Acceptance criteria

- A keeper can create an owned PlannedCareWork for the active Aquarium.
- The planned intention is listed separately from completed Care Work.
- Authentication, Active Context, owner isolation and malformed data are tested.
- The browser journey is covered against Auth and Firestore emulators only.
