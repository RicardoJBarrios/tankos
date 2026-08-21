# Batch Operations Policy Review

**Purpose:** review the decisions recorded for batch operations and check their
coherence across Veril. This document is an audit of the current direction; it
does not silently resolve an identified ambiguity.

**Final specification:** [`BATCH_OPERATIONS_FINAL_SPEC.md`](BATCH_OPERATIONS_FINAL_SPEC.md)
is the authoritative consolidated behavior. This document preserves the review
reasoning and Firebase-specific technical assessment.

## Technical precedence rule

If a previously recorded product decision conflicts with a technically required
Firebase/Firestore practice for security, consistency, service limits,
reliability or data integrity, the technically correct solution prevails. The
deviation must be documented with its reason, affected decision and resulting
behavior.

## Closed and coherent behavior

The following rules form a consistent batch model:

- Batch operations are asynchronous and the originating management screen does
  not wait for completion.
- A confirmed filtered operation freezes its exact matching set. Pagination,
  later filter changes and later record changes do not alter that scope.
- The frozen operation scope and progress are held in a temporary operation
  entity while the batch is active, allowing interruption and manual resume.
- Successful and warning-only terminal operations may be cleaned; failed
  operations remain inspectable and retryable until explicit administrative
  cleanup. Durable follow-up state belongs on affected records.
- One confirmation applies to a complete batch. Before confirmation, the
  administrator sees its scope, count and selected records. This is the general
  pattern for equivalent bulk operations.
- Processing is independent per record. A failed item does not cancel the
  remaining items. The operation reports successes and failures.
- Failed deletions remain marked and retryable. Warnings and execution details
  belong to the temporary batch operation and are not added to the original
  record.
- A batch may modify or delete directly without revalidating each record at
  resume time. Bulk modifications do not preserve previous business values.
- Each affected record receives its own server `updatedAt` and administrator
  identity inside the operation.
- A management screen can own multiple concurrent batches, each with an
  independent frozen scope and progress.
- No foreign keys, locks or special conflict-management subsystem are used.
- Lifecycle timestamps use the server. The temporary batch entity is explicitly
  exempt from the ordinary persisted-record `schemaVersion` rule.
- Real-time progress is optional. Correctness, resumability and final reporting
  do not depend on it.
- The administrative deletion view supports entity-type separation or a
  combined inbox, state/logical filters, pagination, restoration and retries.

## Resolved concurrency and batch-state decisions

### Concurrency resolution

This point is closed by the natural persistence behavior. A deletion is
terminal: if a later modification reaches a record that is already deleted, it
does not recreate or modify it. The operation detects the deleted state and
returns a warning, not an error. For competing modifications, the last one
applied by the server wins. No special conflict subsystem is required.

### Batch-specific failure state

The original record is not extended with `lastDeletionError` or another
batch-specific warning/error field. The temporary batch operation schema owns
the batch ID, affected record schema/type, frozen record IDs, processing state
and mandatory operation metadata, including warnings and execution results.
Successful and warning-only terminal entities may be deleted while their
idempotency reservation remains; failed entities retain their diagnostics for
inspection and retry until explicit administrative cleanup. The original
record retains only its normal lifecycle state.

## Risks that are understood but not contradictions

- Freezing a set and then applying a modification without revalidation can
  overwrite changes made after confirmation. This is the explicitly selected
  direct bulk-operation behavior, not an unresolved implementation conflict.
- Showing the complete selected list can be expensive for very large result
  sets. The product requirement is clear; the rendering/transport strategy is
  still an implementation concern.
- Deleting the temporary operation entity means there is no permanent batch
  audit trail. Per-record deletion state remains, but batch-specific warnings
  and execution details do not get copied into the original data model.
- A batch may be resumed manually from the management screen that created it;
  no global batch dashboard or automatic scheduling is required initially.

## Current conclusion

The batch lifecycle, scope selection, confirmation, pagination, resumability,
partial-failure behavior, deletion lifecycle, concurrency semantics and
server-time rules are coherent and sufficiently closed for specification work.
The batch-specific temporary schema is the designated place for operation
metadata and warnings; the original domain records remain unchanged except for
their ordinary lifecycle fields.

## Firebase/Firestore expert review

### Verdict

The product behavior is implementable with Firebase, but the logical
`BatchOperation` must not be confused with a Firestore `WriteBatch`.
Firestore write batches are atomic: all writes succeed or none are applied.
That is incompatible with the selected per-record partial-failure behavior if
one Firestore write batch represents the whole operation. The implementation
must therefore use one logical `BatchOperation` composed of smaller execution
units.

### Recommended execution boundary

For the current web application, the bulk executor should be server-side, not
the Angular client:

- the client creates/requests the logical operation after the administrator
  confirmation;
- a trusted Cloud Function or other server worker authenticates and
  authorizes the administrator;
- the worker reads the frozen record IDs from `BatchOperation` and executes
  bounded chunks using the Admin/server Firestore client;
- each chunk records progress and warnings in the temporary operation entity;
- the operation entity is deleted only after the logical operation reaches its
  terminal state.

Firebase's documentation recommends a server client library with parallelized
individual writes or BulkWriter for large bulk work, rather than a mobile/web
SDK or one oversized atomic batch. A server client library bypasses Firestore
Security Rules, so the worker must enforce the administrator authorization in
its callable/HTTP/task entry point and be protected by IAM. Security Rules are
still required for client access to the normal data model.

### Chunking and atomicity

The logical batch is partial-failure tolerant; each Firestore execution unit
has its own atomicity. A failed chunk must not cause already successful chunks
to be replayed blindly. Progress needs an idempotent per-item or per-chunk
state in `BatchOperation`, and retrying a completed item must be safe.

The implementation must account for Firestore request-size and Security Rules
access-call limits. Rules that perform document lookups have both per-operation
and whole-batch access limits. This is another reason not to send an unbounded
filtered operation directly from the browser as one client write batch.

The frozen `recordIds` set is a logical contract, not necessarily one Firestore
array. To remain within document-size and contention limits, its physical
representation must use chunk documents or an `items` subcollection under the
temporary operation. Progress and warning state should be written at that same
chunk/item granularity. The server, not the browser, must evaluate the final
filter and materialize this frozen scope at confirmation time.

### Concurrency and terminal deletion

The selected behavior is compatible with Firestore when implemented as follows:

- normal modifications use an update that requires the document to exist;
  they must not use merge-set semantics that could recreate a deleted document;
- a modification that reaches an already physically deleted document is
  classified as a warning/not-found outcome in the logical batch result;
- deletion is a terminal physical operation;
- concurrent writes are allowed to resolve by Firestore commit/application
  order, with no application-level conflict subsystem;
- if a stronger ordering guarantee is ever needed, it would require an explicit
  server-side sequencing design and would be a change to the current direction.

This preserves the product rule without pretending that a parallel BulkWriter
provides a global order across all writes.

### Managed Firestore bulk delete

Firestore's managed bulk-delete operation is not the natural executor for this
product batch contract. It is useful for administrative collection/collection
group cleanup, but Veril needs a frozen set of IDs, entity-specific warnings,
contextual authorization, resumable per-item progress and a logical operation
schema. A custom server worker is the closer fit. The managed service also
requires billing and has its own long-running-operation lifecycle.

### Future automation

When automatic execution is later introduced, Cloud Tasks/task-queue Functions
are a better fit than a Firestore-triggered function that performs an
unbounded scan. Task queues provide asynchronous execution, rate limiting and
retry configuration. The worker must remain idempotent because asynchronous
Cloud Functions use at-least-once delivery semantics.

### Current repository fit

The repository currently has a Firebase web client, Firestore Rules, indexes
and emulator configuration, but no deployed `functions` source in the
workspace. Existing client-side `writeBatch`/transaction uses are bounded
domain operations. The future generic batch executor should therefore be
introduced as a separate server-side capability rather than generalizing the
existing browser repositories to issue unrestricted bulk writes.

### Firebase review conclusion

The product intent remains accepted, but the following physical constraints
override any simpler implementation interpretation:

- `BatchOperation` is the logical resumable workflow, not one Firestore
  `WriteBatch`.
- A frozen ID set must be physically chunked when necessary; it must not be
  forced into one unbounded document array.
- Bulk execution must be server-side and use bounded writes, BulkWriter or
  parallel server writes.
- Modifications must be existence-preserving updates, never merge-set writes
  that can recreate terminally deleted records.
- The executor must be idempotent and store progress at chunk/item level.

The generic executor should be specified with explicit chunk sizing, progress
and idempotency fields, authorization path, warning classification, server-side
scope materialization and terminal cleanup before implementation.

### Official references

- [Transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Cloud Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore transaction contention and commit ordering](https://firebase.google.com/docs/firestore/transaction-data-contention)
- [Firestore Security Rules conditions and server-client bypass](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firestore managed bulk delete](https://firebase.google.com/docs/firestore/manage-data/bulk-delete)
- [Cloud Functions task queues](https://firebase.google.com/docs/functions/task-functions)
- [Cloud Functions retries and at-least-once delivery](https://firebase.google.com/docs/functions/retries)

## Source documents

- [`PARAMETER_CONFIGURABILITY_PLAN.md`](PARAMETER_CONFIGURABILITY_PLAN.md)
- [`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md)
- [`../DOMAIN_RULES.md`](../DOMAIN_RULES.md)
