# Batch Operations — Final Specification

**Status:** final product and technical direction.

**Scope:** all batch or equivalent bulk operations in Veril, including bulk
modification, marking records for deletion, definitive deletion and future
operations of the same nature.

**Technical precedence:** when a product interpretation conflicts with a
technically required Firebase/Firestore practice for security, consistency,
service limits, reliability or data integrity, the technically correct
solution prevails. The deviation and its resulting behavior must be documented.

**Accepted architecture:** `BatchOperations` is a domain of its own. It uses a
reusable execution engine through ports/adapters. The domain owns lifecycle,
confirmation, frozen scope, authorization policy, resumability, warnings,
concurrency semantics and terminal cleanup. The reusable engine owns chunking,
progress, idempotency, retries and partial execution. Firebase/Firestore with
BulkWriter or parallel server writes is the initial execution adapter.

## 1. Core model

`BatchOperation` is Veril's logical asynchronous workflow. It is not the same
thing as a Firestore `WriteBatch`.

The logical operation has:

- a unique `batchId`;
- the affected entity/schema type;
- a frozen target set;
- operation metadata required by the operation type;
- processing state and progress;
- per-item or per-chunk warnings and execution results.

The temporary operation exists only while the batch is active. It is deleted
when the operation reaches its terminal state, including a terminal result with
partial failures. Batch-specific warnings and execution details are not copied
into the original domain records.

The original record model is not extended with batch-specific error or warning
fields such as `lastDeletionError`.

## 2. NoSQL persistence

Veril uses strict NoSQL persistence:

- no foreign keys;
- no referential cascades;
- no mandatory lookup to another document to interpret an existing record;
- historical snapshots are embedded where historical interpretation requires
  them;
- batch metadata belongs to `BatchOperation`, not to the affected business
  record.

The frozen target set is a logical set of record IDs. It must not be assumed to
fit in one Firestore array. Its physical representation uses bounded chunks or
an `items` subcollection when necessary.

```text
BatchOperation
  id
  affectedSchema
  recordIds              # logical target set
  frozenScope
  processingState
  operationMetadata
  warnings
  items                  # optional physical item/chunk representation
```

Temporary `BatchOperation` data is an explicit exception to the ordinary
persisted-record `schemaVersion` rule. It is operational and short-lived.

## 3. Selecting and confirming a batch

The management view supports:

- entity-type separation or one combined inbox;
- state filters;
- composable logical filters over applicable fields;
- cursor-based pagination;
- selection of all records matching the filter, not only the current page.

Before confirmation, the operator sees the complete operation scope, including
the number of matching records and the selected record list. For very large
sets, the physical rendering may be paginated or chunked, but the confirmation
must make clear that the operation covers the complete matching set.

At confirmation time, the server evaluates the final filter and freezes the
exact target set. Later changes to records, pages or filter values do not alter
that operation's scope.

Every equivalent bulk operation follows the same confirmation pattern:

- one confirmation for the whole batch;
- no confirmation per element;
- independent processing per element or chunk;
- partial failures do not cancel the remaining work;
- the result reports successes, warnings and failures.

Bulk modifications require confirmation of scope and selected set, but do not
require a before/after preview of business values.

## 4. Execution lifecycle

The lifecycle is:

```text
draft/selection
  -> confirmed and frozen
  -> in progress
  -> interrupted/resumable
  -> terminal result
  -> temporary BatchOperation deleted
```

Execution is asynchronous. The originating management screen does not wait for
completion. A single management screen may own multiple concurrent operations,
each with independent scope, progress and resumption.

If the application closes or connectivity is lost, the temporary operation
preserves its frozen scope and progress and can be resumed manually from the
management screen that created it. A global batch dashboard is not required.

Real-time progress is optional. Correctness, resumability and final reporting
must work without a live progress view.

The operation entity is deleted after completion. No permanent batch audit log
is retained. The operational result is available while the operation exists;
durable state remains only where the normal affected-record lifecycle requires
it.

## 5. Firebase/Firestore execution boundary

The browser must not execute an unbounded administrative bulk write.

The client requests the operation after administrator confirmation. A trusted
server-side worker executes it using the Firebase Admin/server Firestore client
through a callable, HTTP endpoint or later task-queue function.

The worker must:

- authenticate the caller and verify administrator authorization;
- materialize the frozen target set server-side;
- process bounded chunks;
- persist progress and warnings at chunk/item granularity;
- be idempotent so an interrupted or retried chunk is safe;
- classify expected terminal-state outcomes as warnings;
- delete the temporary operation only after terminal completion.

Firestore `WriteBatch` is atomic: all writes succeed or none are applied. It
therefore cannot represent the whole logical batch because Veril requires
partial failures. It may be used only for bounded atomic execution units.

For larger work, use a server client with BulkWriter or parallelized individual
writes. Chunk sizing must account for request size, index work, contention and
Security Rules limits. The same logical operation can therefore contain many
Firestore execution units.

Server client libraries bypass Firestore Security Rules. The server entry point
must enforce administrator authorization and IAM; Rules continue protecting
ordinary client access to the data model.

Firestore's managed bulk-delete service is not the executor for this product
contract. It does not provide Veril's frozen ID set, per-record warnings,
contextual authorization and custom resumable workflow. It may be used only as
a separately reviewed infrastructure cleanup tool.

## 6. Concurrency and terminal deletion

There is no application-level locking or special conflict-management subsystem.
The global policy is natural server application order:

- competing modifications use last-applied-wins semantics;
- timestamps and ordering come from the server, never client clocks;
- a deletion is terminal;
- a later modification must use an existence-preserving update, not a merge-set
  that could recreate the document;
- if a modification reaches an already deleted document, it does not recreate
  or modify it and returns a warning/not-found outcome;
- if modification and deletion compete while the document exists, the final
  Firestore application/commit order determines the result, with deletion
  remaining terminal once applied.

This is the natural Firestore behavior adapted to Veril's terminal-deletion
rule. No global ordering guarantee is assumed for parallel BulkWriter writes.

When a batch resumes, it does not perform a separate application-level
precondition revalidation of every record before attempting the operation. The
write operation itself must still use the correct Firestore primitive so that a
deleted target cannot be recreated accidentally.

## 7. Modifications

Bulk modifications:

- apply directly to the frozen target set;
- do not preserve previous business values;
- retain only the resulting business state and normal lifecycle metadata;
- update each affected record's `updatedAt` and administrator identity inside
  the same execution unit;
- do not add batch-specific fields to the original record;
- report warnings and failures through the temporary `BatchOperation`.

## 8. Deletion lifecycle

### Marking for deletion

Marking a record:

- makes it invisible to ordinary users and functional flows;
- keeps it inspectable by administrators;
- updates its server `updatedAt`;
- records the administrator identity in normal lifecycle metadata.

Individual marking requires explicit confirmation. Batch marking requires one
confirmation for the complete frozen set. Partial failures continue processing
and are reported by the temporary operation.

### Restoration

An administrator may restore a physically existing marked record without an
additional confirmation. Restoration:

- clears the deletion state;
- returns the record to ordinary visibility and flows;
- updates `updatedAt` with a server timestamp;
- records the administrator identity;
- does not change business content.

### Definitive deletion

Individual physical deletion requires explicit confirmation. Batch physical
deletion requires one confirmation for the complete set.

Physical deletion is immediate and irreversible through the application. If a
deletion fails, the record remains marked and retryable; the failure is reported
as a warning or execution result in the active `BatchOperation`, not persisted
as batch-specific metadata on the original record.

## 9. Time and lifecycle metadata

All lifecycle timestamps are server-generated:

- `createdAt`;
- `updatedAt`;
- deletion and restoration timestamps;
- operation and progress timestamps.

Measurement event time is separate: `recordedAt` is server time, while
`measuredAt`/`observedAt` preserves the declared observation instant and is
normalized to UTC.

## 10. Future automation

Manual execution is the initial mode. Later automation may use Cloud Tasks or
task-queue Functions for asynchronous execution, rate limiting and retries.
Such workers must remain idempotent because asynchronous Firebase processing is
at-least-once. Scheduling is a later capability and does not change the
logical `BatchOperation` contract.

## 11. Acceptance criteria

The batch engine is acceptable only when it demonstrates:

- server-side administrator authorization;
- frozen server-materialized scope;
- cursor-safe selection independent of visible page;
- bounded Firestore execution units;
- partial success and warning reporting;
- resumability after interruption;
- idempotent repeated execution;
- no recreation after terminal deletion;
- last-applied-wins for competing modifications;
- server timestamps;
- no batch-specific fields added to original records;
- cleanup of the temporary operation after terminal completion;
- emulator/browser tests for authorization, pagination, concurrency, retries,
  partial failures and terminal deletion.

## Official Firebase references

- [Transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Cloud Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
- [Transaction contention and commit ordering](https://firebase.google.com/docs/firestore/transaction-data-contention)
- [Security Rules and server-client bypass](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Managed bulk delete](https://firebase.google.com/docs/firestore/manage-data/bulk-delete)
- [Cloud Functions task queues](https://firebase.google.com/docs/functions/task-functions)
- [Cloud Functions retries](https://firebase.google.com/docs/functions/retries)
