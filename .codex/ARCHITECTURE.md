# Architecture contract

## Composition

The application composition root is `apps/tankos`. Features may remain in the
app until a real boundary exists. Libraries are isolated by Nx tags and ESLint
Boundaries. `legacy/veril` is retained for reference and is outside Nx.

## Domain flow

Use Screaming Hexagonal Architecture:

```text
domain -> application ports <- infrastructure adapters
                           \-> UI/composition
```

Stores coordinate feature state; they do not become domain persistence. Guards
improve navigation UX, never authorization.

## Data and Firestore

- Firestore is NoSQL: no relational foreign keys or cascade assumptions.
- Store immutable/versioned contracts with explicit logical identifiers and
  snapshots where historical meaning requires them.
- Hide soft-deleted records by default; purge is an explicit administrative or
  controlled batch operation.
- Bound and paginate reads. Prefer domain-scoped local cache with an explicit
  invalidation/bypass path; avoid listeners unless the use case needs them.
- Keep indexes, Firebase configuration, Rules and deployment in the app layer;
  reusable libraries provide ports and adapters, not project deployment.

## Time, units and measurements

Time normalizes transport values to UTC and delegates localized display to the
Angular-facing edge. Units manage standards, symbols and conversions only.
Measurements own quantity, method, provenance and Aquarium/System context.

## Decision source

This compact contract is the entry point. Detailed Firestore/FinOps policy,
target architecture and discovery rationale are in
[`archive/architecture/`](archive/architecture/); applicable ADRs are in
[`adr/`](adr/).
