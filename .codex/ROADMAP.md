# Technical Evolution Roadmap

This is a technical sequencing roadmap, not a product feature commitment. Each
step is conditional on a real requirement and should add only the boundaries it
needs.

## 1. Bootstrap

Keep one Nx application, shared tooling, PWA shell, Codex documentation and
neutral retrieval. No empty domain libraries. Risk: bootstrap architecture can
become ceremonial if extraction happens before ownership exists.

Expected ADRs: only changes to the accepted baseline or tooling policy.

## 2. Establish an Aquarium

Implement the accepted first use case: an authenticated keeper establishes one
private, durable Aquarium with a name. The slice requires Authentication,
Firestore, Emulator Suite, Security Rules, fail-closed configuration and focused
unit/integration tests. It does not require public presentation, domain offline,
App Check, E2E, Display, System, Equipment or Livestock.

## 3. Record and review the core loop

Validate low-friction Measurements, Observations and focused history after their
units, provenance, correction and retention semantics are accepted. Timeline is
a later review model, not a prerequisite for establishment.

## 4. Care work

Discover Maintenance, Water Change, Feeding, Task and Reminder semantics before
choosing events, history behavior or offline classification.

## 5. Livestock and Equipment

Add Fish and Coral only after Aquarium ownership is stable. Impact: historical
identity, transfer rules, UI composition and likely new feature/data-access code.
Risk: premature taxonomy and grouping complexity.

## 6. Public presentation and portability

Accept a publication use case before exposing Aquarium information. Accept export,
import or restoration only after their scope, authorization and recovery semantics
are defined.

## 7. Offline capability

Classify a concrete operation as offline-safe before introducing persistent cache,
trusted-device consent, synchronization UX or conflict handling.

## 8. Automation

Add Controllers and Rules only after safety, authorization, audit and online/offline
semantics are explicit. Impact: stronger ports, adapters and operational controls.
Risk: unsafe actions and hidden coupling to vendor devices.

## 9. Notifications

Add Alerts and notification delivery after alert semantics and user consent are
defined. Impact: background infrastructure, preferences and delivery failure
handling. This may require a separate cost and security decision.

## 10. Analytics and Timeline

Add derived reports and Timeline projections once source events and measurements
are trustworthy. Impact: read models and bounded queries. Do not make analytics
the source of truth.

## 11. AI

Consider AI only after permissions, provenance, history, privacy and evaluation
criteria are mature. It must assist rather than silently alter domain truth.
This phase is explicitly future and does not justify AI infrastructure today.
