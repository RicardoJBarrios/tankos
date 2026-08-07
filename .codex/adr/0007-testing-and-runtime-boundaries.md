# ADR-0007: Testing and runtime data boundaries

## Status

Accepted

## Context

The project needs fast unit tests, realistic Firebase integration tests and a
clear boundary between untrusted transport data and domain behavior.

## Decision

Use Vitest for pure TypeScript domain and application tests. Use Spectator 20.0.0
with Vitest for Angular components, services, directives and pipes. Use Firebase
Emulator Suite for adapter and Security Rules integration tests, and Playwright
for browser E2E tests.

Use Zod 4.4.3 at external data boundaries. Derive transport DTO types with
`z.infer`, then map DTOs into domain entities or value objects. Do not expose
Firestore DTOs directly to the domain or UI, and do not couple domain behavior
to Zod when a plain domain model is sufficient.

## Consequences

- Unit tests remain fast and focused.
- Emulator tests cover SDK and Rules behavior without production access.
- Spectator reduces Angular TestBed boilerplate without constraining pure tests.
- Runtime validation is explicit and transport contracts have one source of truth.

## Implementation timing

For `Establish an Aquarium`, focused unit tests, emulator-backed adapter tests
and Security Rules tests are required with the persistence implementation.
Playwright remains the accepted browser-test direction but is deferred until a
meaningful browser journey requires it.

## Alternatives considered

- TestBed for every Angular test: rejected because it adds repetitive setup.
- Mocks for all Firebase behavior: rejected because mocks cannot validate Rules or
  emulator behavior.
- Handwritten duplicate DTO interfaces: rejected when Zod can derive the type.
