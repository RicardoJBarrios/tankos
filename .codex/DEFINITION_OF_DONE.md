# Definition of Done

A vertical slice is done when its accepted behavior is demonstrably complete at
the boundaries it actually uses. Apply the criteria proportionally; do not add
ceremony or test layers that cannot reveal a relevant failure.

## Product and domain

- The accepted specification and observable acceptance criteria are satisfied.
- Loading, empty, validation, failure and success states appropriate to the UX
  are deliberate and accessible.
- Domain rules and canonical terminology are respected; infrastructure types do
  not leak into the domain.

## Application and infrastructure

- The use case and its expected failures are represented deliberately.
- External data is validated with Zod and mapped at the boundary.
- When Firebase is used, access is behind ports/adapters, authorization is
  enforced by Rules, adapters are validated, and no secret is exposed.
- For `Establish an Aquarium`, adapter validation means executing
  `FirestoreAquariumRepository` through the Firebase SDK against the Auth and
  Firestore emulators and verifying persisted behavior; Rules tests cover
  authorization separately.

## Tests and quality

- Focused Vitest tests cover pure domain and application behavior where present.
- Angular behavior is covered with Spectator and Vitest where an Angular unit is
  introduced.
- Firebase-backed behavior has Emulator Suite adapter integration tests and
  Security Rules tests where applicable.
- Lint, relevant tests, production build, formatting, peer-dependency validity
  and `git diff --check` pass.

Playwright E2E is required when a slice introduces a meaningful browser journey
that component and emulator integration tests cannot demonstrate, such as a
multi-step cross-route flow, browser-only integration, PWA lifecycle behavior or
a regression at that boundary. It is not automatic for a trivial form.

## Documentation and operations

- The specification reflects delivered behavior. Architecture, ADRs, glossary
  and domain rules change only when new durable knowledge was discovered.
- No blocking TODO, debug artifact or unreviewed migration implication remains.
- Observability is added only when the slice has an operational need for it.
