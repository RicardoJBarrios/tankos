# Cross-cutting Policies

## Identity and identifiers

Aggregate identities generated internally by TankOS are opaque, stable UUID v4
strings. The application generates them locally with the platform
`crypto.randomUUID()` capability before constructing the aggregate; the domain
receives its explicit branded identity type and never a Firebase identifier
type. The Firestore adapter persists the same string as its document identifier,
but Firestore does not generate or own domain identity.

This satisfies offline-safe generation without network access and avoids a new
dependency. UUIDv7 and ULID are rejected for the first slice because their time
ordering has no current query or synchronization benefit; Firestore auto-IDs and
other infrastructure-generated IDs are rejected because they make identity
creation depend on the adapter. Slugs remain presentation identifiers and must
not replace stable IDs. The creation source must be replaceable in tests without
making the domain depend on browser APIs.

## Time

- Persist instants in UTC.
- Use Firestore Timestamp at the persistence boundary where Firebase is the
  selected transport.
- Convert to domain time types through a mapper; do not leak Firebase Timestamp
  into domain code.
- Display user-visible timestamps that describe an Aquarium, its evidence or
  its Care using the Aquarium's authoritative IANA time zone and the
  application's Spanish locale. A legacy Aquarium without `timeZone` is an
  explicit compatibility exception: its UI may use the browser time zone
  until the Aquarium timezone is established, but must not present that value
  as Aquarium-local.
- The accepted presentation scope is specified in
  [`@tankos/aquarium`](../../../libs/aquarium/docs/README.md).
- For calendar commitments such as recurring Care, calculate from the
  Aquarium's authoritative IANA time zone. UI may localize language and show a
  user-local equivalent, but must keep the Aquarium schedule and its zone
  visible.
- Whether Temporal becomes a dependency is pending; do not add it preemptively.

## Local environmental context

An optional approximate Aquarium location may be configured once by its owner.
Direct Open-Meteo geocoding and forecast access remains behind infrastructure
ports; responses are validated at that boundary, cached in memory for fifteen
minutes and never persisted. Weather is contextual presentation, not domain
evidence, and its failure remains isolated from Aquarium-owned workflows.

## Permission vocabulary

No role catalogue is accepted. Establish authentication, authorization,
ownership and collaboration requirements from a concrete use case before naming
roles or invitation flows. Firebase Security Rules are authoritative; UI guards
are not.

## Synchronization

- Optimistic local UI is allowed only when the operation's offline class permits it.
- Historical, correction and append-only semantics are per-use-case decisions.
- Last-write-wins is acceptable only where losing a concurrent edit is harmless.
- Strict consistency requires online validation or a transaction.
- Merge is not a generic policy; each entity must define its own semantics.

Local caching is preferred for reads whenever freshness and privacy permit it.
Every cache entry has an explicit TTL, schema/version and invalidation policy;
cache is never the source of truth. User, permission or Aquarium-context changes
invalidate incompatible entries before rendering the new context. The complete
Firestore access, cache and FinOps policy is maintained in
[`@tankos/data-access-firestore`](../../../libs/data-access-firestore/docs/README.md).

## Performance goals pending validation

No numeric budget is accepted because no representative user journey has been
measured. Before setting a limit, measure the relevant journey and record its
user value, network/device assumptions, data volume, query/listener behavior,
asset weight and operational cost. Until then, avoid unbounded reads, scope live
listeners to their owner, paginate where a query needs it and do not optimize
without evidence.

## Design system principles

The project has a design-system policy, not a component library yet. The canonical
interaction, visual and accessibility direction is
[`UX_PHILOSOPHY.md`](../product/UX_PHILOSOPHY.md). Apply it with Material/CDK
before introducing a component or token system.

## Error model

Errors cross boundaries as explicit categories and are mapped to user-safe UI:

- `DomainError`: an invariant or business operation cannot be satisfied.
- `ValidationError`: external or user input fails schema or field validation.
- `InfrastructureError`: Firebase, storage, network or platform failure.
- `PermissionError`: the user lacks the required authorization.
- `OfflineError`: the operation requires connectivity or synchronization failed.
- `UnexpectedError`: an unclassified failure requiring diagnostics and safe fallback.

The domain must not depend on Firebase error classes. Error messages must not
leak secrets, internal paths or raw provider payloads.

## DTO and view-model flow

```text
External -> Zod schema -> DTO -> mapper -> Domain -> ViewModel -> UI
```

No DTO reaches the UI directly. Zod is the runtime boundary; domain models remain
independent of persistence and validation libraries where practical.

## Signals and RxJS

- `signal()`: local mutable state owned by a component or narrow service.
- `computed()`: synchronous derived state without side effects.
- `effect()`: integration side effect only; never use it to model ordinary data
  flow or create hidden persistence.
- `resource()`: use only when its async lifecycle fits the feature; decision is
  pending until a concrete Angular use case exists.
- Signal Store: shared/complex feature state with explicit ownership.
- RxJS: streams, cancellation, event composition and interop with external APIs.

Do not mix these as competing sources of truth.

## Angular-first HTTP and workspace state

All external HTTP in application and infrastructure runtime code uses Angular's
HTTP stack. `HttpClient` is the current adapter API for imperative provider
ports; `httpResource` remains available for a concrete reactive resource where
its lifecycle is a better fit. Native `fetch`, hand-written XHR and third-party
HTTP clients are forbidden. Angular HTTP preserves DI, interceptors and the
official testing backend while provider adapters continue to validate DTOs with
Zod.

Shared Aquarium operational state starts from the scoped
`AquariumDashboardStore`. It coordinates context/configuration state and
reload semantics without replacing application use cases or Active Context
persistence. Independent section-only presentation state may remain local when
there is no shared consumer. The operational surface is a Dashboard by
responsibility, not a generic widget platform.
