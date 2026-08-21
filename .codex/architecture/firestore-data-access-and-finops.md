# Firestore Data Access and FinOps Policy

**Status:** global technical policy.

**Scope:** every Veril domain and every Firebase/Firestore adapter, including
Angular client access, trusted server commands, persistence, batch execution,
security rules, indexes, retention and operational cost control.

This policy complements the domain-specific persistence contracts. A concrete
use case may choose a different behavior only when its contract documents the
reason, authorization, consistency, query and cost consequences.

## 1. Architectural boundary

Firestore is an infrastructure adapter, not a domain model. Domain contracts
must not import Firebase types, collection paths or Firestore DTOs.

```text
Angular presentation
  -> application query/command use case
  -> port
  -> Firestore adapter or trusted command worker
  -> DTO validation and mapping
  -> Firestore
```

The persistence adapter owns:

- Firestore DTO schemas;
- timestamps and provider types;
- collection paths and document mapping;
- queries, cursors and index requirements;
- retry translation and provider errors;
- provider-emulator integration contracts and tests; Firebase initialization,
  Security Rules, IAM and indexes remain host/application configuration;
- operation and cost metrics.

The application layer owns authorization intent, use-case orchestration and
domain invariants. Components must not construct queries or write Firestore
directly.

## 2. Access patterns

Every access is a named use case. Generic unbounded repositories are forbidden.
The following shape is not a permitted public abstraction:

```ts
findAll(): Promise<unknown[]>;
find(filters: Record<string, unknown>): Promise<unknown[]>;
update(id: string, data: unknown): Promise<void>;
delete(id: string): Promise<void>;
```

Instead, each port declares bounded operations with typed filters, limits,
cursors, ordering and authorization context:

```text
ListActiveUnits
GetUnitByCode
CreateCustomUnit
EditCustomUnit
MarkUnitsForDeletion
```

Every query contract must define:

- allowed filters;
- maximum page size;
- stable ordering and tie-breaker;
- opaque cursor format;
- empty-result behavior;
- authorization scope;
- expected volume and cost;
- required indexes;
- whether stale reads are acceptable.

User-controlled input must never become an arbitrary Firestore query. Unknown
filters, unbounded limits and provider-specific operators are rejected at the
application boundary.

### Direct client access

The Angular client may use the Firebase client SDK for bounded reads and simple
user-scoped writes when all of the following are true:

- Firebase Authentication identifies the caller;
- Security Rules can express the authorization and validation;
- the operation does not require an invariant across several documents;
- the query has a bounded result and a known cost;
- the offline behavior is acceptable for that use case.

### Trusted commands

Administrative operations, batches, cross-document invariants, terminal
deletion and sensitive lifecycle changes use a trusted server command boundary.
The server authenticates the caller, verifies authorization, validates the
command and chooses the Firestore primitive.

Server client libraries bypass Firestore Security Rules and use IAM instead.
Consequently, a server endpoint must not assume that Rules validate its input;
it must enforce the complete command contract itself.

## 3. Query policy

All collection queries must:

- use `limit` with a capability-specific maximum;
- use cursor pagination, never `offset`;
- use a deterministic order with a final document-ID tie-breaker;
- read only the page required by the current use case;
- apply filters compatible with Security Rules;
- avoid repeated queries caused by rendering or effects;
- have a reviewed index plan.

Point reads are preferred when the stable document ID is known. Aggregation
queries such as `count()` are not free and are not a substitute for a cached
counter at large scale. Repeated counts during filtering or rendering are
forbidden unless the use case documents their bounded cost.

The batch-specific exception is scope freezing: the worker may read the full
matching set once to materialize the authoritative target IDs. It must then
reuse that frozen set rather than re-running the broad query for each chunk.
See [`BATCH_OPERATIONS_FINAL_SPEC.md`](../product/BATCH_OPERATIONS_FINAL_SPEC.md).

Security Rules are not filters. A query is allowed only when its potential
result set satisfies the rule; Rules do not remove unauthorized documents from
an otherwise broad query. The adapter can test its contract against an
emulator, but the application/server host owns the deployed Rules, IAM,
indexes and Firebase connection configuration.

The Admin SDK is a trusted server path and bypasses Firestore Security Rules.
Administrative batches therefore require both an authoritative server-side
claims check and a least-privilege IAM/service-account boundary. Client Rules
and emulator tests protect the browser path but cannot replace those controls.

Asynchronous batches add a second cost and reliability boundary: the submitted
selection is materialized once into bounded chunks, workers claim summaries with
an expiring lease, and each worker invocation applies a maximum chunk count.
Expired leases allow recovery after a crashed worker. Failed summaries are kept
for explicit retry; successful or warning-only detail may be removed in bounded
provider operations while idempotency reservations are retained. This prevents
stuck work, duplicate execution and unbounded reads without adding a global
batch dashboard to every host application.

## 4. Write and consistency policy

Choose the smallest primitive that satisfies the invariant:

| Primitive | Use when | Global restriction |
| --- | --- | --- |
| Single write | One independent document | Must be idempotent when retried |
| Transaction | Current state must be read before writing | Callback may run repeatedly and must have no external side effects |
| Write batch | Known writes need bounded atomicity | Each operation is still billed independently |
| BulkWriter/parallel server writes | Large independent workload | Must be chunked, rate-controlled and resumable |
| Logical batch | Asynchronous multi-chunk workflow | Not equivalent to a Firestore `WriteBatch` |

Transactions are required for read-modify-write version replacement and other
cross-document invariants. They must not contain email delivery, event
publication, logging with external effects or non-repeatable random behavior.

All retryable commands must be idempotent. A timeout after a successful write
must not cause duplicate business records or accidental recreation of a
terminally deleted record.

Last-write-wins is not a universal conflict strategy. It is allowed only when
the domain contract says that losing a concurrent change is harmless. Otherwise
the operation needs a transaction or explicit precondition. This does not
require a user-facing conflict-management subsystem.

Technical persistence timestamps are normalized instants produced by the
adapter's injected clock and are not business facts. Client timestamps never
decide command ordering, revision precedence or deletion precedence; those are
controlled by the command contract and provider transaction semantics.

## 5. NoSQL and denormalization

Veril uses strict NoSQL persistence:

- no foreign keys;
- no database cascades;
- no implicit joins;
- no mandatory lookup merely to interpret a stored record;
- no unbounded arrays or maps;
- no mutable entity collections hidden inside maps.

## 6. Versionable contracts

Any published or used contract whose meaning, validation, representation,
conversion, authorization or lifecycle can change is versioned as an immutable
business definition. This applies to units, parameter definitions, methods,
conversion functions, catalogue entries and any future equivalent contract.

The rule distinguishes two kinds of version:

- `schemaVersion`: the technical shape of a persisted document;
- `versionId`/`version`: the immutable business meaning exposed to consumers.

Neither version may be changed in place after publication or use. An edit
creates a complete new version with a new immutable identity. The previous
version remains resolvable for existing references and moves through its
lifecycle independently:

```text
draft -> published -> deprecated -> retired
```

Only published versions are available to all normal consumers. New selections,
records or configurations use the current active version. Existing records
continue to use the exact version they originally selected.

Contracts that can affect historical interpretation must embed enough meaning
to remain interpretable without a live lookup, normally an immutable identity,
version and bounded snapshot. This is denormalized historical evidence, not a
foreign key.

The normal application operation for a published or used version is retire or
deprecate, not physical deletion. Physical deletion is reserved for drafts or
versions proven never to have been published or used, and requires the global
deletion authorization and batch rules. A domain may retain all published
versions permanently when historical interpretation is part of its purpose.

Authorization is domain-specific but must distinguish proposal, publication,
administration and physical deletion. Public visibility does not grant edit or
delete authority. Version creation replaces mutation; it does not require a
global conflict-management subsystem.

Denormalization is allowed when it serves a named read model. Its contract must
state:

- source of truth;
- copied fields and snapshot meaning;
- update mechanism;
- acceptable staleness;
- rebuild and recovery strategy;
- additional read/write/storage cost.

## 7. Security Rules

Security Rules are part of each collection's persistence schema. They must be
written and tested with the document contract, not added as a final release
step.

Rules must cover:

- authentication and ownership;
- role or administrative capability where applicable;
- allowed fields and value types;
- immutable fields;
- lifecycle visibility;
- legal state transitions;
- query limits and ordering where needed;
- protection against arbitrary ownership changes.

Rules using `get()`, `exists()` or `getAfter()` must account for both their
access-call limits and their additional billed reads. Cross-document rules are
kept narrow; complex authorization belongs in a trusted command boundary.

Production rules deny access by default. Development uses the Emulator Suite,
not open production rules.

## 8. Indexes and document shape

The index configuration is versioned with the application. Each new query must
identify its required index and test it in the emulator.

The default review must consider exemptions for:

- large strings that are never queried;
- large arrays and maps;
- diagnostic payloads and error details;
- manifests and progress metadata;
- sequential timestamp fields that are not queried;
- TTL fields when indexing them would create unnecessary fanout.

Document IDs must be opaque and non-sequential. High-rate writes or deletes
must not concentrate on a narrow lexicographical range or a single shared
counter document. Automatic IDs are preferred when the application does not
own a domain identity.

## 9. Listeners and offline behavior

Realtime listeners are opt-in. They are appropriate for small, genuinely live
surfaces such as an active operation status. They are not the default for
catalogues, histories or large administrative lists.

The UI must unsubscribe when a view is destroyed and must not create duplicate
listeners through repeated effects or navigation. Listener reconnect behavior,
offline persistence and stale-cache rendering belong to the use-case contract.

Optimistic offline writes are allowed only when duplicate or delayed
application is safe. Security-sensitive lifecycle operations and strict
read-modify-write invariants require connectivity or a trusted server command.

## 10. Local cache and TTL

Local caching is the default optimization for reads whenever the use case can
tolerate data that is not guaranteed to be current at the instant of display.
The application must check the local cache before issuing a network read and
must reuse an existing cache entry instead of creating duplicate requests from
multiple components.

Every local cache entry has an explicit TTL. No cache may live indefinitely
because it happens to be stored in a signal, service, IndexedDB store, browser
cache or Firestore offline persistence.

A cache contract must define:

- cache key, including user and active Aquarium scope;
- value schema and version;
- created and last-validated time;
- TTL and maximum stale age;
- whether stale-while-revalidate is allowed;
- invalidation events;
- behavior after authentication, authorization or Aquarium-context changes;
- privacy classification and whether persistent local storage is allowed;
- fallback behavior when the network is unavailable.

Use cases may expose an explicit one-shot cache directive without coupling the
application to a provider:

```ts
type CacheReadMode = 'cache-first' | 'network-only' | 'refresh';
```

- `cache-first` is the default and uses a valid local entry;
- `network-only` bypasses the local entry for this read and does not delete it
  unless the fresh response succeeds;
- `refresh` performs a network read and replaces the local entry on success.

This directive is an explicit user or application intent for one operation. It
must not silently disable caching for the rest of the session, and it must
remain subject to authorization, connectivity and the use case's freshness
policy.

TankOS implements this contract with `CacheScope` and `CachedCrudRepository`.
The scope contains the domain and may contain the entity, authenticated
principal and Aquarium identifiers. Those segments form the namespace, so a
mutation can invalidate one domain/context without flushing unrelated domains.
`createCacheInvalidation(cache)` exposes the same scoped operation to application
services, plus an explicit `clearAll()` for sign-out, schema migration or
recovery. Identical concurrent reads share one in-flight backing request.

The default read sequence is:

```text
valid local cache
  -> return immediately
  -> revalidate when policy requires

expired cache with stale-while-revalidate allowed
  -> return visibly stale value
  -> refresh in background

missing or non-cacheable value
  -> bounded network read
  -> validate, persist and return
```

Cache rules:

- cached data is never the source of truth;
- a successful mutation invalidates or updates the affected cache entries;
- switching user, permission scope or Aquarium invalidates incompatible data
  before the new context is rendered;
- revoked access must not be served from a previous cache entry;
- strict-current, security-sensitive and terminal-lifecycle reads may bypass
  cache or require online revalidation;
- cache errors must degrade to a bounded network request, not a second local
  database or an unbounded retry loop;
- cached, stale, pending and error states remain distinguishable in the UI;
- cached documents must be validated against the current DTO schema before
  entering application state.
- a successful `create`, `edit`, `restore` or catalogue publication invalidates
  or refreshes every affected cache scope before subsequent reads;
- a failed mutation must not invalidate a still-valid cache entry unless the
  failure response proves that the cached value is no longer authoritative.

Firestore offline persistence may provide the underlying local cache through the
optional `createFirestoreLocalCache` adapter. Its default is in-memory; single-
tab and multi-tab persistence are explicit host choices and require trusted-
device consent for private data. The use case still owns freshness, privacy and
invalidation semantics. Firebase's local cache does not replace the scoped
TankOS cache contract, and the Angular Service Worker is intentionally limited
to static assets rather than private Firestore/API responses.

This local-cache TTL policy is separate from Firestore server-side TTL. Local
TTL controls freshness and privacy in the client; Firestore TTL controls
eventual deletion of technical documents and remains subject to the retention
rules below.

## 11. Lifecycle, deletion and retention

Business deletion follows the global lifecycle and batch specification. A
physical deletion is not replaced with TTL.

TTL is reserved for technical data whose delayed deletion is acceptable, such
as abandoned temporary infrastructure records or bounded recovery data. TTL
deletes are billable, are not immediate, do not delete subcollections and must
not be used where deletion order or transactionality matters.

Temporary batch documents are explicitly deleted after terminal completion.
TTL may be a separately reviewed safety net for abandoned operations, with
appropriate index exemptions and monitoring.

## 12. FinOps policy

Cost is part of every persistence contract. The review must account for:

- document reads, writes and deletes;
- index-entry reads and index storage;
- listener updates and reconnects;
- document and subcollection storage;
- network egress;
- server worker invocations and execution;
- retries and partial failures.

Firestore batches do not make individual operations free: each document
operation remains billable. Progress must therefore be aggregated by chunk,
not written once per entity by default.

Each domain operation declares:

- maximum page size;
- maximum batch scope;
- maximum concurrent workers;
- retry limit;
- expected operation count;
- whether listeners are allowed;
- estimated cost class;
- behavior when the limit is exceeded.

The application must reject or require an explicit administrator decision for
an operation above its configured scope. It must never start an unbounded
filter operation silently.

## 13. Environments, budgets and monitoring

Development, staging and production use separate Firebase projects. Emulator
tests must not require production credentials or data.

Production requires:

- Cloud Billing budget and usage alerts;
- anomaly monitoring;
- Firestore read/write/delete and listener dashboards;
- latency and error-rate dashboards;
- Security Rules denied-request monitoring;
- batch chunk, retry and failure metrics;
- an application-level administrative pause for expensive operations.

Budget alerts are not a hard spending cap. They notify or trigger automation;
the application and worker limits remain necessary to prevent runaway usage.

Operational metrics are not business data. They should go to Cloud Monitoring,
structured logs or another operational system rather than being copied into
every domain record.

## 14. Required adapter tests

Every Firestore adapter must test, at minimum:

- valid and invalid Security Rules access;
- unauthorized queries and query-shape rejection;
- page limits, stable ordering and cursor continuation;
- empty results and minimum-cost query behavior;
- DTO validation and malformed documents;
- idempotent retry after timeout;
- transaction retry and repeated callback execution;
- concurrent modification and deletion;
- inability to recreate terminally deleted records;
- batch chunking, resume and partial failure;
- listener creation, update and teardown where listeners are supported;
- representative query cost and index behavior.

Use the Firestore Emulator Suite and `@firebase/rules-unit-testing` for Rules.
Use representative data volumes for performance tests; a passing emulator test
does not prove production cost or capacity.

## 15. Exception process

A domain may deviate from this policy only in its persistence contract. The
deviation must name:

1. the use case and actor;
2. the consistency requirement;
3. the security model;
4. the query and index plan;
5. the expected read/write/delete volume;
6. the retention and deletion behavior;
7. the tests and monitoring that make the deviation safe.

No exception may introduce an unbounded query, open production access, hidden
provider types in the domain, or a non-idempotent trusted worker.
