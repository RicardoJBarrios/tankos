# ADR-0004: Gradual Nx modularity and boundaries

## Status

Accepted

## Context

The workspace must grow across aquarium-management domains without premature
project proliferation or uncontrolled dependencies. See the
[target architecture](../ARCHITECTURE.md).

## Decision

Keep `apps/tankos` as the composition root. Extract Nx libraries only when a real
feature, ownership boundary or reuse case exists. Organize libraries by domain
scope and by `feature`, `data-access`, `ui` or `util` type.

Enforce allowed dependencies with Nx tags and ESLint Boundaries. Domain UI
cannot import infrastructure. Domains depend on themselves and narrowly owned
shared-kernel capabilities; cross-domain presentation orchestration belongs
under `composition`, while concrete adapter wiring belongs to composition-root
providers grouped by consuming context. `legacy/veril` is outside Nx and these
active boundaries.

Application ports and InjectionTokens are owned by the context that consumes
them. A provider in the composition root may bind such a consumer-owned port to
an adapter from another context. This binding does not authorize a direct
context-to-context import in domain, application, infrastructure or UI code.

## Consequences

- The project can start small and acquire boundaries incrementally.
- Tagging projects and changing boundary constraints must be one coherent change.
- `shared` requires explicit ownership and cannot become a general dumping ground.
- Shells remain thin and cannot own domain UI, use cases or read models.
- Integration tests that intentionally exercise more than one adapter are an
  explicit `composition/integration-tests` layer, not production UI.

## Alternatives considered

- Create all predicted libraries now: rejected as ceremonial architecture.
- Keep all code in the application indefinitely: rejected because boundaries
  would remain unenforceable as the product grows.
- Allow unrestricted cross-domain imports: rejected.
