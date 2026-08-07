# List My Aquariums

**Status:** Accepted

## User value

The keeper can see which private Aquariums they currently own and distinguish
them before a future use case lets them enter one Aquarium context.

This use case lists available Aquariums only. It does not select one, establish
Active Context or grant access.

## Actor

An authenticated aquarium keeper.

For the MVP, Firebase Anonymous Auth is an accepted application identity
mechanism for this actor. It is not a domain identity model; account linking,
recovery and collaboration remain deferred.

## Preconditions

- The keeper is authenticated.
- The keeper may own zero, one or many independent Aquariums.
- Aquariums are private and have one owning keeper in the current version.

## Main flow

1. The application obtains the authenticated keeper identity.
2. It retrieves the private Aquariums whose `ownerId` is that identity.
3. It validates each persisted document at the Firestore adapter boundary.
4. It maps each result to the minimum list representation.
5. It returns the list ordered by establishment time, newest first.

## Result

The query returns a list of `AquariumListItem` read models. Each item contains
only:

- `AquariumId`;
- `AquariumName`.

The establishment timestamp is used for ordering but is not exposed by this
read model. The result does not hydrate complete Aquarium aggregates.

## Ordering

Items are ordered by `establishedAt` descending so the most recently established
Aquarium appears first. This uses durable establishment evidence already present
in the accepted persistence contract and is useful when a keeper has just
created an Aquarium.

If two records have the same timestamp, `AquariumId` provides the deterministic
ascending tie-breaker. The order must not be derived from Firestore document ID
alone.

## Empty result

When the keeper owns no Aquariums, the result is an empty list, not an error.
The UI explains that no Aquarium has been established yet and provides the
existing `Establish Aquarium` action. It does not introduce onboarding,
dashboard behavior or an Active Context.

## Expected failures

- An unauthenticated client cannot execute the query successfully.
- An authenticated keeper may receive an infrastructure or persistence error;
  the UI presents a recoverable failure state.
- Malformed or incomplete external documents are rejected by boundary
  validation and are not exposed as list items.

Firebase Anonymous Auth is authenticated for this purpose. Therefore an
anonymous-authenticated MVP keeper may list their own Aquariums; “unauthenticated
denied” means a client with no valid Firebase Auth session.

## Authorization

The Firestore query is restricted by `ownerId == authenticatedKeeperId`.
Client-side filtering is never authorization. Firestore Security Rules remain
authoritative and must reject unauthenticated reads and prevent cross-owner
results.

## Persistence contract

The adapter performs the minimum owner-scoped read over the existing `aquariums`
documents. It uses the already persisted `ownerId`, `name`, `establishedAt` and
document identifier; no new collection or global schema is introduced.

The read path does not require Timeline projection, `AquariumEstablished`
replay, event sourcing or a generic query framework. It reads current persisted
Aquarium state directly.

The owner filter is the only required Firestore query constraint for this slice.
Ordering is applied from the validated persisted values with the stated
tie-breaker. No speculative index is added; any index required by the concrete
SDK query must be justified by this accepted use case only.

## Domain and application boundary

The query is an application read operation over Aquarium ownership. It does not
change the Aquarium aggregate and does not create a domain event.

`AquariumListItem` is a dedicated minimal read model. A complete `Aquarium`
aggregate is not returned because the list does not need its full domain shape.
This is a use-case-specific representation, not a generic projection system.

## State management

The first implementation should use local application/component state for
loading, success, empty and failure states. NgRx Signal Store is not required:
the list is not yet shared across routes or non-trivial enough to justify
centralized state.

## Offline and visibility

The query is online-required for this slice. No offline list contract, cache
policy or synchronization behavior is introduced.

All returned Aquariums remain private. Public presentation, collaboration and
accessing an Aquarium as Active Context are separate future use cases.

## Acceptance criteria

- An authenticated keeper can retrieve all private Aquariums they own.
- A keeper owning zero Aquariums receives an empty result without an error.
- A keeper owning one Aquarium receives one item containing only its ID and
  name.
- A keeper owning multiple Aquariums receives all of their items in newest-first
  establishment order, with deterministic ordering for equal timestamps.
- A keeper cannot retrieve another keeper's Aquarium through the query.
- An unauthenticated client cannot retrieve private Aquariums.
- Persisted documents are validated with Zod before entering application or
  read-model code.
- The query does not select, enter or persist Active Context.
- The query does not use Timeline data, historical event replay or event
  sourcing.

## Validation scope

The minimum validation path is:

- application tests for zero, one, multiple, unauthenticated and infrastructure
  failure outcomes;
- Firebase SDK adapter tests against Auth and Firestore Emulator Suite for
  owner-scoped retrieval, multiple results, cross-owner isolation, ordering and
  malformed DTO rejection;
- Security Rules tests for unauthenticated reads, owner queries and cross-owner
  isolation;
- Spectator + Vitest tests for loading, empty, one/multiple results and failure.

Browser E2E, Signal Store and offline tests are not required for this slice.

## Definition of Ready assessment

| Mandatory criterion                          | Result | Evidence                                                                                             |
| -------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Accepted status, actor and value             | Ready  | Status, Actor and User value are explicit.                                                           |
| Scope, preconditions, outcome and failures   | Ready  | Listing is separated from selection/context entry; empty and failure behavior are defined.           |
| Terminology, rules and invariants            | Ready  | Aquarium ownership, privacy, cardinality and MVP identity use accepted project rules.                |
| Persistence, authorization and offline class | Ready  | Existing owner field is queried; Rules remain authoritative; the query is online-required.           |
| Domain/read-model boundary                   | Ready  | A minimal `AquariumListItem` read model is defined without aggregate hydration.                      |
| ADRs, architecture and validation path       | Ready  | Existing Firebase, Firestore, Zod and testing decisions apply without new architecture.              |
| Smallest implementation path                 | Ready  | No new dependency, Nx project, Signal Store, projection framework or generic repository is required. |

## Deferred decisions

- Accessing one listed Aquarium and establishing Active Context.
- Collaboration and memberships.
- Account linking and recovery for Anonymous Auth.
- Offline listing, cache and synchronization policy.
- Pagination or broader scalability behavior if Aquarium counts require it.
- Rich list metadata such as images, livestock, equipment, measurements or
  Timeline summaries.
