# Cross-cutting Policies

## Identity and identifiers

Aggregate identities generated internally by Veril are opaque, stable UUID v4
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
- Display using the user's timezone and locale.
- Whether Temporal becomes a dependency is pending; do not add it preemptively.

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
