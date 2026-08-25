# List Measurements

**Status:** Accepted and implemented.

## User value

An authenticated keeper can review the quantitative readings recorded for the
currently selected Aquarium. This makes the existing Measurements useful after
capture and provides evidence for future parameter history without introducing
charts or a universal Timeline.

## Actor and preconditions

The actor is an authenticated aquarium keeper.

The operation requires:

- a valid authenticated session;
- an Active Context containing an owned Aquarium;
- access to the existing `measurements` records for that Aquarium.

## Scope

This increment lists Measurements only. It does not edit, correct or delete
records, calculate trends, define recommended ranges, combine Observations or
Measurements into a Timeline, or introduce Care, Sensors, Livestock or
Equipment data.

## Success result

The application returns a page of the keeper's Measurements for the selected
Aquarium. Each item exposes the information needed to identify the reading:
Parameter, canonical value and Unit, `measuredAt`, `recordedAt` and provenance.

The result is a read model. It does not hydrate or mutate the `Measurement`
aggregate and does not create a Domain Event or Fact.

## Ordering and pagination

Results are ordered by:

1. `measuredAt` descending;
2. `recordedAt` descending;
3. `MeasurementId` ascending as a deterministic tie-breaker.

The query is paginated with an implementation page size of 20 records. The
continuation cursor is opaque to the domain and UI. A later page uses the cursor
without changing the ordering. The page size remains an implementation choice,
not a product rule.

This ordering answers when the reading was taken while preserving deterministic
results for retrospective entries and equal timestamps.

## Ownership and security

Only the authenticated owner of the Active Context may read its Measurements.
Firestore Rules remain authoritative and must enforce authentication, Aquarium
ownership and the relationship between each Measurement and its Aquarium.

Active Context and client navigation are scope and UX helpers; neither grants
authorization. No private-resource existence is revealed to another keeper or
an unauthenticated client.

## Expected failures

- no authenticated keeper: return a safe unauthorized state;
- no Active Context: do not query Measurements and direct the keeper to select
  an Aquarium;
- unavailable or unauthorized Aquarium: return a safe unavailable state;
- malformed persisted Measurement: reject the affected read page at the
  adapter boundary rather than presenting untrusted partial data;
- infrastructure failure: show a recoverable error and never present the page
  as complete.

An empty result is successful: explain that no Measurements have been recorded
for the selected Aquarium and offer the existing `Record Measurement` action.

## Persistence and architecture

No Firestore schema change is required. The read uses the existing top-level
`measurements` collection and its accepted persisted fields. The adapter
validates external documents with Zod before mapping them to a small read model.

The application needs a capability-specific read port for a bounded page and
cursor. It must not introduce a generic history repository, CQRS framework,
projection store, Signal Store, Nx library or Timeline collection.

## Offline and privacy

The read is online-required for this increment. It does not introduce offline
queries, new cache policy, export behavior or additional personal data.

## Testing and Definition of Ready

| Criterion                           | Result | Evidence                                                                                                        |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Status, actor and value             | Ready  | The keeper reviews Measurements in the selected Aquarium; the increment is explicitly not implemented yet.      |
| Scope and observable result         | Ready  | A bounded ordered page, empty state and recoverable failures are defined without charts or Timeline.            |
| Ordering and pagination             | Ready  | The semantic order and opaque cursor behavior are explicit; page size remains implementation detail.            |
| Ownership and security              | Ready  | Authenticated owner scope and Rules authority are explicit.                                                     |
| External data and malformed records | Ready  | Zod validation at the adapter boundary and fail-closed page behavior are defined.                               |
| Architecture and persistence        | Ready  | Existing collection and Measurement aggregate are reused; no schema or generic framework is required.           |
| Testing path                        | Ready  | Domain behavior is unchanged; application, adapter, Rules, Angular and browser journey coverage are identified. |
| Open questions                      | Ready  | Page size, presentation details and future correction/history policies are non-blocking.                        |

## Testing strategy

- application: map a page, preserve ordering and cursor, and handle empty,
  missing-context and failure states;
- adapter: query the real Emulator Suite with owner filtering, pagination,
  ordering and malformed-document rejection;
- Rules: verify owner reads and reject unauthenticated and cross-owner reads;
- Angular: verify loading, empty, ordered results, continuation, errors and
  the missing Active Context recovery path;
- E2E: extend the canonical keeper journey to review recorded Measurements;
  do not repeat domain or Rules assertions there.

## Deferred decisions

- charts and parameter-specific history views;
- corrections, deletion and retention;
- combining Observations, Measurements and Care into Timeline;
- offline history and synchronization;
- filtering by Parameter or time range;
- page-size UX and long-history navigation details.
