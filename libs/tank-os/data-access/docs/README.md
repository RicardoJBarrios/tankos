# Data Access: current architecture

`@tank-os/data-access` is a provider-independent Angular library. It defines
CRUD, lifecycle, pagination, caching and asynchronous batch contracts for
TankOS domains such as Units, Parameters and Aquarium Systems. It does not
define business entities and does not depend on Firebase, Zod, HTTP or a
server runtime.

## Physical package boundaries

The runtime adapters are separate publishable Nx libraries:

| Package                          | Responsibility                                                                  | Runtime dependencies        |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------- |
| `@tank-os/data-access`           | Core ports, application services, memory/cache adapters and Angular composition | Angular, `@tank-os/time`    |
| `@tank-os/data-access-firestore` | Firestore CRUD persistence and DTO validation                                   | Firebase, Zod, core package |
| `@tank-os/data-access-json-http` | JSON/HTTP CRUD transport and response validation                                | Zod, core package           |
| `@tank-os/data-access-server`    | Trusted Firebase Admin batch authorization                                      | Core package                |

Each package has its own `src`, public `index.ts`, tests, documentation,
`ng-packagr-lite` build and coverage target. Adapter source is never reexported
from the primary package. This is physical isolation, not merely a semantic
independent package boundary.

Adapters depend on the primary public contract through `@tank-os/data-access`.
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
- `adapters/cache` provides TTL reads, force-refresh and namespace invalidation.
- `composition/angular` connects ports through Angular `inject()` factories.

## CRUD and lifecycle

`CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>` supports list, get,
create, replace, mark-for-deletion, restore and permanent delete. Records carry
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

## Batches

Submitting a batch freezes either its ids or its complete filter, stores the
request fingerprint and returns `queued` immediately. A trusted worker processes
bounded chunks and publishes progress, warnings and item-level results. The
batch state is separate from the affected records and can be removed after a
terminal state.

The contract supports update, mark-for-deletion and permanent delete. There is
one confirmation per batch; a filter applies to the whole matching set, not
only the visible page. Execution is asynchronous and naturally ordered by
last-write arrival: deletion wins when it arrives after a modification, while
the last modification wins against another modification. Reusing an
idempotency key with a different request is a conflict.

`BatchWorkerPort` and `BatchAuthorizationPort` are integration contracts. The
production worker, durable batch repository, chunk scheduling, retries and
cleanup belong to the host. `@tank-os/data-access-server` provides the Firebase
Admin Auth authorization boundary; browser claims are never authoritative.

## Caching and cost control

`TtlCache` uses an injected clock. `CachedCrudRepository` applies read-through
TTL, `forceRefresh` and namespace invalidation after writes. Stable catalogs can
use long TTLs; user-triggered changes invalidate immediately. Query-specific
invalidation can be added by a host when its cost/complexity justifies it.

Firestore query construction remains entity-specific through
`buildQuery`. Hosts must define allowed filters, aquarium scopes, indexes,
limits and Security Rules. The adapter validates request shape and response
DTOs but does not replace authorization policy.

## Testing and publication

Every executable source file has a focused Given/When/Then test in the same
package boundary. Each package enforces 100% lines, statements, functions and
branches without coverage exclusions. Firestore has an additional emulator
target; Security Rules and IAM remain host-level integration concerns.

All packages use Nx `@nx/angular:ng-packagr-lite`. The public contracts are:

```ts
@tank-os/data-access
@tank-os/data-access-firestore
@tank-os/data-access-json-http
@tank-os/data-access-server
```
