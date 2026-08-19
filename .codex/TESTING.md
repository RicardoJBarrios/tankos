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
Context, the three-source merge, effective-time semantics, deterministic ties,
the bounded top-N result and whole-read failure behavior. Its adapter tests
verify the bounded Observation, Measurement and Care Work source queries against the
Emulator Suite; source parsing remains covered by the existing adapter boundary
tests. Spectator tests cover missing context, loading, mixed results including Care Work, empty and
recoverable error states. The canonical Playwright journey verifies that a
recorded Observation, Measurement and Care Work action are all visible in recent activity.

`Record Care Work` adds pure domain tests for UUID identity, trimmed non-empty
description, performed/recorded timestamps and manual provenance. Application
tests cover authentication, Active Context, validation, successful recording
and infrastructure failures. Its Firebase adapter test verifies the
owner-attributed document, both timestamps and provenance through the SDK.
Rules tests cover authorized creation and owner reads and queries while
rejecting unauthenticated, cross-owner and spoofed-owner access. Spectator tests
cover missing context, validation, pending, success and recoverable error
states. The canonical Playwright journey records a completed Care Work action
through the UI and verifies it in the current Timeline read model.

`List Care Work` adds application coverage for authentication, Active Context,
the bounded recent-history request, empty results and infrastructure failures.
Its adapter integration coverage reuses the existing Care Work reader against
the Emulator Suite to verify owner/Aquarium scope, canonical ordering, the
capability-local limit, mapping and malformed-document rejection. Rules tests
remain focused on the existing identical owner query shape. Spectator tests
cover missing context, loading, empty, results, recoverable errors and the
navigation to recording Care Work. The canonical Playwright journey records a
Care Work action, opens `Cuidados recientes` and verifies that the action is
visible there.

`Plan Care Work` adds domain and application tests for the independent planned
intention, Active Context, validation and infrastructure failures. Its separate
Firestore adapter integration tests verify the `plannedCareWorks` collection,
ordering, timestamp mapping and malformed-document rejection. Rules tests cover
owner-only queries and reject anonymous, cross-owner and spoofed-owner writes.
Spectator tests cover no context, validation, pending, success, empty, results
and recoverable errors. The canonical Playwright journey plans care work and
verifies it in the planned-care list. `Complete Planned Care Work` adds
application, UI and emulator coverage for the atomic creation of a Care Work
and removal of its plan; Rules tests reject anonymous and cross-owner
deletion, unrelated and cross-Aquarium completion batches, mismatched source
data and altered descriptions, while accepting owner cancellation and the
matching atomic batch.
Playwright verifies the completed fact in the Care Work list and Timeline.

`Review Upcoming Care Preview` reuses the Planned Care reader with a
capability-local limit of three. Its application tests verify Active Context,
the preview limit and the existing canonical ordering contract. Spectator tests
cover no context, loading, empty, planned items, planned-date presentation and
section-level failures. The canonical Playwright journey verifies the empty
preview, a newly planned item after returning to the Workspace, navigation to
the full planned-care list and its disappearance after completion. It does not
duplicate Rules or adapter authorization coverage.

`Review Due Care` adds pure application coverage for future, exact-now and
overdue classification with an explicit `now`. Spectator tests cover the
`Cuidados pendientes` heading, overdue and pending text, preserved absolute
timestamps, empty and failure states, and the full planned-care list. The
canonical Playwright journey uses a deterministic past timestamp and verifies
the overdue meaning through both surfaces. It does not add a query, persistence
or Rules test because due-awareness derives from already-loaded Planned Care.

Aquarium-local time presentation uses deterministic `Intl.DateTimeFormat` tests
with explicit IANA zones, including Atlantic/Canary, travel-zone comparisons,
the legacy no-zone fallback and a DST transition. Affected Angular surfaces
receive the resolved Aquarium timezone explicitly; their `datetime` attributes
remain absolute ISO instants. Timezone tests must not rely on the CI host zone.

`Configure Aquarium Timezone` adds application coverage for authentication,
Active Context, IANA validation and the one-way already-configured rejection.
Its emulator adapter coverage verifies the owner-scoped one-field update,
malformed timezone rejection and first-writer transaction behavior. Rules tests
cover owner, anonymous, cross-owner, already-configured and extra-field
rejection paths. Angular and Playwright cover browser-timezone proposal,
explicit confirmation, pending/success states and the configured Workspace
presentation. No test rewrites historical instants or Care data.

`Cancel Planned Care Work` adds application coverage for authentication,
Active Context and the owner-scoped cancellation port. Its adapter integration
coverage verifies deletion without creating a Care Work. Rules tests cover
owner cancellation, anonymous/cross-owner denial and preservation of the
completion integrity checks. Spectator tests cover confirmation, pending,
success, declined confirmation and recoverable failure. The canonical
Playwright journey cancels one plan, verifies its removal from the list and
Workspace, then completes a separate plan to protect both branches.

`Review Current Measurements` uses direct bounded queries against the immutable
Measurement history. Application tests cover authentication, Active Context,
missing Parameters and infrastructure failure. Adapter integration covers the
canonical latest query and malformed data; Rules cover owner, anonymous and
cross-owner requests. Spectator covers loading, values, missing values and
errors. The pure `measurementAgeFor` tests cover deterministic seconds,
minutes, hours, days, future and invalid timestamps. Current Measurements and
Measurement history reuse that helper; their Spectator tests verify age text,
missing-data semantics and preservation of the absolute timestamp. The
canonical Playwright journey records a Measurement, returns to the Workspace
and observes its latest value.

`Configure Aquarium Location and Review Local Weather` adds domain and
application coverage for coordinate bounds, rounding, ownership and Active
Context. Its emulator adapter test verifies owner-scoped configure-only
persistence. Rules cover valid owner configuration, anonymous/cross-owner
rejection and invalid coordinates. Open-Meteo adapters use deterministic
fixtures for geocoding, Celsius weather mapping and malformed responses; the
in-memory reader verifies its fifteen-minute TTL. Spectator covers search,
explicit selection and already-configured state. The Playwright journey stubs
both provider endpoints and verifies configuration plus rendered local weather;
CI never calls the live provider.

`Configure Parameter Targets` adds domain tests for the five closed Parameters,
finite non-negative intervals and the exact-value boundary. Application and
Store tests cover authenticated Active Context mutations, configure/edit/remove
behaviour, state preservation on failure and Aquarium switches. Emulator adapter
tests verify map persistence, replacement, removal, concurrent distinct-slot
updates and malformed document rejection; Rules tests cover owner-only valid
updates and removal plus anonymous, cross-owner, unknown-key, malformed-field
and combined-update rejection. Spectator covers unconfigured and configured
rows, canonical Units, interval validation, removal and no-context recovery.
The canonical Playwright journey configures, edits and removes a target through
the visible UI, then configures a temperature target, records one Measurement
inside it, verifies `Dentro del objetivo`, edits the same target and verifies
`Por debajo del objetivo` without recording another Measurement, and finally
removes the target and verifies `Sin objetivo configurado`.

Shared Parameter History reuses the immutable Measurement documents for a
delegated authenticated guest. The shared-access adapter and Rules are
covered by the existing Firebase Emulator permission flow; the browser journey
verifies parameter history navigation, the bounded first page and immediate
read denial after revoking the `measurements` grant. The shared UI remains
read-only and does not expose correction actions.

The Aquarium Dashboard uses a scoped Signal Store for cross-section context and
configuration state. It is also the single owner of Current Measurement loading,
errors and derived `CurrentParameterState` values. Store tests verify selected-
Aquarium loading, no-context recovery, independent Measurement failure, target
join, target edit/removal recomputation without refetching and reset behavior.
The presentational Current Measurements section covers loading, error, latest
value, canonical Unit, target interval, comparison text, age, absolute time,
missing target, missing evidence and navigation to target configuration.
Open-Meteo adapter tests use Angular's `provideHttpClientTesting()` and
`HttpTestingController`; they verify requests, query parameters, malformed
responses, provider errors and transport timeout errors without live HTTP.

## Browser journeys

`pnpm nx e2e veril` runs the canonical Chromium journeys through visible UI
against the local Auth and Firestore emulators. Playwright starts the same local
development environment as `pnpm dev` when needed; it never targets a deployed
Firebase project. Each test receives a fresh browser context and establishes its
own Emulator keeper account and data through the UI, without shared fixtures or
production exports.

The suite protects the complete keeper loop (establish, list, select, record an
Observation and record a Measurement), including the same-tab refresh that
restores the keeper session and owner-validated Active Context. It also covers
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
