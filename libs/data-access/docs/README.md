# Data Access: current architecture

`@tankos/data-access` is a provider-independent Angular library. It defines
CRUD, lifecycle, pagination, caching and asynchronous batch contracts for
TankOS domains such as Units, Parameters and Aquarium Systems. It does not
define business entities and does not depend on Firebase, Zod, HTTP or a
server runtime.

## Physical package boundaries

The runtime adapters are separate publishable Nx libraries:

| Package                         | Responsibility                                                                  | Runtime dependencies        |
| ------------------------------- | ------------------------------------------------------------------------------- | --------------------------- |
| `@tankos/data-access`           | Core ports, application services, memory/cache adapters and Angular composition | Angular, `@tankos/time`     |
| `@tankos/data-access-firestore` | Firestore CRUD persistence and DTO validation                                   | Firebase, Zod, core package |
| `@tankos/data-access-json-http` | JSON/HTTP CRUD transport and response validation                                | Zod, core package           |

Each package has its own `src`, public `index.ts`, tests, documentation,
`ng-packagr-lite` build and coverage target. Adapter source is never reexported
from the primary package. This is physical isolation, not merely a semantic
independent package boundary.

Adapters depend on the primary public contract through `@tankos/data-access`.
The primary package never imports an adapter, so the dependency direction is
one-way and its bundle cannot acquire provider SDKs transitively.

## Layers in the primary package

```text
core ports and value types
          |
application CRUD and batch services
          |
memory and cache adapters
          |
Angular composition providers
```

- `core` is provider-neutral and contains errors, value types and ports.
- `application` exposes composable CRUD and batch use cases.
- `adapters/memory` is deterministic and suitable for tests and prototypes.
- `adapters/cache` provides TTL reads, explicit read modes, scoped invalidation
  and in-flight request deduplication.
- `composition/angular` connects ports through Angular `inject()` factories.

## CRUD and lifecycle

`CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>` supports list, get,
create, replace, mark-for-deletion, restore and permanent delete. Existing-record
commands require the last returned `revision`; omitting it is a validation
error. Records carry
an opaque id, lifecycle, revision and server metadata. Normal reads expose only
active/inactive records; hidden lifecycle values require an explicit request and
host authorization. No foreign keys or cascades are used: references are ids
and cross-entity consistency is coordinated by application workflows.

Pagination uses an opaque `PageCursor`, bounded `pageSize` and stable ordering.
Firestore asks for one extra record to calculate `hasMore` without empty pages.

## Versioning

`VersionedRepositoryPort` is provider-neutral. `revision` is technical
concurrency metadata; `versionId` and `versionNumber` identify immutable
business versions. A domain decides whether a versioned contract is needed.
`createVersionedCrudService()` provides the common replacement workflow for
those contracts: create the new record first, then mark the previous record for
deletion. A failure in the second step is exposed and leaves the new record for
explicit reconciliation; it is never silently rolled back by the generic
service.

## Batches

Submitting a batch persists either its ids or its complete filter, stores the
request fingerprint and returns `materializing` immediately. A materializer
resolves a filter to authoritative ids, writes bounded chunks and transitions
the operation to `queued`. A trusted worker processes bounded chunks with
bounded item concurrency and publishes progress, warnings and item-level results. The
batch state is separate from the affected records and can be removed after a
terminal state.

The contract supports update, mark-for-deletion and permanent delete. There is
one confirmation per batch; a filter applies to the whole matching set, not
only the visible page. The browser implementation uses `runForegroundBatch()`:
it commits sequential client-side chunks, reports progress, supports
cancellation and returns a checkpoint for retry or resume. Reusing an
idempotency key with a different request is a conflict where the host persists
that control state.

`BatchWorkerPort` and `BatchAuthorizationPort` are integration contracts. The
production worker and durable batch repository belong to the host. The memory
adapter already enforces logical chunk and item-concurrency limits, while a
production worker must preserve those limits and make retries idempotent.
The browser must treat Firebase Rules as the authorization boundary. It cannot
create custom claims, run a trusted worker or guarantee progress after the tab
closes. Those server-only capabilities are intentionally outside this
workspace.

The contracts distinguish two provider capabilities:

- `AtomicBatchPort` represents one finite all-or-nothing write command.
- `BatchSubmissionStorePort` represents durable submission/control state for a
  logical asynchronous batch;
  its chunks and item results are separate records, not unbounded arrays in the
  summary document.
- `BatchMaterializerStorePort` is the materialization capability. Its claim,
  summary and chunk writes require the current materialization fencing lease;
  it does not expose submission, worker execution or cleanup operations.
- `BatchWorkerStorePort` is the worker capability. Its summary, chunk and
  result writes require a matching fencing lease at the type boundary. It
  does not expose creation, materialization, removal or cancellation requests;
  those remain submission/control capabilities. Terminal deletion is a
  separate cleanup capability and is opt-in at the executor boundary.

Each capability also has its own summary-patch type: submission can change only
control status and timestamps, materialization can change selection totals and
its own lease, and workers can change execution counters and their own lease.
Worker chunk reads are exposed only by `BatchWorkerStorePort`. This prevents a
caller from expressing another capability's lease fields through a shared
patch type, even before the adapter applies runtime fencing.

The Firestore Admin adapter exposes separate submission, materializer and worker
capabilities backed by the same database. Technical time is supplied through
`@tankos/time`'s `ClockPort` (normally `TimeService`), not through a second
clock abstraction. Workers first pass a mandatory host authorization
gate using both the authenticated caller and the persisted submitting principal,
then claim an operation in a Firestore transaction. A lease identifies the worker and expires after a
bounded interval, allowing a later worker to reclaim a crashed execution. Every
worker write carries a fencing token; writes from an expired or reclaimed
worker are rejected instead of being allowed to overwrite the new owner.
Runnable chunks are read with a hard limit; the executor rejects an operation
that exceeds that limit instead of materializing an unbounded array. Failed
chunks remain retryable and failed terminal summaries are retained for an
explicit retry or inspection; successful and warning-only terminal summaries
may be removed while their idempotency reservation remains. Item handlers must
therefore be idempotent. The application still owns the scheduler,
authorization composition and operation-specific item executor. The Admin
package is deliberately a server-only dependency and must not be imported by
an Angular browser entry point.

Materialization has its own short-lived claim and fencing token, so concurrent
hosts do not resolve the same filter simultaneously and a reclaimed host cannot
publish stale chunks or transitions. The claim expires after a crash and
chunks are written idempotently before the operation is queued. Batch requests
are bounded by a serialized payload limit below the Firestore document limit.

Cancellation is cooperative. The application records a cancellation request;
the materializer and worker observe it and the worker performs the terminal
`cancelled` transition. A running worker is never silently treated as stopped
while it can still write progress.

## Caching and cost control

`TtlCache` uses an injected clock. `CachedCrudRepository` applies read-through
TTL and deduplicates identical concurrent reads. Stable catalogs can use long
TTLs; user-triggered changes invalidate immediately. Query-specific invalidation
can be added by a host when its cost/complexity justifies it.

The public read directive is deliberately explicit:

```ts
type CacheReadMode = 'cache-first' | 'network-only' | 'refresh';
```

`cache-first` is the default. `network-only` bypasses an existing entry for the
current read, while `refresh` also replaces the entry after a successful read.
Neither mode changes the policy for later reads.

Cache namespaces are created from a `CacheScope`:

```ts
{ version: 'v1', domain: 'units', principalId: 'keeper-1', aquariumId: 'tank-1' }
```

The version is part of the namespace and must be incremented when the cached
representation changes incompatibly.

The scope is part of the cache key and prevents data from different users or
aquariums sharing entries. `createCacheInvalidation(cache)` exposes
`clear(scope)` and `clearAll()`; normal application flows should clear the
narrowest affected scope. `clearAll()` is reserved for sign-out, storage
corruption recovery, schema migrations or an explicit administrative action.

The current TTL cache does not implement stale-while-revalidate: an expired
entry is treated as a miss and the repository performs one bounded backing
read. Cache state is never authoritative and mutations invalidate the complete
repository namespace after the backing operation succeeds.

Firestore query construction remains entity-specific through
`buildQuery`. Hosts must define allowed filters, aquarium scopes, indexes,
limits and Security Rules. The adapter validates request shape and response
DTOs but does not replace authorization policy.

## Testing and publication

Every executable source file has a focused Given/When/Then test in the same
package boundary. Each package enforces 100% lines, statements, functions and
branches without a manual exclusion list. Declaration-only contracts naturally
have no runtime statements; their guarantees are checked through public-entry,
consumer and implementation contract tests. Firestore has an additional
emulator target with authenticated and unauthenticated Rules checks; IAM and
production service-account policy remain host-level concerns.

All packages use Nx `@nx/angular:ng-packagr-lite`. The public contracts are:

```ts
@tankos/data-access
@tankos/data-access-firestore
@tankos/data-access-json-http
```
