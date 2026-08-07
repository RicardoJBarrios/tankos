# Testing Guide

| Layer                                        | Tool                    | Policy                                                  |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| Domain/application TypeScript                | Vitest                  | Test pure logic directly.                               |
| Angular components/services/directives/pipes | Spectator + Vitest      | Prefer Spectator helpers over repetitive TestBed setup. |
| Firebase adapters and Security Rules         | Firebase Emulator Suite | Use deterministic fixtures and resettable emulators.    |
| Browser journeys                             | Playwright              | Use an isolated non-production environment.             |

Avoid excessive mocks. Prefer fakes for application ports where practical.
Do not force Spectator into pure TypeScript tests. CI must not connect to Firebase
production.

## Current slice

`Establish an Aquarium` currently has focused domain tests for identifiers and
names, application tests for authenticated creation and independent multiple
Aquariums, a Firebase SDK repository-adapter integration test against the Auth
and Firestore emulators, Security Rules tests for unauthenticated, owner,
independent multiple-Aquarium and cross-owner paths, and a Spectator component
test for the form interaction. The adapter test verifies persisted documents
through the SDK; Rules tests verify authorization separately. Playwright remains
the browser-test direction but is deferred until a cross-route or browser-only
journey cannot be demonstrated by these layers.

The unit-test target excludes `*.integration.spec.ts` because the Angular/jsdom
runner does not provide a reliable Firebase SDK environment. Run the adapter
test separately with `firebase emulators:exec` and Vitest's Node environment.
