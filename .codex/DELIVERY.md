# Delivery contract

## Before implementation

Identify the accepted behavior, affected boundary, relevant architecture
and authorization impact, tests and risks. Do not infer unresolved behavior.
Use the smallest coherent slice.

## During implementation

Reuse existing ports/adapters and public APIs. Keep changes localized. Update
the canonical contract when behavior or a durable technical decision changes.
Keep library documentation in that library's `docs/`.

## Before completion

Run affected type/lint/test/build/format checks, review the diff and report
failures honestly. For a durable Firebase change, validate adapter behavior and
Rules in the Emulator Suite. Use Playwright only for meaningful browser-level
contracts.

## Roadmap rule

The active product roadmap is intentionally short: stabilize the greenfield
TankOS foundation, then implement one accepted vertical slice at a time. The
former detailed roadmap, journeys and specifications remain available in
[`archive/product/`](archive/product/) and [`archive/specifications/`](archive/specifications/).
