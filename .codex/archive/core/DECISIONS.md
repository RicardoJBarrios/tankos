# Decision registry

This file is only a navigation aid. It is not a second policy document.

## Decision precedence

1. Explicit user decision recorded in the relevant canonical specification.
2. Applicable ADR for a durable technical constraint.
3. `DOMAIN_RULES.md` for cross-domain invariants.
4. `CODING.md`, `TESTING.md` and `CODE_GUARDRAILS.md` for implementation.
5. Research, candidate plans and agent proposals are informative only.

When a decision changes, update its canonical document and create or amend an
ADR when the change affects architecture, persistence, security or public
contracts. Do not copy the decision into this file.

## Current technical anchors

- Product and domain: [`VISION.md`](VISION.md), [`GLOSSARY.md`](GLOSSARY.md),
  [`DOMAIN_RULES.md`](DOMAIN_RULES.md).
- Architecture: [`architecture/target-architecture.md`](../architecture/target-architecture.md).
- Persistence and cost: [`architecture/firestore-data-access-and-finops.md`](../architecture/firestore-data-access-and-finops.md).
- Code and tests: [`CODE_GUARDRAILS.md`](CODE_GUARDRAILS.md).
- Current product delivery: [`ROADMAP.md`](ROADMAP.md) and accepted
  specifications under [`specifications/`](../specifications/).
