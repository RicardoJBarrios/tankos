# Codex Project Entry Point

This is the operational entry point for TankOS. Use [`README.md`](README.md)
and the compact contracts below; do not read `.codex` in bulk.

## Project baseline

TankOS is an Nx Angular application for managing freshwater, saltwater,
brackish, planted, reef, shrimp, snail and mixed aquariums. `Aquarium` is the
central domain aggregate root; TankOS is the product, never an Aquarium.

Technical identifiers and documentation use English. Spanish is reserved for
user-facing application content.

## Non-negotiable rules

- Use pnpm and Nx workspace targets.
- Apply [`ENGINEERING.md`](ENGINEERING.md) to code, tests and boundaries.
- Do not use production Firebase for local development or CI.
- Do not commit secrets, push from an agent or use `git reset --hard`.

## Read by task

1. Product/domain: [`PROJECT.md`](PROJECT.md) and [`PRODUCT.md`](PRODUCT.md).
2. Implementation: [`ENGINEERING.md`](ENGINEERING.md),
   [`ARCHITECTURE.md`](ARCHITECTURE.md) and applicable ADRs.
3. Delivery: [`DELIVERY.md`](DELIVERY.md) and the affected library `docs/`.
4. Detail only when needed: [`archive/`](archive/).

## Design precedence

```text
Vision -> language -> use case -> aggregate hypothesis
-> domain model -> events -> technical architecture -> persistence -> code
```

ADRs record durable decisions. Product candidates and archived research do not
authorize implementation by themselves.

## Working method

Before changing code, identify the relevant sources, affected boundaries,
risks and validation. Implement the smallest coherent slice, run focused
checks, review the diff and report remaining failures or decisions. Use the
archived [`AUDITOR.md`](archive/core/AUDITOR.md) when a change crosses
architecture, persistence, security or documentation boundaries.

## Retrieval and integrations

Start with local documentation and exact search. Use CodeGraph for structural
questions, and Firebase or GitHub tooling only for their external domains.
