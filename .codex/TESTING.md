# Testing Guide

| Layer                                        | Tool                    | Policy                                                  |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| Domain/application TypeScript                | Vitest                  | Test pure logic directly.                               |
| Angular components/services/directives/pipes | Spectator + Vitest      | Prefer Spectator helpers over repetitive TestBed setup. |
| Firebase adapters and Security Rules         | Firebase Emulator Suite | Use deterministic fixtures and resettable emulators.    |
| Browser journeys                             | Playwright              | Validate only meaningful cross-route keeper journeys.   |

Avoid excessive mocks. Prefer fakes for application ports where practical.
Do not force Spectator into pure TypeScript tests. CI must not connect to Firebase
production.

## Current slices

`Establish an Aquarium` currently has focused domain tests for identifiers and
names, application tests for authenticated creation and independent multiple
Aquariums, a Firebase SDK repository-adapter integration test against the Auth
and Firestore emulators, Security Rules tests for unauthenticated, owner,
independent multiple-Aquarium and cross-owner paths, and a Spectator component
test for the form interaction. The adapter test verifies persisted documents
through the SDK; Rules tests verify authorization separately.

The unit-test target excludes `*.integration.spec.ts` because the Angular/jsdom
runner does not provide a reliable Firebase SDK environment. Run the adapter
and Rules tests through `firebase emulators:exec` with
`apps/veril/vitest.integration.config.ts`, which uses Vitest's Node environment.

`List My Aquariums` and `Select Aquarium` add application and Spectator coverage
for owner-scoped retrieval, selection, Active Context replacement and failure
states. Their Firestore adapter and Rules behavior is covered by the same
Emulator Suite run.

`Record an Observation` has pure domain tests for non-empty qualitative
evidence, application tests for Active Context, validation, authentication and
infrastructure failures, and a Spectator test for validation, successful save,
recoverable failure and the no-context state. Its Firebase adapter test writes
through the SDK and verifies the persisted document. Its Rules coverage verifies
authorized creation, anonymous rejection, cross-owner creation rejection,
owner reads, anonymous reads and cross-owner reads.

`Record a Measurement` has pure domain tests for the closed Parameter catalogue,
canonical Unit compatibility, numeric validity, identity, timestamps and manual
provenance. Application tests cover Active Context, authentication, validation
and infrastructure failures. Its Spectator test covers Parameter selection,
value validation, success, recoverable failure and the no-context state. The
Firebase adapter and Rules tests verify owner-scoped persistence, canonical
representation, timestamps, provenance and rejection of anonymous, cross-owner,
spoofed-owner and malformed structural writes.

`List Measurements` adds application tests for authentication, Active Context,
empty pages, opaque continuation and infrastructure failures. Its adapter
integration tests use the real Emulator Suite to verify owner-scoped reads,
field mapping, the accepted three-field ordering, page limits, cursor
continuation, tie handling and malformed persisted data. Rules tests cover the
owner query and reject unauthenticated and cross-owner queries. Spectator tests
cover missing context, loading, empty, ordered results, continuation, pending
loading and recoverable errors. The existing Playwright keeper journey also
verifies that a recorded Measurement is visible in its list.

`List Observations` adds application tests for authentication, Active Context,
empty results, ordered read models and infrastructure failures. Its adapter
integration tests use the real Emulator Suite to verify owner-scoped reads,
recorded-time and ObservationId ordering, bounded results and field mapping;
the adapter boundary test rejects malformed persisted data. Rules tests cover
the owner query and reject unauthenticated and cross-owner queries. Spectator
tests cover missing context, loading, empty, results and recoverable errors.
The canonical Playwright keeper journey also verifies that recorded qualitative
evidence is visible in the observation list.

`Review Recent Timeline` adds application tests for authentication, Active
Context, the two-source merge, effective-time semantics, deterministic ties,
the bounded top-N result and whole-read failure behavior. Its adapter tests
verify the bounded Observation and Measurement source queries against the
Emulator Suite; source parsing remains covered by the existing adapter boundary
tests. Spectator tests cover missing context, loading, mixed results, empty and
recoverable error states. The canonical Playwright journey verifies that a
recorded Observation and Measurement are both visible in recent activity.

`Record Care Work` adds pure domain tests for UUID identity, trimmed non-empty
description, performed/recorded timestamps and manual provenance. Application
tests cover authentication, Active Context, validation, successful recording
and infrastructure failures. Its Firebase adapter test verifies the
owner-attributed document, both timestamps and provenance through the SDK.
Rules tests cover authorized creation and owner reads while rejecting
unauthenticated, cross-owner and spoofed-owner access. Spectator tests cover
missing context, validation, pending, success and recoverable error states. The
canonical Playwright journey records a completed Care Work action through the
UI; Care Work remains outside the current Timeline read model.

## Browser journeys

`pnpm nx e2e veril` runs the canonical Chromium journeys through visible UI
against the local Auth and Firestore emulators. Playwright starts the same local
development environment as `pnpm dev` when needed; it never targets a deployed
Firebase project. Each test receives a fresh browser context and establishes its
own anonymous keeper and data through the UI, without shared fixtures or
production exports.

The suite protects the complete keeper loop (establish, list, select, record an
Observation and record a Measurement), including the same-tab refresh that
restores the anonymous keeper and owner-validated Active Context. It also covers
the recovery state for recording without an Active Context. It does not repeat
domain, adapter or Rules assertions already covered at lower levels. CI installs
Chromium, retries browser failures once with trace capture and uploads the
resulting Playwright artifacts only on failure.

## E2E selectors

Prefer user-facing role, label and text selectors. Add `data-testid` only for a
stable test contract that has no suitable user-facing equivalent; it names the
element's purpose, not its styling or implementation. The current list and
Active Context indicator are such anchors. Do not make test ids a production
API, duplicate them on every element or use them instead of accessible queries.
