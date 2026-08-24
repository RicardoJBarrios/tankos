# List Observations

**Status:** Accepted and implemented.

## User value

An authenticated keeper can review the qualitative evidence previously recorded
for the currently selected Aquarium. This closes the first Observation loop:
notice something, record it, and return to it later.

## Actor and preconditions

The actor is an authenticated aquarium keeper.

The operation requires:

- a valid authenticated session;
- an Active Context containing an owned Aquarium;
- access to the existing `observations` records for that Aquarium.

## Scope

This increment lists existing qualitative Observations only. It does not edit,
delete, search or classify them, combine them with Measurements or Care Work,
or introduce Timeline, categories, tags, attachments or interpretations.

## Success result

The application returns a bounded list of the keeper's Observations for the
selected Aquarium. Each item exposes only its stable identity, recorded text
and recording time.

The result is an Observation-specific read model. It does not hydrate or
mutate the `Observation` aggregate and does not create a Domain Event or Fact.

## Time and ordering

The current Observation model has only `recordedAt`, meaning when Veril
accepted the durable record. Observations are ordered by:

1. `recordedAt` descending;
2. `ObservationId` ascending as a deterministic tie-breaker.

This is the current review order. It does not claim when the keeper first saw
the underlying condition. A separate observed-at decision remains outside this
slice.

## Bounded read

The first version uses one bounded query with a capability-local limit of 50
Observations and no pagination. Current usage is expected to be low, and this
keeps the first review flow proportionate without introducing cursor state.

The query must never be an unbounded collection read. Pagination becomes a
separate implementation decision if real usage, document volume or read cost
shows that the bound is insufficient.

## Ownership and security

Only the authenticated owner of the Active Context may read its Observations.
Firestore Rules remain authoritative and must enforce authentication, Aquarium
ownership and the relationship between each Observation and its Aquarium.
Active Context and client navigation are scope and UX helpers; neither grants
authorization.

## Expected failures

- no authenticated keeper: return a safe unauthorized state;
- no Active Context: do not query Observations and direct the keeper to select
  an Aquarium;
- unavailable or unauthorized Aquarium: return a safe unavailable state;
- malformed persisted Observation: reject the read at the adapter boundary
  rather than presenting partial or defaulted data;
- infrastructure failure: show a recoverable error and never present the page
  as complete.

An empty result is successful: explain that no Observations have been recorded
for the selected Aquarium and offer the existing `Record Observation` action.

## Persistence and architecture

The read uses the existing top-level `observations` collection and persisted
fields. No schema change is required. The adapter validates external documents
with Zod before mapping them to the read model.

The application uses a capability-specific `ObservationReader` port. It must
not introduce a generic history reader, pagination framework, Timeline
collection, Signal Store, Nx library or shared Fact repository.

## Offline and privacy

The read is online-required for this increment. It introduces no new cache,
export or personal-data policy.

## Testing and Definition of Ready

- application: authentication, Active Context, empty result, one/multiple
  ordered results and infrastructure failure;
- adapter: real Emulator Suite owner-scoped query, ordering, mapping, bounded
  result and malformed-document rejection;
- Rules: owner read allowed, unauthenticated read denied and cross-owner read
  denied;
- Angular: missing context, loading, empty, results, error and navigation to
  `Record Observation`;
- E2E: extend the canonical keeper journey to review the recorded Observation.

The slice is ready because its user value, scope, current time semantics,
bounded query, authorization boundary, failure behavior and proportional test
path are explicit. Pagination and retrospective observed-at semantics remain
non-blocking future decisions.

## Deferred decisions

- retrospective `observedAt` semantics;
- pagination or long-history navigation;
- search, filtering and classification;
- editing, deletion and retention;
- combining Observations, Measurements and Care into Timeline;
- offline history and synchronization.
