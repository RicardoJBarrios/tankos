# Firestore Persistence Conventions

Firestore is an infrastructure adapter. This document does not define
collections, document nesting, indexes, Security Rules or a final schema. Those
are consequences of accepted use cases, aggregate boundaries and query needs.

## Conventions to apply when a persistence contract exists

- Use consistent lower camelCase field names and opaque, stable identifiers.
- Persist instants as Firestore timestamps at the adapter boundary; map them to
  domain time representations before entering domain code.
- Omit an optional field when absence and `null` have the same meaning; use
  `null` only when an accepted contract needs an explicit known-empty state.
- Keep arrays bounded and suitable for whole-document replacement. Model
  unbounded or independently queried data through a contract chosen from the
  relevant use case, not by default nesting.
- Use maps for small, bounded attributes with a stable access pattern. Do not
  hide mutable entity collections in maps.
- Store references only when the domain relationship and query require them;
  every reference needs an ownership and deletion policy.
- Consider subcollections only after aggregate ownership, query locality,
  authorization and lifecycle are known. They are not a default hierarchy.
- Do not adopt soft delete by default. Decide retention, restore, audit and
  privacy requirements per domain concept. A hard delete requires an explicit
  authorization and recovery policy.
- Keep ownership and collaboration data explicit enough for authorization
  Rules; do not infer authority from route visibility or a client-side guard.
- Add a version or concurrency marker only when a validated operation needs it.
  Choose conflict behavior from the use case rather than a global convention.

## Boundary rules

- Firestore DTOs are validated and mapped at the adapter boundary.
- Domain models, aggregate hypotheses and business events do not import Firebase
  types or inherit Firestore collection shape.
- Indexes, Rules and query limits are reviewed alongside each accepted read or
  write path and tested in the Emulator Suite.

## Required inputs before schema design

1. Accepted use case and actor authorization.
2. Aggregate or consistency boundary and business invariants.
3. Read and write queries, volume assumptions and offline classification.
4. Retention, export, deletion and collaboration requirements.
5. Security Rules and emulator-test plan.

## Establish an Aquarium: minimum persistence contract

This accepted slice requires only the durable reconstruction of a private
Aquarium: its `AquariumId`, `AquariumName`, owning keeper identity, and the
attribution and time of its establishment. Each successful establishment gets a
new independent identity. `AquariumEstablished` is represented by that
immutable establishment evidence; no generic event store, Timeline projection
or future-domain collection is needed.

The implementation must create the new Aquarium with an opaque UUID v4 and
associate it with the authenticated keeper. No keeper-level uniqueness claim,
global name uniqueness or count-based reservation is required. The exact
collection and document paths may be chosen during implementation, but they
must support reconstruction and owner-scoped access.

Security Rules must make the root private by default, allow an authenticated
keeper to create and read each root they own, reject unauthenticated access and
prevent arbitrary ownership changes. A persistence schema version is not required for this first DTO
because there is no prior persisted shape to migrate; add one only with the
first compatibility need.

## Record an Observation: current persistence contract

The accepted observation slice persists each Observation as an independent
document in the top-level `observations` collection. Each document contains
only `aquariumId`, `ownerId`, `content` and the Firestore timestamp
`recordedAt`. The document identifier is the stable Observation identity.

The write is append-only for this slice: updates and deletes are denied. The
adapter does not load or mutate the Aquarium aggregate. Rules verify the
referenced Aquarium owner before allowing creation, and owner-scoped reads are
allowed for the persisted document. No index or historical query is introduced
until a future accepted read use case requires one.

## List Observations: current read contract

The accepted `List Observations` read filters the top-level `observations`
collection by `ownerId` and `aquariumId`, then orders by `recordedAt`
descending and document ID ascending. It applies a capability-local limit of
50 records and does not introduce pagination in this increment. The adapter
validates every returned document with the existing Observation persistence
schema before mapping it to `ObservationListItem`.

The query is compatible with the current Rules and Emulator Suite without an
additional entry in `firestore.indexes.json`; this conclusion is specific to
these equality filters and order fields. A future pagination, filter or time
query must be reviewed independently rather than generalizing this result.

## List Measurements: current read contract

The accepted `List Measurements` read filters the top-level `measurements`
collection by `ownerId` and `aquariumId`, then orders by `measuredAt` descending,
`recordedAt` descending and document ID ascending. The adapter uses a bounded
page and a cursor containing those same ordered values; Firestore cursors are
not exposed beyond infrastructure.

No entry is added to `firestore.indexes.json` for this query. The equality
filters and ordering are supported by Firestore's existing index behavior in
the Emulator Suite; the query and its Rules compatibility are covered by the
adapter and Rules integration tests. A future query with different constraints
must be reviewed independently rather than reusing this conclusion.

## Review Recent Timeline: current read contract

The first Timeline increment reads the existing `observations`, `measurements`
and `careWorks` collections through three separate owner- and Aquarium-scoped
bounded queries. Each source query returns at most the capability-local recent
limit (currently 20); the application merges and orders those candidates using
the Timeline contract. This is three bounded queries, not a promise of three
document reads: Firestore usage depends on the documents read and returned.

Observation candidates use `recordedAt` descending and document ID ascending.
Measurement candidates use `measuredAt` descending, `recordedAt` descending and
document ID ascending. Care Work candidates use `performedAt` descending,
`recordedAt` descending and document ID ascending. The application maps them to
discriminated Timeline items, assigns read-model-only `effectiveAt`, merges them
using the explicit source order `measurement`, `observation`, `care-work`, and
returns the newest 20 combined items. No Timeline collection, cursor or
additional Rules path is introduced.

## Record Care Work: current persistence contract

The accepted Care increment persists each completed Care Work action as an
independent document in the top-level `careWorks` collection. Each document
contains `aquariumId`, `ownerId`, `description`, Firestore timestamps
`performedAt` and `recordedAt`, and the explicit `provenance` value `manual`.
The document identifier is the stable `CareWorkId`.

The write is append-only: updates and deletes are denied. Rules require an
authenticated keeper, owner attribution and an existing Aquarium owned by that
keeper. The adapter validates the DTO with Zod and maps timestamps at the
infrastructure boundary. No Care Work is nested in Aquarium or duplicated into
Timeline; the current recent Timeline read projects it using `performedAt`.

## Future current Measurement state

The product will eventually need to answer which values are currently known for
the active Aquarium without repeatedly querying Measurement history. This is a
read concern, not a new domain Aggregate: immutable `Measurement` documents
remain the source of truth and a current-state model is reconstructable derived
data. Deleting or rebuilding that model must never alter Measurement history.

The latest-value policy is the same sequence already accepted for historical
reads:

1. `measuredAt` descending;
2. `recordedAt` descending;
3. `MeasurementId` ascending.

A retrospective Measurement remains in history but does not replace a newer
current value. Equal timestamps use the deterministic MeasurementId tie-breaker.
No separate definition of “latest” is allowed for current values or future
Timeline projections.

No current-state projection is implemented yet because there is no current-value
consumer in the product. The explicit future overview requirement was reviewed
against two shapes:

- one document per Aquarium and Parameter: up to one read per catalogue
  Parameter, narrow writes and simpler per-Parameter Rules;
- one document per Aquarium with a bounded `values` map: one overview read and
  one transaction target, with a small amount of write contention shared by all
  Parameters.

For Veril's current manual, low-frequency catalogue, the second shape is the
better read model for the question “what are the current values of this
Aquarium?”. Five current entries, and even a plausible 20–50 entries, are far
below Firestore's document-size limit. It should therefore be the preferred
shape when the first current-value consumer is accepted:
`measurementCurrentStates/{aquariumId}`. The map key is the `ParameterId`; each
value should contain only the current MeasurementId, canonical value, unit and
measurement time, plus `recordedAt` and provenance only if that consumer needs
them. Aquarium identity is already the document ID and ownership should be
derived from the Aquarium rather than duplicated.

This is a shape decision, not an implementation decision. It remains deferred
until a consumer exists because a client-maintained projection would add a new
trusted write path now. A transaction provides atomicity but does not by itself
let client Rules prove the complete latest-value ordering for retrospective
Measurements. Adding a server function solely to close that gap would be
disproportionate before a consumer exists. The one-document-per-Parameter
shape remains a fallback if the future security boundary cannot safely support
the Aquarium-level map.

If the projection is maintained by the web client, recording a Measurement and
conditionally updating its current value must use one Firestore transaction:
read the current value, compare the accepted ordering, then write the immutable
Measurement and projection atomically. Transactions are online-required and
may retry; transaction callbacks must not mutate application state. The
projection write must be validated at the Rules boundary, with `getAfter()` used
only if needed to enforce the relation between source Measurement and derived
state. A server function is deferred because Veril has no Functions runtime and
eventual consistency would complicate this invariant without a current
consumer.

The future model does not change `List Measurements`, which continues reading
the canonical `measurements` collection with its existing cursor contract. Its
first implementation belongs to the accepted current-state read slice, not to
the already accepted historical-list slice.
