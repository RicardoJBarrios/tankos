# ADR-0006: Offline persistence, trusted devices and synchronization

## Status

Accepted

## Context

The private application must remain useful offline without silently losing writes
or retaining sensitive data on every device. Firestore provides native local
persistence and synchronization but uses last-write-wins for competing document
updates. See the [target architecture](../architecture/target-architecture.md).

## Decision

Use Firestore `persistentLocalCache` with `persistentMultipleTabManager()` only
after explicit trusted-device consent. Untrusted devices use memory cache and
session-scoped authentication. If persistent cache initialization fails, degrade
to memory cache; do not invent single-tab coordination or another local database.

Treat Firestore as the only pending-write queue. Derive UI status from application
mutation tracking plus snapshot metadata such as `hasPendingWrites` and `fromCache`.

Before logout, freeze new mutations and wait for current writes while still
authenticated. Offline logout with pending writes is postponed by default. The
only immediate alternative is an explicit destructive discard that coordinates
all tabs, terminates Firestore and clears the complete local persistence before
ending the session. Selective discard is not assumed.

Classify each accepted domain change as last-write-wins acceptable,
history-preserving or online-required. Transactions and current-value invariants
are online-required.

## Consequences

- Trusted-device mode enables the complete offline experience across tabs.
- IndexedDB is persistent but not an encrypted secure store.
- Logout and update flows need a minimal cross-tab safety signal, not another queue.
- A history-preserving record needs idempotent IDs and Rules only when its
  accepted domain semantics require that protection.

## Implementation timing

Offline is an accepted capability direction, not a requirement for every
command. `Establish an Aquarium` is online-required. Persistent cache,
trusted-device consent, multi-tab coordination, offline logout and per-operation
conflict policy are deferred until an accepted operation needs offline behavior.

## Alternatives considered

- Persistent cache on every device: rejected for privacy.
- A custom sync engine or local database: rejected until a proven limitation.
- Generic conflict resolution: rejected in favor of per-operation classification.
- Silent loss of pending writes on logout: rejected.
