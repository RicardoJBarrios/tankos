# Project Context

The canonical product intent is [VISION.md](VISION.md). This document adds
working context and must not turn unvalidated domain hypotheses into rules.

## What TankOS is

TankOS is the product application for managing and presenting Aquariums of
freshwater, saltwater, brackish, planted, reef, shrimp, snail and mixed kinds,
including their Livestock, Measurements, Maintenance and Equipment. It is not
itself an Aquarium. The first Aquarium instance is named TankOS; that name does
not make the product a single-Aquarium domain model.

## Why it exists

Aquarium care combines recurring work, observations, measurements and historical
context. TankOS should make that information easier to understand and act on
without hiding important uncertainty or history.

## Long-term goals

- Make aquarium care easier to understand and operate.
- Support domain growth without turning the application into an unbounded
  monolith.
- Preserve a useful offline experience where the domain can safely support it.
- Keep local development and CI reproducible without consuming production quotas.

## Users

The target users are aquarium keepers who need trustworthy, understandable and
low-friction workflows. The product should serve daily care as well as historical
review, without assuming that every user needs an expert-level interface.

## Product philosophy

Prefer useful, calm and explainable workflows over feature volume. Make
uncertain, stale, offline or pending information visible instead of presenting
false confidence. Historical semantics for individual domain concepts remain a
use-case decision.

## Design philosophy

Use domain language in the interface and code. Make the active Aquarium context,
the next useful action and the historical record easy to find. Accessibility,
readability and predictable recovery are product qualities, not later polish.

## Engineering philosophy

Prefer simple domain-first solutions over premature frameworks or abstractions.
Features should make their domain visible. Infrastructure is replaceable and
must remain behind ports and data-access boundaries.

Use tests and runtime validation to protect boundaries. Keep changes incremental,
observable and reversible. Prefer one understandable implementation over parallel
implementations for local, test and production unless a real boundary requires it.

## Operational philosophy

Local development and CI must fail closed against production. Fixtures should be
deterministic, deployments reproducible and operational failures diagnosable.
Security, privacy and data recovery take precedence over silent convenience.

## Cost philosophy

Use Firebase Emulator Suite locally and in CI where possible. Bound reads,
reuse static assets and avoid infrastructure that requires unnecessary paid
services. Keep the workspace small until a real feature justifies extraction.

## Maintainability and scalability goals

- Keep domain ownership visible as the product grows.
- Extract Nx libraries only when a boundary or reuse case is real.
- Keep persistence, transport and UI models from becoming one coupled model.
- Preserve the ability to test domain logic without Angular or Firebase.
- Prefer predictable performance and bounded operational cost.

## Explicit non-goals

- Do not build a generic aquarium social network.
- Do not create a generic workflow engine before concrete domain needs exist.
- Do not introduce AI features before trustworthy data, history and permissions
  are established.
- Do not create every predicted domain library during bootstrap.
- Do not optimize for offline behavior that weakens privacy or consistency.
