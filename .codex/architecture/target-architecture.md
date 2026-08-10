# Target Architecture

Status: technical baseline; detailed accepted decisions live in the linked ADRs.
Last external verification: 2026-08-07.

## 1. Scope and current baseline

Veril is the product application for marine-aquarium management and presentation.
This document defines technical direction; it does not define the Firestore
schema or product requirements.

## Design precedence

Technical direction follows, rather than substitutes for, domain discovery:

```text
Vision -> Ubiquitous Language -> Use Cases -> Aggregate hypotheses
-> Domain Model -> Events -> Technical Architecture -> Persistence -> Code
```

Only accepted use cases and domain rules can constrain Firestore shape, feature
boundaries or technical behavior. Current domain documents contain hypotheses
where product evidence is still absent.

## Direction and implementation timing

| Direction                            | Required for current slice                                | Deferred implementation                                                |
| ------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Private/public capability separation | Private establishment only; public data is deferred.      | Public Aquarium presentation and publication controls.                 |
| Firebase Auth and Firestore          | Required for the authenticated, durable private Aquarium. | Additional services and data models.                                   |
| Emulator Suite and Security Rules    | Required before the slice persists private data.          | Broader fixture catalogues and environment promotion.                  |
| PWA                                  | App-shell capability already exists.                      | Update UX, data sync and domain offline behavior.                      |
| Offline capability                   | `Establish Aquarium` is online-required.                  | Offline writes, trusted-device mode and conflict handling.             |
| App Check                            | Accepted direction.                                       | Rollout and enforcement after a deployed client/use case justifies it. |
| Timeline                             | Direction for later review.                               | Timeline projection and parameter-history UX.                          |
| Playwright E2E                       | Required for canonical cross-route keeper journeys.       | Additional journeys only when they reveal browser-level risk.          |

This table governs timing. It does not weaken the accepted directions in ADRs.

Observed workspace baseline:

- Node 24, pnpm 11.17.0, Nx 23.1.1, Angular 20.3.27 and TypeScript 5.8.3.
- Angular Material/CDK 20.2.14, Service Worker and SSR 20.3.27.
- AngularFire 20.0.1, Firebase JS SDK 12.17.1 and NgRx Signals 20.1.0.
- One application, `veril`, with standalone routing and public/private shells.
- Static output with public prerendering and private CSR.
- Build, serve, lint, test, serve-static and inferred Playwright `e2e` targets.
- The application is tagged `scope:app` and `type:app`; no domain libraries
  are created until a real boundary exists.
- Codex uses local documentation, exact search, CodeGraph for structural
  relationships and Nx MCP for project-level relationships.

The architecture is introduced only when a real feature needs it. Predicted
libraries, services and abstractions must not be created ceremonially.

## 2. Composition and dependency direction

```text
Firebase Hosting + CDN
        |
        +-- PublicShell -> public features -> prerendered HTML
        |
        `-- PrivateShell -> lazy domain features -> CSR
                                      |
                                      v
                             Signal Stores / facades
                                      |
                                      v
                                application layer
                                      |
                                      v
                                      ports
                                      ^
                                      |
                                  adapters
                                      |
                          Firebase / AngularFire / Zod
```

`apps/veril` is the composition root for bootstrap, root routes, shells and
cross-cutting configuration. The domain layer must not depend on Angular,
Firebase, AngularFire, Zod or NgRx.

Angular is the application framework boundary: external HTTP uses Angular's
`HttpClient` (or `httpResource` only for a concrete reactive resource), and
native `fetch` is not used by runtime application/infrastructure code. The
Aquarium operational surface is a scoped Dashboard composed from explicit
sections and coordinated by `AquariumWorkspaceStore`; it is not a generic
widget engine or a global store.

The preferred local feature shape is:

```text
apps/veril/src/app/<domain>/
  domain/
  application/
  infrastructure/
  ui/
```

Extract a domain into `libs/<domain>/` only when ownership, reuse or a boundary
justifies an Nx project.

## 3. Domain-first Screaming Hexagonal Architecture

Potential domain areas, subject to use-case discovery, include:

```text
aquarium   livestock  water-parameters  maintenance
feeding    equipment  inventory          auth  settings
```

Infrastructure technologies remain secondary. Features may depend on their own
domain and explicitly approved shared capabilities, but cross-domain access must
go through a stable application contract or orchestration boundary.

Recommended library types are `feature`, `ui`, `data-access` and `util`.
Create only the type required by a real feature.

## 4. Public/private rendering

Decision: [ADR-0003](../adr/0003-rendering-hosting-pwa.md).

Public routes expose public capabilities and contain no session-specific data.
They are explicitly eligible for Angular prerendering. Public and private routes
are views of the same Aquarium domain model, not separate domains.

Public Aquarium presentation is deferred from the first slice. Until an accepted
publication use case defines its data, all Aquarium care information is private.

Private routes use `PrivateShell` under a stable prefix such as `/app`. They are
lazy-loaded, client-rendered and protected by functional guards for navigation
experience. Firebase Security Rules remain the authorization boundary; a guard
is never a security control.

```text
PublicShell
  /                 prerender
  /guides/**        prerender when build data is available
  /about            prerender
  /sign-in          public CSR or prerender

PrivateShell
  /app              CSR + guard
  /app/<capability> lazy when an accepted use case needs it
  /app/settings     lazy
```

Use standalone routing, `loadComponent` or `loadChildren`, functional guards and
`inject()` where they make the boundary clearer.

## 5. PWA, rendering and hosting

Use Angular prerendering and `outputMode: "static"` for public content. Deploy
the result through Firebase Hosting and its CDN; do not introduce a permanent
SSR runtime without a measured requirement.

Angular Service Worker is responsible for the app shell, versioned assets,
manifest, installability and coherent background updates. It must not cache
Firestore responses, authenticated responses, tokens or private data.

The initial cache policy is deliberately small: preload the shell, styles,
fonts and essential icons; load feature chunks on demand. A feature already
visited may be reopened offline, but all future features are not precached.

Observe `SwUpdate.versionUpdates`. On `VERSION_READY`, notify the user and reload
only when unsaved UI state and tracked pending mutations are safe. Use a full
page reload rather than `activateUpdate()` without reload, to avoid mixing shell
and lazy chunks from different versions.

Validate PWA behavior against a production build served over localhost or HTTPS,
not only against the development server. Browsers without Service Worker support
must still receive the application without installation or offline caching.

## 6. Firebase integration

Decision: [ADR-0002](../adr/0002-firebase-free-first.md).

Firebase Authentication, Cloud Firestore, Hosting, App Check and the Local
Emulator Suite are accepted directions. The current slice requires only
Authentication, Firestore and the Emulator Suite with Security Rules. Current
Measurement values are read directly from historical Measurements; a trusted
projection is deferred until a concrete scale need justifies its operational
cost. Hosting is needed when deployment is introduced; App Check, Storage,
Functions, Cloud Run, Analytics and other services remain deferred until a
concrete use case justifies them.

Use one modular Firebase implementation configured for real or emulator hosts.
AngularFire and the Firebase SDK remain behind small `data-access` adapters.
Features must not import Firebase APIs directly.

The public Firebase web configuration is not an administrative secret. Admin
credentials, CI tokens and App Check debug tokens must never enter frontend code.

### Firestore access

- Design collections only after accepted use cases, aggregate boundaries and real
  queries; do not derive them from relational tables or speculative domains.
- Bound queries, paginate with cursors and avoid whole-collection reads.
- Keep listeners scoped and unsubscribe when their owner ends.
- Use controlled denormalization only when it reduces reads without unacceptable
  consistency cost.
- Separate public, private and ownership-controlled data.
- Measure reads, writes, storage and bandwidth before optimizing.

### Establish an Aquarium implementation order

Implement the smallest complete private write in this order:

1. Firebase local configuration, Auth/Firestore emulators and fail-closed
   environment selection.
2. Deny-by-default Security Rules, deterministic test keeper/fixture and reset
   path.
3. `AquariumId`, `AquariumName` and the minimal Aquarium domain model.
4. `EstablishAquarium` application use case, repository port and expected
   failures.
5. Zod DTO/schema plus Firebase/AngularFire repository adapter, including a new
   opaque Aquarium identity and owner association.
6. Scoped Signal Store and Angular form/UI in the existing application.
7. Domain/application, adapter, Rules and Angular tests, then focused final
   validation.

Do not add a library, generic event store, generic repository, Timeline
projection, offline queue or public model for this slice.

### Establish an Aquarium security and test baseline

The actor is an authenticated keeper. The resulting root is private, and only
the authorized keeper may access it in this slice. Client guards improve
navigation only; Firestore Rules are authoritative. Each new Aquarium must be
owned by its authenticated creator and remain independently addressable.

Required tests are: domain tests for `AquariumId`/`AquariumName` and creation
rules; application tests for authentication and infrastructure failures; Zod
DTO tests; Emulator Suite repository-adapter tests; Firestore Security Rules
tests for unauthenticated, owner, second-owner and independent multiple-Aquarium
paths; and Spectator form/component tests. The canonical cross-route keeper
journey is covered by Playwright against local emulators.

## 7. External data and model boundaries

Zod is mandatory at external data boundaries. Firestore documents, callable/API
responses, persisted local data, imported files, URL/query inputs, third-party
responses, configuration and fixtures must be validated whenever their structure
is not already guaranteed internally.

```text
external data
     |
     v
Zod DTO schema
     |
     v
z.infer<DTO>
     |
     v
mapper
     |
     v
domain entity / value object
```

Zod schemas are the canonical runtime representation of transport contracts.
Derive DTO types with `z.infer` instead of maintaining duplicate interfaces.
Do not generate rich domain entities from persistence schemas when doing so
couples domain behavior to Zod or Firestore.

Firestore DTOs must never be exposed directly to the domain or UI.

## 8. State management

Decision: [ADR-0005](../adr/0005-state-management.md).

- Use Angular Signals and `computed()` for local component/view state.
- Use NgRx Signals 20.1.0 `signalStore` in a scoped facade when state is shared,
  has complex transitions, needs shared caching or crosses views.
- Use RxJS for stream-oriented asynchronous work and bridge at explicit edges.
- Keep persistent domain data in `data-access` and Firestore.
- Do not create a second persistence layer or a duplicate pending-write queue.

Store scope must be the smallest injector that owns the state.

## 9. Offline policy

Decision: [ADR-0006](../adr/0006-offline-persistence.md).

The first `Establish Aquarium` command is `online-required`; no domain offline
creation, queue or conflict behavior is required for this slice.

Untrusted devices use `memoryLocalCache` and session-scoped authentication.
Trusted-device mode requires explicit consent and uses
`persistentLocalCache` with `persistentMultipleTabManager()`.

If IndexedDB or multi-tab persistence cannot initialize, degrade to memory cache;
do not create a manual single-tab coordinator or a second local database.

Firestore caches documents used by the application, applies local writes
immediately, synchronizes them when connectivity returns and uses last-write-wins
for competing writes. Use `fromCache` and `hasPendingWrites` for snapshot state.

Classify each command before enabling offline writes:

| Class               | Policy                                                           |
| ------------------- | ---------------------------------------------------------------- |
| `offline-safe`      | Local write and native Firestore synchronization are acceptable. |
| `offline-read-only` | Cached reads are allowed; mutations are blocked.                 |
| `online-required`   | Connection and current server state are required.                |

Transactions and current-value invariants are `online-required`. Conflict policy
is per operation: last-write-wins where an accepted use case allows it,
idempotent records where accepted history semantics require them, and strong
online consistency for accepted invariants.
No generic conflict-resolution engine is planned.

Before logout, freeze mutations, wait for pending writes while authenticated,
stop listeners, coordinate tabs and clear private persistence. Offline logout with
pending writes is postponed by default. Immediate discard is a separate explicit
destructive action and must clearly warn about data loss.

## 10. Environments and Emulator Suite

| Environment  | Backend                                                                   | Data policy               |
| ------------ | ------------------------------------------------------------------------- | ------------------------- |
| `local`      | Auth and Firestore emulators, `demo-*` project                            | Deterministic fixtures    |
| `test`       | Mocks for unit tests; emulators for integration                           | Resettable baseline       |
| `preview`    | Hosting Preview Channel; isolated non-production backend only when needed | Synthetic, PR-scoped data |
| `production` | Real Firebase services and App Check                                      | Real data only            |

Local and test must fail closed rather than connect to production. Preview URLs
are public and temporary; visual previews use a backend-free build, while
functional previews use a separately isolated Firebase project.

Use Auth Emulator and Firestore Emulator for local identity, repositories and
Security Rules. Use Hosting Emulator only to validate rewrites, headers, PWA and
E2E behavior. Use `firebase emulators:start` for interactive development and
`firebase emulators:exec` for reproducible integration tests and CI.

Fixtures are small, synthetic, deterministic and versioned. An idempotent seed
initializes Auth and Firestore emulators. Reset means clearing the emulator and
running the seed again. Never place PII or production exports in fixtures.

## 11. Nx boundaries

Current application tags:

```text
scope:app  type:app
```

Future scopes and library types are chosen only when an accepted feature creates
a real ownership or reuse boundary. The naming and tag conventions are defined
in [`CODING.md`](../CODING.md); this document does not authorize predicted
libraries.

The app may depend on shared and its own scope. Domain libraries may depend on
their own scope and narrowly owned shared libraries. ESLint module boundaries
must enforce the policy. `shared` must have explicit ownership and must not become
a global dumping ground.

## 12. Testing strategy

- Pure domain/application TypeScript: Vitest directly.
- Angular components, services, directives and pipes: Spectator with Vitest.
- Firebase adapters and Security Rules: Firebase Emulator Suite integration tests.
- Browser journeys: Playwright E2E against an isolated environment.

Run focused domain/application tests plus emulator-backed adapter and Security
Rules integration tests. Use Playwright for canonical multi-step browser
journeys; do not duplicate lower-level assertions there.

Prefer Spectator helpers over repetitive TestBed setup. Avoid excessive mocks;
use fakes for application ports where practical. Do not force Spectator into
pure TypeScript tests.

## 13. Cost and security

Keep development, integration tests and CI on emulators to avoid Firebase quotas.
Prefer static Hosting, bounded queries, lazy loading, Service Worker asset reuse
and cache persistence where privacy permits. Do not sacrifice correctness or
security solely to reduce operations.

Security Rules are deny-by-default, versioned and tested in the Emulator Suite.
Validate ownership, roles, field types, sizes and immutability. Roll out App Check
through observation before enforcement. Keep deployment secrets in GitHub
Environments or equivalent secret stores.

## 14. Tooling and retrieval

The retrieval hierarchy is:

1. `AGENTS.md`, ADRs and architecture documentation.
2. Exact local search with `rg` and Git.
3. CodeGraph for symbol, import, caller/callee and impact relationships.
4. Nx MCP for project graph, dependencies, boundaries and targets.
5. Firebase/GitHub MCP for external services.

CodeGraph and Nx ProjectGraph are complementary. CodeGraph answers
symbol/file/call/import questions; Nx answers project/library dependency and
boundary questions. Neither replaces normal search or documentation.

CodeGraph is configured outside the repository, uses local structural indexing,
and must ignore generated artifacts. No hosted graph, vector database, embedding
service or generic RAG layer is part of this architecture.

## 15. Accepted decisions and sources

- [ADR-0001: Angular, Nx and Angular Material](../adr/0001-angular-nx-material.md)
- [ADR-0002: Firebase free-first](../adr/0002-firebase-free-first.md)
- [ADR-0003: Static rendering, Hosting and PWA](../adr/0003-rendering-hosting-pwa.md)
- [ADR-0004: Gradual Nx modularity](../adr/0004-nx-modularity.md)
- [ADR-0005: Signals-first state](../adr/0005-state-management.md)
- [ADR-0006: Offline persistence](../adr/0006-offline-persistence.md)
- [ADR-0007: Testing and runtime data boundaries](../adr/0007-testing-and-runtime-boundaries.md)
- [ADR-0008: Local structural CodeGraph retrieval](../adr/0008-local-codegraph-retrieval.md)

Official references include [Angular Service Worker](https://angular.dev/ecosystem/service-workers),
[Angular prerendering](https://angular.dev/guide/prerendering),
[Nx module boundaries](https://nx.dev/docs/features/enforce-module-boundaries),
[Firestore offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline),
[Firestore listener metadata](https://firebase.google.com/docs/firestore/query-data/listen),
[Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite),
[Firebase Hosting Preview Channels](https://firebase.google.com/docs/hosting/test-preview-deploy),
[NgRx Signal Store](https://ngrx.io/guide/signals/signal-store),
[Spectator](https://github.com/ngneat/spectator),
[Zod](https://zod.dev/) and [CodeGraph](https://github.com/codegraph-ai/CodeGraph).
