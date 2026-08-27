# `units-composition`

## Purpose

Angular composition boundary for the units feature. It exposes
`UNIT_DEFINITION_MANAGEMENT_SERVICE` so the host can connect the units
application service to a persistence adapter.

## Architecture

The token references the application contract from `@tankos/units`, while the
concrete implementation is supplied by the TankOS composition root. The UI
consumes the token without importing Firestore or constructing adapters.

## Limits and decisions

- This package contains no domain model, use case implementation, Firebase or
  visual component.
- It is intentionally Angular-specific and therefore remains outside the
  framework-neutral `@tankos/units` package.
- A future host can provide another adapter while retaining the same contract.

## Verification

The token and its public export are covered by Vitest tests.
