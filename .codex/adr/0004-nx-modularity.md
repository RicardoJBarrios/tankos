# ADR-0004: Gradual Nx modularity and boundaries

## Status

Accepted

## Context

The workspace must grow across aquarium-management domains without premature
project proliferation or uncontrolled dependencies. See the
[target architecture](../architecture/target-architecture.md).

## Decision

Keep `apps/veril` as the composition root. Extract Nx libraries only when a real
feature, ownership boundary or reuse case exists. Organize libraries by domain
scope and by `feature`, `data-access`, `ui` or `util` type.

Enforce allowed dependencies with Nx tags and ESLint module boundaries. Domains
depend on themselves and narrowly owned shared capabilities; cross-domain
orchestration belongs in the application or an explicit public contract.

## Consequences

- The project can start small and acquire boundaries incrementally.
- Tagging projects and replacing legacy constraints must be one coherent change.
- `shared` requires explicit ownership and cannot become a general dumping ground.

## Alternatives considered

- Create all predicted libraries now: rejected as ceremonial architecture.
- Keep all code in the application indefinitely: rejected because boundaries
  would remain unenforceable as the product grows.
- Allow unrestricted cross-domain imports: rejected.
