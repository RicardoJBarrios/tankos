# ADR-0002: Firebase free-first, emulators and testing

## Status

Accepted

## Context

The application needs managed identity, persistence and hosting while keeping
operational cost and accidental production access low. See the
[target architecture](../../ARCHITECTURE.md).

## Decision

Use Firebase Authentication, Firestore, Hosting and App Check under a free-first
policy. Encapsulate Firebase behind domain `data-access` and keep one SDK-based
implementation configurable for real services or Emulator Suite endpoints.

Use a `demo-*` project with Auth and Firestore emulators for local development and
integration tests. Unit tests use mocks or fakes of `data-access` contracts. CI
uses `firebase emulators:exec`; E2E never targets production. Security Rules and
synthetic fixtures are versioned and tested against emulators.

The current workspace uses the modular Firebase SDK rather than AngularFire.
AngularFire is not a dependency unless a concrete Angular integration need and
a compatible release justify adding it behind the same boundary.

When the private Aquarium flow is implemented, Firebase Anonymous Auth may
provide the minimal authenticated-keeper mechanism. It is an application
delivery choice, not a domain identity model; account linking, recovery and
durable human identity remain separate decisions.

## Consequences

- Local and integration work does not consume production quotas.
- Emulator behavior reduces, but does not eliminate, the need for controlled
  pre-release validation.
- Configuration must fail closed outside production.
- Services requiring Blaze need a separate justified decision.

## Implementation timing

Firebase is a direction. For a private durable Aquarium slice, Authentication,
Firestore, the local Emulator Suite, fail-closed configuration, Security Rules,
synthetic fixtures and emulator-backed integration tests become required. App
Check and other Firebase services remain deferred until their use case justifies
them.

## Alternatives considered

- Production Firebase for development or CI: rejected for safety and cost.
- A separate emulator implementation: rejected as unnecessary duplication.
- Mocks for all tests: rejected because they cannot validate Rules or SDK behavior.
