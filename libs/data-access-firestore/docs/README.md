# Firestore adapter decisions

This package is the physical Firebase Firestore boundary for
`@tankos/data-access`. It owns Firestore SDK calls, Firestore timestamp
mapping, Zod DTO validation, pagination query construction and emulator tests.

The package must not leak Firestore types into the provider-independent core.
Its public API is only `@tankos/data-access-firestore`.

Entity-specific Firestore adapters must compose
`createFirestoreRecordSchema(dataSchema)` instead of copying the common
`data`, `lifecycle`, `revision` and `metadata` envelope schema.

## Writes, timestamps and retries

Mutating operations do not perform a read after the write. Technical metadata
uses the injectable `ClockPort` from `@tankos/time`, normally provided by
`TimeService`; the adapter converts the resulting UTC instant to a Firestore
`Timestamp`. Domain timestamps remain part of the caller's input and are not
rewritten by this adapter. A host that requires a trusted wall clock must
inject it at its boundary; the adapter does not silently add a follow-up read.

Create uses a transaction to check the deterministic generated id before the
write. An existing id is a `conflict`, never an overwrite. Firestore CRUD uses
`expectedRevision` as its optimistic-concurrency and retry-safety boundary;
callers must retain the returned revision when retrying an existing-record
command, and every existing-record command must provide it. `AccessContext.requestId` is not persisted by this adapter. JSON/HTTP
has a separate idempotency-key contract implemented by its server.

Firestore errors are translated at this boundary: permission failures become
`forbidden`, missing records `not-found`, existing ids and revision races
`conflict`, validation errors `validation`, provider availability/quota
failures `transient`, and configuration/precondition failures `permanent`.

This package contains the client-side Firestore boundary and finite CRUD/write
operations. `createFirestoreAtomicBatch()` maps the provider-neutral
`AtomicBatchPort` to the Firebase Client SDK. It validates document paths,
enforces Firestore's 500-operation limit and leaves authorization to Firestore
Rules. It does not claim to provide a trusted worker, server scheduler or
atomicity across multiple batches; those guarantees are not available to a
browser-only Firebase application.

## Local Firestore cache

`createFirestoreLocalCache()` adapts Firebase's current local-cache API for
`initializeFirestore`:

```ts
initializeFirestore(app, {
  localCache: createFirestoreLocalCache({ mode: 'memory' }),
});
```

The default is `memory`, which is safe for private data and does not retain
documents between sessions. Persistent caching is explicit:

```ts
createFirestoreLocalCache({ mode: 'persistent-single-tab' });
createFirestoreLocalCache({ mode: 'persistent-multi-tab' });
```

The host must obtain trusted-device consent before enabling either persistent
mode because Firestore retains cached documents and pending writes locally.
The multi-tab option coordinates one browser profile; it is not a server-side
cache or a cross-device invalidation mechanism.

Firestore's SDK cache and TankOS's `TtlCache` have different responsibilities:
the SDK cache controls offline transport behavior, while `TtlCache` controls
application freshness, scoped invalidation and request deduplication. Do not
assume that SDK persistence alone satisfies a domain TTL or authorization
boundary.

Angular Service Worker data caching is intentionally not configured for
Firestore/API responses. Private reads must remain under the application data
access policy, not an opaque browser HTTP cache. The current application
Service Worker caches static assets only.
