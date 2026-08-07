# Testing Guide

| Layer | Tool | Policy |
| --- | --- | --- |
| Domain/application TypeScript | Vitest | Test pure logic directly. |
| Angular components/services/directives/pipes | Spectator + Vitest | Prefer Spectator helpers over repetitive TestBed setup. |
| Firebase adapters and Security Rules | Firebase Emulator Suite | Use deterministic fixtures and resettable emulators. |
| Browser journeys | Playwright | Use an isolated non-production environment. |

Avoid excessive mocks. Prefer fakes for application ports where practical.
Do not force Spectator into pure TypeScript tests. CI must not connect to Firebase
production.

## Current slice

`Establish an Aquarium` requires domain tests for identifiers, names and
creation rules; application tests for authentication, duplicates and mapped
failures; Zod DTO tests; Emulator Suite repository-adapter tests; Security Rules
tests for unauthenticated, owner and duplicate paths; and Spectator form or
component tests. Playwright remains the browser-test direction but is deferred
until a cross-route or browser-only journey cannot be demonstrated by those
layers.
