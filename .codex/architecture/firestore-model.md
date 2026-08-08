# Firestore Persistence Conventions

Firestore is an infrastructure adapter. This document does not define
collections, document nesting, indexes, Security Rules or a final schema. Those
are consequences of accepted use cases, aggregate boundaries and query needs.

## Conventions to apply when a persistence contract exists

- Use consistent lower camelCase field names and opaque, stable identifiers.
- Persist instants as Firestore timestamps at the adapter boundary; map them to
  domain time representations before entering domain code.
- Omit an optional field when absence and `null` have the same meaning; use
  `null` only when an accepted contract needs an explicit known-empty state.
- Keep arrays bounded and suitable for whole-document replacement. Model
  unbounded or independently queried data through a contract chosen from the
  relevant use case, not by default nesting.
- Use maps for small, bounded attributes with a stable access pattern. Do not
  hide mutable entity collections in maps.
- Store references only when the domain relationship and query require them;
  every reference needs an ownership and deletion policy.
- Consider subcollections only after aggregate ownership, query locality,
  authorization and lifecycle are known. They are not a default hierarchy.
- Do not adopt soft delete by default. Decide retention, restore, audit and
  privacy requirements per domain concept. A hard delete requires an explicit
  authorization and recovery policy.
- Keep ownership and collaboration data explicit enough for authorization
  Rules; do not infer authority from route visibility or a client-side guard.
- Add a version or concurrency marker only when a validated operation needs it.
  Choose conflict behavior from the use case rather than a global convention.

## Boundary rules

- Firestore DTOs are validated and mapped at the adapter boundary.
- Domain models, aggregate hypotheses and business events do not import Firebase
  types or inherit Firestore collection shape.
- Indexes, Rules and query limits are reviewed alongside each accepted read or
  write path and tested in the Emulator Suite.

## Required inputs before schema design

1. Accepted use case and actor authorization.
2. Aggregate or consistency boundary and business invariants.
3. Read and write queries, volume assumptions and offline classification.
4. Retention, export, deletion and collaboration requirements.
5. Security Rules and emulator-test plan.

## Establish an Aquarium: minimum persistence contract

This accepted slice requires only the durable reconstruction of a private
Aquarium: its `AquariumId`, `AquariumName`, owning keeper identity, and the
attribution and time of its establishment. Each successful establishment gets a
new independent identity. `AquariumEstablished` is represented by that
immutable establishment evidence; no generic event store, Timeline projection
or future-domain collection is needed.

The implementation must create the new Aquarium with an opaque UUID v4 and
associate it with the authenticated keeper. No keeper-level uniqueness claim,
global name uniqueness or count-based reservation is required. The exact
collection and document paths may be chosen during implementation, but they
must support reconstruction and owner-scoped access.

Security Rules must make the root private by default, allow an authenticated
keeper to create and read each root they own, reject unauthenticated access and
prevent arbitrary ownership changes. A persistence schema version is not required for this first DTO
because there is no prior persisted shape to migrate; add one only with the
first compatibility need.

## Record an Observation: current persistence contract

The accepted observation slice persists each Observation as an independent
document in the top-level `observations` collection. Each document contains
only `aquariumId`, `ownerId`, `content` and the Firestore timestamp
`recordedAt`. The document identifier is the stable Observation identity.

The write is append-only for this slice: updates and deletes are denied. The
adapter does not load or mutate the Aquarium aggregate. Rules verify the
referenced Aquarium owner before allowing creation, and owner-scoped reads are
allowed for the persisted document. No index or historical query is introduced
until a future accepted read use case requires one.
