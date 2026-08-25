# Architecture contract

## Composition

The application composition root is `apps/tankos`. Features may remain in the
app until a real boundary exists. Libraries are isolated by Nx tags and ESLint
Boundaries. `legacy/veril` is retained for reference and is outside Nx.

## Domain flow

Use Screaming Hexagonal Architecture:

```text
domain -> application ports <- infrastructure adapters
                           \-> UI/composition
```

Stores coordinate feature state; they do not become domain persistence. Guards
improve navigation UX, never authorization.

## Data and Firestore

- Firestore is NoSQL: no relational foreign keys or cascade assumptions.
- Store immutable/versioned contracts with explicit logical identifiers and
  snapshots where historical meaning requires them.
- Hide soft-deleted records by default; purge is an explicit administrative or
  controlled batch operation.
- Bound and paginate reads. Prefer domain-scoped local cache with an explicit
  invalidation/bypass path; avoid listeners unless the use case needs them.
- Keep indexes, Firebase configuration, Rules and deployment in the app layer;
  reusable libraries provide ports and adapters, not project deployment.

## Time, units and measurements

Time normalizes transport values to UTC and delegates localized display to the
Angular-facing edge. Units manage standards, symbols and conversions only.
Measurements own quantity, method, provenance and Aquarium/System context.

## Technology decisions

- Use stable compatible Angular 22, Nx 23 and Angular Material/CDK releases.
- Use standalone APIs, Signals, typed forms, lazy routes and `inject()`.
- Use local Signals for local state and NgRx Signals `22.0.0` `signalStore` for
  shared/complex state, scoped to the smallest useful injector. RxJS is for
  streams and explicit bridges, not a second state store.
- Use Vitest for pure code, Spectator + Vitest for Angular integration,
  Firebase Emulator Suite for Firebase/Rules tests and Playwright for meaningful
  browser journeys. Validate external data with Zod at the boundary.

## Firebase, rendering and offline

- Use the modular Firebase SDK behind adapters. AngularFire is not installed;
  adding it requires a concrete integration need and compatible release.
- Use Auth, Firestore and Hosting under a free-first policy. Local and CI work
  uses emulators and never production. Firebase configuration, Rules, indexes
  and deployment remain app-owned; libraries provide reusable ports/adapters.
- Public routes may be prerendered; private routes use lazy CSR. Angular
  Service Worker caches the app shell/assets, not authenticated data or tokens.
  Preview automation is deferred while repository Actions are disabled.
- Persistent Firestore cache requires trusted-device consent. Firestore remains
  the pending-write queue; classify operations as last-write-wins,
  history-preserving or online-required before adding offline behavior.

## Quality and tooling

Libraries target 100% V8 coverage for lines, statements, functions and branches,
including public contract tests. Nx/ESLint Boundaries, SonarJS, Semgrep,
Gitleaks, Knip and `pnpm audit` enforce the local quality stack. SonarCloud is
an external quality gate invoked by `pnpm quality:sonar`/`quality:all`, receives
LCOV reports, publishes to `master` and excludes `legacy/`.

Use Nx for projects and targets, `rg` for exact retrieval and CodeGraph only
for structural impact after exact search. These tools do not authorize pushes,
secret access or destructive changes.

## Evolution

This file is the single active source for technical decisions. Change the
relevant section when a decision changes and preserve prior rationale under
[`archive/`](archive/). Do not create a separate ADR layer or duplicate the
decision in another active document.
