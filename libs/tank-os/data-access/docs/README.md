# TankOS Data Access

**Status:** shared CRUD and batch contracts, composable application facades and
Angular port composition are implemented. Firestore, JSON/HTTP, cache and
concrete batch execution adapters remain pending.

This library contains the provider-independent behavior shared by domains such
as Units, Parameters and Aquarium Systems. It is not an entity domain and does
not define business fields for those domains.

## Boundaries

```text
domain-specific application
          |
          v
   DataAccess contracts
          |
          v
   repository/batch ports
          |
          v
 Firestore | JSON/HTTP | memory
```

The library is organized into four boundaries:

- `core`: record envelopes, lifecycle states, pagination, batch contracts and
  ports; it has no Angular or provider dependency;
- `application`: composable CRUD and batch use-case facades that delegate to
  ports;
- `adapters`: provider-specific implementations, added without changing core
  contracts;
- `composition/angular`: injection tokens and providers that connect an
  adapter to an Angular application.

The public machine contract remains typed and provider-neutral. Firestore DTOs,
HTTP payloads and Angular services must not leak into `core` or into a domain
aggregate.

## CRUD contract

`CrudRepositoryPort` exposes list, get, create, replacement, logical deletion,
restoration and definitive deletion. A domain supplies its data, create,
update and filter types:

```ts
const service = createCrudService<UnitData, CreateUnit, UpdateUnit, UnitFilter>(unitRepository);
```

The shared layer does not invent entity validation, authorization, indexes or
business transitions. Those remain in the consuming domain and repository
adapter. The `CrudRecord` envelope provides only the stable id, lifecycle
projection and version number needed by shared operations.

The persistence model is strict NoSQL: records reference related data by
identifiers and no foreign keys or database cascades are introduced.

## Batch contract

`BatchOperationPort` submits a frozen logical scope and returns a progress
projection immediately. Execution is asynchronous and observed separately:

```text
submit(scope) -> queued progress
                         |
                         v
                    worker/chunks
                         |
                         v
                    get(batchId)
```

The first shared operation vocabulary is `update`, `mark-for-deletion` and
`delete`. The entity domain decides whether an operation is authorized and
whether definitive deletion is allowed. The batch layer owns scope identity,
progress, warnings and failures; it does not mutate the original entity schema
to store execution metadata.

The future Firestore adapter must apply the agreed global rules: one user
confirmation per batch, complete-filter scope rather than only the visible
page, bounded chunks, asynchronous processing, natural last-write-wins
ordering, and no FK cascades.

## Angular composition

Angular is an outer composition boundary. A host supplies concrete ports:

```ts
provideTankOsDataAccess({
  crudRepository,
  batchOperation,
});
```

The library exposes injection tokens but does not choose Firestore, AngularFire,
HTTP clients, cache implementations or Firebase functions. Those choices are
made by adapters and the hosting application.

## Planned adapters

Implementation order:

1. in-memory adapters for deterministic application tests;
2. cache policy and TTL-aware decorator;
3. Firestore repository and batch adapters;
4. JSON/HTTP adapters;
5. Angular facades and management UI integration;
6. provider-specific integration tests and emulator coverage.

Every executable source file requires a focused paired test. Public entry
points also require contract tests. Library coverage remains 100% for lines,
statements, functions and branches.
