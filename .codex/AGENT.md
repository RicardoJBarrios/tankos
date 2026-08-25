# Codex Project Entry Point

This is the operational entry point for TankOS. Use [`README.md`](README.md)
to select the smallest relevant documentation set; do not read `.codex` in
bulk.

## Project baseline

TankOS is an Nx Angular application for managing freshwater, saltwater,
brackish, planted, reef, shrimp, snail and mixed aquariums. `Aquarium` is the
central domain aggregate root; TankOS is the product, never an Aquarium.

Technical identifiers and documentation use English. Spanish is reserved for
user-facing application content.

## Non-negotiable rules

- Use pnpm and Nx workspace targets.
- Keep the domain independent of Angular, Firebase, AngularFire, Zod and NgRx.
- Keep the dependency direction `UI -> Signal Store -> application -> ports <- adapters`.
- Validate external data with Zod and map DTOs at the boundary.
- Keep transport DTOs, domain models and view models separate.
- Use `inject()`, standalone Angular APIs, Signals and typed forms for new code.
- Keep libraries independently owned, tagged and consumed through public APIs.
- Apply [`CODE_GUARDRAILS.md`](CODE_GUARDRAILS.md) to code, tests and library
  boundaries.
- Do not use production Firebase for local development or CI.
- Do not commit secrets, push from an agent or use `git reset --hard`.

## Read by task

1. Product/domain: [`VISION.md`](VISION.md), [`GLOSSARY.md`](GLOSSARY.md),
   [`DOMAIN_RULES.md`](DOMAIN_RULES.md), then the relevant product index and
   specification.
2. Implementation: [`DEFINITION_OF_READY.md`](DEFINITION_OF_READY.md),
   [`CODING.md`](CODING.md), the relevant architecture page and ADRs.
3. Tests: [`TESTING.md`](TESTING.md) and the applicable library `docs/`.
4. Technology or operations: [`STACK.md`](STACK.md), [`MCP.md`](MCP.md),
   [`architecture/`](architecture/) and [`operations/`](operations/).
5. Completion: [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) and
   [`WORKFLOW.md`](WORKFLOW.md).

## Design precedence

```text
Vision -> language -> use case -> aggregate hypothesis
-> domain model -> events -> technical architecture -> persistence -> code
```

ADRs record durable decisions. Specifications refine accepted use cases.
Product candidates and research do not authorize implementation by themselves.

## Working method

Before changing code, identify the relevant sources, affected boundaries,
risks and validation. Implement the smallest coherent slice, run focused
checks, review the diff and report remaining failures or decisions. Use
[`AUDITOR.md`](AUDITOR.md) when a change crosses architecture, persistence,
security or documentation boundaries.

## Retrieval and integrations

Start with local documentation and exact search. Use CodeGraph for structural
questions, Nx tooling for workspace questions, and Firebase or GitHub tooling
only for their external domains. See [`RETRIEVAL.md`](RETRIEVAL.md) and
[`MCP.md`](MCP.md).
