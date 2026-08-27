# TankOS project

TankOS is an Angular/Nx product for managing freshwater, saltwater, brackish,
planted, reef, shrimp, snail and mixed aquariums. `Aquarium` is the central
domain aggregate root; TankOS is the product, never an Aquarium.

## Purpose

Help a keeper record, understand and operate aquarium care with trustworthy
context: system, time, subject, provenance and history. Preserve observations
before interpretation and keep automation advisory until explicitly accepted.

## Domain language

- `AquariumSystem`: the managed physical system; a display, sump, refugium and
  connected internal components belong to one system.
- `Measurement`: a quantitative observation with quantity, value, unit, method,
  time and provenance when applicable.
- `Observation`: a qualitative or visual record.
- `CareWork`: a planned or completed maintenance action.
- `ParameterDefinition`: a global, versioned catalogue definition that an
  Aquarium may select; it is not Aquarium-owned.
- `Unit`: an independent standard/custom unit and conversion contract; Units
  have no Aquarium relationship.
- An Aquarium may be managed by multiple keepers. Membership, roles and
  per-capability permissions belong to the Aquarium access boundary, not to
  authentication alone.

The complete historical glossary, domain rules and accepted product discovery
remain in [`archive/core/`](archive/core/) and [`archive/product/`](archive/product/).
Read only the relevant archived page when implementing that concept.

Aquarium-specific decisions are owned by
[`libs/aquarium/docs/decisions.md`](../libs/aquarium/docs/decisions.md). This
document keeps only the workspace-level product language.

## Scope rule

An accepted specification defines behavior. A candidate, research note or
future proposal does not authorize code, roles, persistence or integration.
