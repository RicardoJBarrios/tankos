# Veril Vision

## Purpose

Veril is the product that helps aquarium keepers understand, present, plan and
carry out care for freshwater, saltwater, brackish, planted, reef, shrimp,
snail and mixed systems with trustworthy, low-friction records. It exposes
public and private capabilities over the same Aquarium, making the relevant
context, next useful action and history understandable without pretending that
uncertain data is certain.

## Problems to solve

- Daily care, observations and recurring work are easy to lose or fragment.
- Measurements and maintenance need useful context before they can guide action.
- A keeper needs clear status and recovery information, including when offline.

## Explicit non-goals

- A generic social network, workflow engine or device platform.
- AI, automation or integrations without a concrete user problem, safety model
  and evidence of value.
- Offline behavior that silently weakens privacy, authorization or consistency.

## Product and UX philosophy

Prefer calm, explainable workflows over feature volume. Use the domain language
consistently, make uncertainty visible and preserve an understandable history
when the product requirements call for it. Accessibility, recovery and clarity
are product qualities. The canonical priority rules are in
[`product/PRODUCT_PRINCIPLES.md`](product/PRODUCT_PRINCIPLES.md) and the
interaction and visual direction is in
[`product/UX_PHILOSOPHY.md`](product/UX_PHILOSOPHY.md).

## AI and automation philosophy

AI may assist, explain or recommend only through explicit application boundaries.
It must not silently change domain truth. Automation requires a concrete use
case, explicit authorization, safety limits, auditability and human control.

## Cost and maintainability philosophy

Favor one understandable implementation, bounded provider use and reproducible
local work. Grow boundaries, abstractions and workspace projects only when a
validated feature or ownership need makes them useful. Technology supports the
domain model; it does not define it.
