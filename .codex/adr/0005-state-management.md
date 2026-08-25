# ADR-0005: Signals-first state management

## Status

Accepted

## Context

UI and feature state need a predictable model without introducing a global store
before its coordination cost is justified. See the
[target architecture](../archive/architecture/target-architecture.md).

## Decision

Use local Signals and `computed()` for component and view state. Use NgRx Signals
20.1.0's `signalStore` in a scoped service or facade when a feature shares state,
needs complex transitions, shared caching or cross-view coordination. Use RxJS for
stream-oriented asynchronous work and bridge at explicit boundaries.

Persistent domain data remains owned by `data-access` and Firestore. Signals do
not become a second persistence layer or a duplicate pending-write queue.

## Consequences

- Most state stays local and short-lived.
- Stores are scoped to the smallest useful injector.
- The store library is aligned with Angular 22 and must be upgraded together with
  the Angular major without changing persistence ownership.

## Alternatives considered

- One global store: rejected as premature.
- Persist every Signal automatically: rejected because it creates competing truth.
- RxJS for all local state: rejected where Signals provide the simpler model.
