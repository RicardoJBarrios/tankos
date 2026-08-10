# Review Due Care

**Status:** Definition of Ready — PASS.

## Product value

When the keeper opens Veril, they can immediately distinguish planned Care that
has already passed from Care that is still upcoming. This improves awareness
without requiring background delivery or changing the Care domain.

## Scope

This is a read-only presentation increment over existing incomplete
`PlannedCareWork` items. It applies equally to manual and recurring-generated
plans.

It does not add reminders, browser notifications, Push, scheduling, severity,
health interpretation, persistence, new queries, backlog generation or
recurrence advancement.

## Temporal semantics

`plannedFor` is the authoritative absolute instant.

- `plannedFor < now`: overdue;
- `plannedFor >= now`: upcoming.

The exact-now boundary is not a separate domain category. The UI may label an
exact-now item as `Ahora`, but it remains the same derived presentation state.
The current time is supplied by the application/UI boundary for deterministic
tests; no persisted `status` is introduced.

Overdue is therefore derived presentation state. Time passing does not mutate a
`PlannedCareWork`, create a Fact, advance recurrence or write Firestore data.

## Recurrence and manual plans

Both manual and recurring-generated plans use the same timing classification.
An overdue recurring occurrence remains the one outstanding occurrence. Review
does not create another occurrence, alter the plan or create backlog.

## Workspace and list presentation

The Workspace section is renamed to `Cuidados pendientes`, because it includes
both overdue and upcoming incomplete plans. Overdue items appear first, then
upcoming items in the existing planned-care order.

The full list shows explicit text for the temporal meaning, such as `Vencido`
or `Hoy`. Colour, icon and position are supporting cues only. Absolute date/time
information remains visible; relative wording may supplement it but must not
replace it.

The empty state remains `No hay cuidados planificados` with the existing
`Planificar cuidado` action. Errors remain local to the affected read surface.

## Timezone and DST

Due classification compares absolute `Date` instants and never compares naive
local strings. Recurring Care has already resolved DST-sensitive local times
into `plannedFor`; review does not repeat recurrence resolution.

This increment did not change the date/time display contract or add a timezone
query. The accepted follow-up policy is defined in
[aquarium-local-time-presentation.md](aquarium-local-time-presentation.md): configured Aquariums must use their
authoritative IANA timezone for user-visible timestamps; legacy Aquariums
without one remain an explicit browser-timezone compatibility case until their
timezone is established.

## Persistence and cost

No collection, field, index, adapter, Rule or source of truth changes. The
existing bounded Planned Care read supplies all data needed, so the expected
additional Firestore reads are zero.

No periodic writes, background worker, scheduler, Cloud Function, Blaze
requirement or notification token is introduced.

## Accessibility

The temporal meaning is rendered as text available to assistive technology.
The distinction cannot depend only on colour, iconography or ordering. Loading,
empty, failure and recovery states remain explicit and local.

## Notifications boundary

Awareness while Veril is open is separate from in-app reminders and from
notifications delivered while Veril is closed. This slice selects awareness
only. Notifications remain deferred until trusted background delivery is
accepted.

## Testing

- Pure/application coverage uses explicit `now` values for future, exact-now and
  overdue items.
- Angular coverage verifies overdue text, upcoming text, ordering, absolute
  time preservation and accessible semantics.
- Existing reader coverage is reused; no second query or new adapter is tested.
- A browser journey may use deterministic persisted timestamps, but must not
  depend on a wall-clock race.

## Deferred decisions

Notification permission, reminder offsets, Push/FCM transport, trusted
background scheduling, cancellation/completion delivery guarantees and
timezone-aware date presentation was outside this increment and is specified
separately.

## Definition of Ready

PASS. The product value, terminology, temporal boundary, ordering, ownership,
recurrence compatibility, accessibility, persistence/cost boundary, testing
path and deferred notification scope are explicit.
