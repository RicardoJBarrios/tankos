# Accepted: Parameter History

**Status:** Accepted and implemented.

## User value

An authenticated keeper can review the measured history of one parameter in
the selected Aquarium. The view answers how the evidence for that parameter
has changed over time without pretending to interpret trends or replace the
recent Timeline.

## Scope

The first increment provides:

- one required parameter from the active Parameter catalogue;
- an optional measured-time interval;
- stable cursor pagination using the existing shared pagination policy;
- the entered canonical value, unit, measured time and recorded time;
- explicit correction traceability for original and replacement Measurements.

The result is a read model. It does not mutate Measurements, calculate a
trend, classify values as healthy, or introduce charts, exports, retention or
recommendations.

## Time and filtering semantics

The parameter filter is exact and is applied in the Firestore query. The
optional interval is expressed as instants over `measuredAt`:

- `from` is inclusive;
- `to` is exclusive;
- omitting either bound leaves that side unbounded;
- `from` must be earlier than `to` when both are present.

The UI may collect local date and time values using the selected Aquarium time
zone, but the application converts them to instants before invoking the read
port. The domain does not depend on browser locale.

Results are ordered by:

1. `measuredAt` descending;
2. `recordedAt` descending;
3. `MeasurementId` ascending.

The cursor is opaque and includes the selected parameter and interval
implicitly through the query boundary. A cursor from another filter is
rejected rather than silently reused.

## Corrections and traceability

History contains both the original Measurement and its append-only correction.
An original with a correction is labelled as superseded and cannot expose the
`Corregir` action. A replacement is labelled as a correction of the original.
No item is physically removed or collapsed from this view.

## Authorization and failure behavior

The authenticated keeper who owns the selected Aquarium may read its Parameter
History. A delegated authenticated guest may read the same immutable history
only when the Aquarium grant includes `measurements`; the guest view is
read-only and does not expose correction actions. Firestore Rules remain
authoritative; the selected context and UI filters are not authorization
boundaries. Anonymous users and guests without that grant fail closed.

The application must fail closed for an absent context, an unauthenticated
session, an invalid parameter, an invalid interval, an invalid cursor or a
malformed persisted Measurement. An empty page is a successful result.

## Architecture and persistence

Parameter History is a Measurements application read capability. It is not a
new aggregate, bounded context, Firestore collection, Timeline projection or
generic history framework. The existing `measurements` collection and
`measurementCorrections` technical markers are reused.

The read port accepts the owner, Aquarium, parameter, optional instant bounds,
optional cursor and bounded page size. The Firestore adapter validates every
document at its boundary and applies the owner, Aquarium, parameter and time
constraints in the query.

## Testing and definition of done

- application tests validate parameter and interval validation, cursor scope,
  empty pages and correction labels;
- adapter integration tests validate ordering, parameter/time filtering,
  pagination, malformed records and correction markers in the Emulator Suite;
- Rules tests validate owner access and deny unauthenticated and cross-owner
  reads;
- Angular tests cover loading, empty, invalid-filter, error, pagination and
  correction presentation states;
- E2E covers selecting a parameter, reviewing a bounded history and loading a
  subsequent page as a keeper.

## Deferred decisions

- charts and statistical summaries;
- trend interpretation or biological targets;
- multi-parameter comparison;
- exports and offline history;
- complete Timeline pagination.

## Implementation record

The Spark-first implementation provides the private keeper route at
`/app/aquariums/measurements/history` and reuses the existing Measurements
collection and correction markers. It supports selecting one closed Parameter,
optional measured-time bounds, bounded cursor pagination, empty and failure
states, and explicit labels for original and replacement Measurements.

The keeper journey covers opening Parameter History from the Measurements list,
reviewing a bounded result and returning to the source list. Firestore adapter
integration covers filtering and cursor ordering; authorization remains behind
the existing owner and shared-measurement access ports and Rules.
