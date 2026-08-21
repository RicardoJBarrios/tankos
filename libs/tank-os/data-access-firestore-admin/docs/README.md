# Firestore Admin batch adapters

This package is the trusted server-side Firestore boundary for TankOS batches.
It is physically separate from the browser Firestore package so Firebase Admin
cannot enter an Angular client bundle.

## Two batch models

`createFirestoreAdminAtomicBatch()` implements one finite all-or-nothing write
command. It is not resumable and does not publish progress.

`createFirestoreAdminBatchStore()` returns separate `submissionStore`,
`materializerStore` and `workerStore` capabilities, and
`createFirestoreAdminBatchExecutor()` implement the logical asynchronous batch
contract. The summary lives at the configured root collection, while chunks and
item results live in subcollections. The idempotency reservation is kept in a
separate collection and survives terminal cleanup.

The submission service first persists the request and materializes filters into
bounded chunks. The executor requires a host authorization gate, claims the
operation transactionally, owns a renewable-by-retry worker lease with a fencing
token, bounds both
the number of chunks loaded and item concurrency, checks cooperative
cancellation between chunks, records every item result and maintains retry-safe
chunk counters. It returns a terminal projection without a read-after-write.
Failed chunks and failed terminal summaries remain eligible for explicit retry;
successful and warning-only terminal summaries may be cleaned while their
idempotency reservation remains. The operation-specific `execute` callback must
be idempotent. The host supplies the scheduler, authoritative authorization and
that callback.

Removing a batch deletes its detail documents through bounded pages and keeps
a compact idempotency projection with the terminal record; large payloads and
original filter objects are not duplicated into the reservation. DTOs are validated at the
Firestore boundary with Zod. A retry therefore cannot recreate the operation
or execute it twice after cleanup. Every worker write carries its worker lease
token, and every materializer summary/chunk write carries its materialization
lease token; expired or reclaimed hosts are rejected transactionally.

The package does not configure Firebase, indexes, Security Rules, IAM/service
accounts or a worker runtime. Those are application/server composition
responsibilities. Admin SDK operations bypass Firestore Security Rules; the
host must authorize the caller and constrain the service account explicitly.

Technical timestamps use the `ClockPort` from `@tank-os/time`; the host normally
supplies `TimeService` at composition time. The adapter converts those UTC
instants to Firestore `Timestamp` values and keeps its provider fallback only
for standalone server use.

Terminal cleanup is opt-in in the executor and requires a separate cleanup
capability. This keeps destructive deletion outside the fenced worker store;
the host can omit cleanup for inspection or provide the submission store's
`remove` method explicitly.
