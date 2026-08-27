# Firestore Persistence Conventions

Firestore is an infrastructure adapter. This document does not define
collections, document nesting, indexes, Security Rules or a final schema. Those
are consequences of accepted use cases, aggregate boundaries and query needs.

The Aquarium-specific persistence direction is owned by
[`libs/aquarium/docs/decisions.md`](../../../libs/aquarium/docs/decisions.md).

The global access, security, consistency and FinOps rules are defined in
[`@tankos/data-access-firestore`](../../../libs/data-access-firestore/docs/README.md).
This document records persistence conventions and accepted use-case-specific
contracts; it must not introduce a weaker or contradictory access pattern.

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
- Version published or used business contracts immutably. An edit creates a new
  version and preserves the previous version for historical interpretation;
  technical `schemaVersion` and business version are separate concerns.
- Add a concurrency marker when a validated operation needs it. Choose conflict
  behavior from the use case rather than a global locking convention.

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
Aquarium: its `AquariumId`, `AquariumName`, initial keeper membership, and the
attribution and time of its establishment. Each successful establishment gets a
new independent identity. `AquariumEstablished` is represented by that
immutable establishment evidence; no generic event store, Timeline projection
or future-domain collection is needed.

The implementation must create the new Aquarium with an opaque UUID v4 and
associate the authenticated keeper as its initial member/manager. No
keeper-level uniqueness claim,
global name uniqueness or count-based reservation is required. The exact
collection and document paths may be chosen during implementation, but they
must support reconstruction and membership-scoped access.

Security Rules must make the root private by default, allow an authenticated
member with the required capability to read it, reject unauthenticated and
non-member access, and prevent arbitrary membership changes. A persistence schema version is not required for this first DTO
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

## List Care Work: current read contract

The accepted Care history read reuses the top-level `careWorks` collection and
filters by `ownerId` and `aquariumId`. It orders by `performedAt` descending,
`recordedAt` descending and document ID ascending, and applies a capability-
local limit of 50 in the Firestore query. The result is presented as recent
Care Work; it does not claim to be the complete historical record and does not
introduce pagination.

The existing Care Work persistence schema remains the read boundary. Every
returned document is validated before mapping to a small `CareWorkListItem`.
No new collection, index or generic history reader is introduced. A future
pagination or planned-work query must be reviewed independently.

## Plan Care Work: current persistence contract

Planned intentions are independent documents in the top-level
`plannedCareWorks` collection. They contain `aquariumId`, `ownerId`,
`description`, Firestore timestamps `plannedFor` and `recordedAt`, and manual
provenance. They are not completed `CareWork` facts and are not included in
Timeline.

The query filters by `ownerId` and `aquariumId`, orders by `plannedFor` and
`recordedAt` ascending, then document ID ascending, and uses the required
composite index in `firestore.indexes.json`. The planned-care adapter is
separate from the completed-care adapter, validates every document with Zod,
and exposes no Firestore types beyond infrastructure. Rules allow owner-only
reads and creation. Completion uses an owner-scoped atomic batch that creates
the corresponding `careWorks` document and deletes the planned document;
Rules require both writes through `existsAfter` and verify the post-batch
`ownerId`, `aquariumId` and `description` against the deleted plan through
`getAfter`. A direct delete is allowed only for the authenticated owner and
represents cancellation; when a delete is part of a batch that creates a
`CareWork` with the same ID, the completion checks remain required. The resulting document uses the
same underlying UUID as the planned document only for correlation, while
`PlannedCareWorkId` and `CareWorkId` remain distinct domain identities.

## Accepted weekly recurring Care direction

The next Care increment will persist a Care-specific `RecurringCarePlan` in a
separate top-level `recurringCarePlans` collection. A plan will hold its owner,
Aquarium, weekly anchor and reference to its sole outstanding concrete
`PlannedCareWork`; it will not be nested in Aquarium or mixed into
`plannedCareWorks`. The first recurring occurrence, later advancement and stop
operation will use atomic Firestore operations. This is an accepted design
direction, not an implemented collection or Rules contract yet.

## Current Measurement values

The Aquarium Dashboard answers which values are currently known for the active
Aquarium directly from immutable `Measurement` documents. This is a read
concern, not a new domain Aggregate: Measurements remain the source of truth.

The latest-value policy is the same sequence already accepted for historical
reads:

1. `measuredAt` descending;
2. `recordedAt` descending;
3. `MeasurementId` ascending.

A retrospective Measurement remains in history but does not replace a newer
current value. Equal timestamps use the deterministic MeasurementId tie-breaker.
No separate definition of “latest” is allowed for current values or future
Timeline projections.

For each closed Parameter, the adapter performs an owner- and Aquarium-scoped
query with `limit(1)` and the canonical ordering. These independent reads run
concurrently. A missing result is rendered as missing evidence, while a query
failure fails the whole current-values read; absence is never inferred from an
infrastructure error.

The exact query is supported by a collection composite index over `ownerId`,
`aquariumId`, `parameterId`, `measuredAt` descending, `recordedAt` descending
and document ID ascending. The explicit document-ID direction makes ties stable
without an in-memory sort.

This is the Spark-first production baseline: Cloud Firestore and Authentication
are sufficient, and no Cloud Functions, projection collection, backfill or
scheduled reconciliation is active. The bounded direct-read cost is appropriate
for the five-Parameter manual catalogue.

A trusted `measurementCurrentStates/{aquariumId}` materialized projection via a
Firestore Function remains a future optimization only. If a real consumer shows
that five direct reads are insufficient, it must be introduced as rebuildable,
eventually consistent derived data with a separately approved initialization
and recovery plan.

`List Measurements` remains the independent historical read with its existing
cursor contract.

## Configure Parameter Targets: accepted persistence direction

`ParameterTarget` is Aquarium-owned configuration, not an independent
aggregate or historical document. The accepted shape is an optional bounded
`parameterTargets` map on `aquariums/{aquariumId}`, keyed by the five closed
`ParameterId` values. Each configured entry contains only canonical finite
non-negative `minimum` and `maximum` values with `minimum <= maximum`; the
canonical Unit is supplied by the Parameter catalogue and is not duplicated.

This gives the Dashboard one bounded Aquarium configuration read and avoids
five reads, a speculative collection, an index or backend infrastructure. A
capability-specific transaction updates only this map and preserves other
Parameter entries. Firestore Rules must restrict updates to the owner, known
keys and the permitted structural fields; they do not interpret biological
meaning. The concrete Rules contract and malformed-document tests belong to
the implementation specification.
