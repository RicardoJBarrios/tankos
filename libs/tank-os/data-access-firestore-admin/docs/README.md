# Firestore Admin batch adapters

This package is the trusted server-side Firestore boundary for TankOS batches.
It is physically separate from the browser Firestore package so Firebase Admin
cannot enter an Angular client bundle.

## Two batch models

`createFirestoreAdminAtomicBatch()` implements one finite all-or-nothing write
command. It is not resumable and does not publish progress.

`createFirestoreAdminBatchStore()` and
`createFirestoreAdminBatchExecutor()` implement the logical asynchronous batch
contract. The summary lives at the configured root collection, while chunks and
item results live in subcollections. The idempotency reservation is kept in a
separate collection and survives terminal cleanup.

The submission service first persists the request and materializes filters into
bounded chunks. The executor requires a host authorization gate, claims the
operation transactionally, owns a renewable-by-retry worker lease, bounds both
the number of chunks loaded and item concurrency, checks cooperative
cancellation between chunks, records every item result and maintains retry-safe
chunk counters. It returns a terminal projection without a read-after-write.
Failed chunks and failed terminal summaries remain eligible for explicit retry;
successful and warning-only terminal summaries may be cleaned while their
idempotency reservation remains. The operation-specific `execute` callback must
be idempotent. The host supplies the scheduler, authoritative authorization and
that callback.

Removing a batch deletes its detail documents in provider-safe chunks and keeps
the idempotency reservation with the terminal record. A retry therefore cannot
recreate the operation or execute it twice after cleanup.

The package does not configure Firebase, indexes, Security Rules, IAM/service
accounts or a worker runtime. Those are application/server composition
responsibilities. Admin SDK operations bypass Firestore Security Rules; the
host must authorize the caller and constrain the service account explicitly.
