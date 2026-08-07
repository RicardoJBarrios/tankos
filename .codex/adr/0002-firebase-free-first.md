# ADR-0002: Firebase free-first, emulators and testing

## Status

Accepted

## Context

The application needs managed identity, persistence and hosting while keeping
operational cost and accidental production access low. See the
[target architecture](../architecture/target-architecture.md).

## Decision

Use Firebase Authentication, Firestore, Hosting and App Check under a free-first
policy. Encapsulate Firebase behind domain `data-access` and keep one SDK-based
implementation configurable for real services or Emulator Suite endpoints.

Use a `demo-*` project with Auth and Firestore emulators for local development and
integration tests. Unit tests use mocks or fakes of `data-access` contracts. CI
uses `firebase emulators:exec`; E2E never targets production. Security Rules and
synthetic fixtures are versioned and tested against emulators.

AngularFire remains the preferred Angular integration when a stable compatible
release exists; otherwise use the modular Firebase SDK behind the same boundary.

For the MVP `Establish an Aquarium` path, Firebase Anonymous Auth is accepted as
the minimal authenticated-keeper mechanism. It is an application delivery
choice, not a domain identity model; account linking, recovery and durable
human identity are deferred. The current implementation is emulator-backed and
fails closed outside a configured development environment.

This slice uses the modular Firebase SDK rather than adding AngularFire-specific
integration because it needs only Auth and Firestore client APIs and keeps those
dependencies behind the existing infrastructure adapters.

## Consequences

- Local and integration work does not consume production quotas.
- Emulator behavior reduces, but does not eliminate, the need for controlled
  pre-release validation.
- Configuration must fail closed outside production.
- Services requiring Blaze need a separate justified decision.

## Implementation timing

Firebase is a direction. For `Establish an Aquarium`, Authentication, Firestore,
the local Emulator Suite, fail-closed configuration, Security Rules, a minimal
synthetic fixture/seed and emulator-backed integration tests are required because
the new Aquarium is private and durable. App Check and every other Firebase
service are deferred until their use case justifies them.

## Alternatives considered

- Production Firebase for development or CI: rejected for safety and cost.
- A separate emulator implementation: rejected as unnecessary duplication.
- Mocks for all tests: rejected because they cannot validate Rules or SDK behavior.
