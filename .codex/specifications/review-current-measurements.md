# Review Current Measurements

**Status:** Ready and implemented on the Spark-first production baseline.

## Product value

The keeper needs to see the latest known quantitative values for the selected
Aquarium without interpreting them as a health diagnosis or freshness claim.

## Scope

The Aquarium Workspace shows the five closed Parameters with their latest known
canonical value, canonical Unit and `measuredAt`. A Parameter without a
Measurement is shown as `Sin datos`. Charts, ranges, alerts, trends, Timeline,
AI and interpretation remain out of scope.

## Source of truth and latest semantics

`Measurement` remains the independent aggregate and durable historical Fact.
Current values are read directly from `measurements`; no current-state document
or backend projection is part of the active architecture.

For each Parameter, the adapter queries the selected owned Aquarium with
`limit(1)` and the canonical total ordering:

1. `measuredAt` descending;
2. `recordedAt` descending;
3. `MeasurementId` ascending.

An older retrospective Measurement remains historical evidence and does not
replace a newer value. Equal timestamps use the lexicographically smaller ID.

## Application and UX

`ReviewCurrentMeasurements` requires an authenticated keeper and Active
Context, runs the independent Parameter reads concurrently, and distinguishes a
missing value from an infrastructure failure. The Workspace owns its local
loading, error and rendered-value state; it introduces no shared store.

## Security and persistence

The existing Measurement Rules remain authoritative: only an owner can query
their Aquarium's Measurements; anonymous and cross-owner requests are denied.
The direct queries use the existing top-level `measurements` collection and a
single composite index for owner, Aquarium, Parameter and canonical ordering.

## Spark-first decision

Current production runs on Firebase Spark. It requires Cloud Firestore and
Authentication only, not Blaze, Cloud Functions or a materialized projection.
The trade-off is up to five bounded reads for the closed Parameter catalogue
instead of one projection read. A trusted `measurementCurrentStates` projection
via Cloud Functions remains a future optimization only if measured usage proves
that direct reads are insufficient.

## Definition of Ready

- Product value, scope and missing-value behaviour: defined.
- Latest semantics: reuse the canonical Measurement ordering.
- Authorization: reuse owner-scoped Measurement Rules.
- Persistence: no collection or aggregate change; one required composite index.
- Testing: application, adapter, Rules, Angular and canonical E2E coverage.
- Deferred scope: projection, Functions, Signal Store, interpretation and
  Dashboard behaviour.
