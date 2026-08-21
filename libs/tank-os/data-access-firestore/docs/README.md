# Firestore adapter decisions

This package is the physical Firebase Firestore boundary for
`@tank-os/data-access`. It owns Firestore SDK calls, Firestore timestamp
mapping, Zod DTO validation, pagination query construction and emulator tests.

The package must not leak Firestore types into the provider-independent core.
Its public API is only `@tank-os/data-access-firestore`.

## Writes, timestamps and retries

Mutating operations do not perform a read after the write. Technical metadata
uses an injectable client-owned `Timestamp` clock, defaulting to
`Timestamp.now()`, so the adapter can return the complete projected record in
the same command. Domain timestamps remain part of the caller's input and are
not rewritten by this adapter. A host that requires a trusted wall clock must
inject one at its boundary; the adapter does not silently add a follow-up read.

Create uses a transaction to check the deterministic generated id before the
write. An existing id is a `conflict`, never an overwrite. Callers should send
the same `requestId` when retrying one mutation; JSON/HTTP uses that value as
its idempotency key and a server may persist the result.

Firestore errors are translated at this boundary: permission failures become
`forbidden`, missing records `not-found`, existing ids and revision races
`conflict`, validation errors `validation`, provider availability/quota
failures `transient`, and configuration/precondition failures `permanent`.

This package contains the client-side Firestore boundary and finite CRUD/write
operations. Durable logical batches use the separate
`@tank-os/data-access-firestore-admin` package so Firebase Admin never enters
an Angular client bundle.

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
