# Aquarium-Local Time Presentation

**Status:** Accepted and implemented on the Spark-first baseline.

## Product value

The keeper should see when something happened around the physical Aquarium,
not when the browser happens to be running. The same Aquarium timestamp must
remain stable when the keeper travels or changes device.

## Canonical timezone policy

For a configured Aquarium, `Aquarium.timeZone` is the canonical presentation
zone for user-visible timestamps describing that Aquarium, its evidence or its
Care. This includes:

- Measurement `measuredAt`;
- Observation `recordedAt`;
- Care Work `performedAt`;
- Planned Care `plannedFor`;
- Timeline `effectiveAt`;
- recurring-care local schedule presentation.

The persisted value remains an absolute instant. Formatting never changes the
stored value, ordering or source aggregate.

`Aquarium.timeZone` is optional in the current model. A legacy Aquarium without
it is an explicit compatibility exception: the browser timezone may be used
temporarily, but the UI must not describe that value as Aquarium-local. No
automatic timezone inference becomes domain truth.

## Domain and recurrence boundary

Timezone presentation is an application/UI concern. Recurring Care continues
to resolve local calendar input using the Aquarium timezone, while formatting
only renders an already-resolved instant. These are separate policies and must
not become a generic temporal engine.

Timeline ordering remains based on absolute instants and `effectiveAt` is not
recomputed for presentation.

## Locale and formatting

The application uses the explicit `es-ES` locale for product-facing temporal
text. Locale does not determine timezone.

Use a narrow Aquarium capability presentation function backed by native
`Intl.DateTimeFormat`, passing the Aquarium IANA timezone explicitly. Prefer
one date-and-time contract for record lists and history:

```text
10/08/26, 19:00
```

The semantic HTML `datetime` attribute remains the ISO instant. Relative time
is deferred and must not replace the absolute value.

The timezone name is not repeated on every record. Show it in scheduling or
timezone-configuration surfaces, and expose it as supporting accessible/context
information where the user needs to understand the zone.

For `datetime-local` scheduling inputs, the default value is formatted in the
configured Aquarium timezone. The input remains a local wall-clock value that
the existing recurrence flow interprets using that Aquarium timezone; this
does not change recurrence arithmetic or persistence semantics.

## Affected presentation surfaces

The bounded implementation should update, without changing persistence:

- Current Measurements;
- Measurement history;
- Pending and Planned Care;
- Care history;
- Observation history;
- Recent Activity and Timeline;
- recurring-care schedule presentation.

Workspace already loads Aquarium identity and `AquariumListItem` already
contains the optional timezone. The implementation should resolve the
timezone once at the Workspace/application boundary and pass it to affected
presentation surfaces. It must not add a Firestore read per item or introduce
global timezone state.

## Time authority

| Concept                | Authoritative instant    |
| ---------------------- | ------------------------ |
| Aquarium establishment | `establishedAt`          |
| Measurement            | `measuredAt`             |
| Observation            | `recordedAt`             |
| Care Work              | `performedAt`            |
| Planned Care           | `plannedFor`             |
| Timeline               | read-model `effectiveAt` |

`recordedAt` remains internal traceability unless a surface has a concrete
reason to show it as secondary information. Do not display two timestamps by
default.

## Persistence and cost

No collection, field, index, Rule or timestamp representation changes are
required. For Workspace surfaces the expected incremental read cost is zero
because the Aquarium read already carries `timeZone`. Other routes must reuse
their existing Aquarium context/read boundary rather than query per record.

## DST and travel

An already-resolved instant is formatted in the Aquarium timezone, so DST
before and after a transition is handled by the platform's IANA data. The
formatter must not rerun recurrence arithmetic.

With Aquarium timezone `Atlantic/Canary`, a keeper in `Europe/Madrid` or
`America/New_York` sees the same Aquarium-local clock value. Only the legacy
no-timezone exception may vary with the browser.

## Testing

- Pure formatter tests use the same instant with `Atlantic/Canary`,
  `Europe/Madrid` and `America/New_York`.
- Tests cover an instant before and after a DST transition.
- Angular tests cover Current Measurements, Planned Care, Care history,
  Observations and Timeline using an explicit Aquarium timezone.
- A focused browser test may emulate a different browser timezone and verify
  the configured Aquarium display remains unchanged. It must not depend on the
  CI host timezone.
- Missing-timezone compatibility is tested separately and remains visibly
  distinguished from Aquarium-local presentation.

## Explicit exclusions

This decision does not introduce a date/time dependency, Signal Store, Nx
library, persistence migration, Dashboard, notifications, relative-time
framework, offline behavior or keeper locale preferences.

## Definition of Ready

PASS. The timezone authority, legacy exception, affected timestamps, formatting
strategy, locale, visibility, persistence/query cost, testing and exclusions
are explicit.
