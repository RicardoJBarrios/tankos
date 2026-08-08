# Product and Technical Evolution Roadmap

This roadmap sequences product capabilities and their enabling technical work.
It is not a feature commitment. Each step is conditional on a real requirement
and should add only the boundaries it needs. See the [capability map](product/CAPABILITY_MAP.md)
for the product grouping; this document does not define bounded contexts.

## 1. Bootstrap

Keep one Nx application, shared tooling, PWA shell, Codex documentation and
neutral retrieval. No empty domain libraries. Risk: bootstrap architecture can
become ceremonial if extraction happens before ownership exists.

Expected ADRs: only changes to the accepted baseline or tooling policy.

## 2. Aquarium Management — current capability

The current baseline contains the accepted increments `Establish Aquarium`,
`List My Aquariums`, `Select Aquarium` and `Record Observation`. Together they
establish a private Aquarium context and the first durable qualitative record.
They do not require public presentation, domain offline, App Check, E2E,
Display, System, Equipment, Livestock or Timeline.

## 3. Measurements — current increment, future expansion

`Record Measurement` is accepted and implemented as the first increment of this
capability. Its closed Parameter catalogue, units, provenance, ownership and
append-only semantics are defined in the measurement language and specification.
Do not infer future measurement behavior from the Observation model. Parameter
history is a read capability, not a prerequisite for recording the first
measurement. Future measurement increments still require decisions about
correction, retention and broader ownership semantics.

## 4. Care

Discover Maintenance, Water Change, Feeding, Task and Reminder semantics before
choosing events, history behavior or offline classification. Split planning,
execution and review only when their accepted use cases need separate behavior.

## 5. Timeline

Add Timeline review and filters only after source records and their ordering,
visibility and retention rules are trustworthy. Timeline is a projection, not a
new source of truth.

## 6. Livestock and Equipment

Add Fish and Coral only after Aquarium ownership is stable. Impact: historical
identity, transfer rules, UI composition and likely new feature/data-access code.
Risk: premature taxonomy and grouping complexity.

## 7. Public presentation and portability

Accept a publication use case before exposing Aquarium information. Accept export,
import or restoration only after their scope, authorization and recovery semantics
are defined.

## 8. Offline capability

Classify a concrete operation as offline-safe before introducing persistent cache,
trusted-device consent, synchronization UX or conflict handling.

## 9. Automation

Add Controllers and Rules only after safety, authorization, audit and online/offline
semantics are explicit. Impact: stronger ports, adapters and operational controls.
Risk: unsafe actions and hidden coupling to vendor devices.

## 10. Notifications

Add Alerts and notification delivery after alert semantics and user consent are
defined. Impact: background infrastructure, preferences and delivery failure
handling. This may require a separate cost and security decision.

## 11. Analytics

Add derived reports and Timeline projections once source events and measurements
are trustworthy. Impact: read models and bounded queries. Do not make analytics
the source of truth.

## 12. AI Assistance

Consider AI only after permissions, provenance, history, privacy and evaluation
criteria are mature. It must assist rather than silently alter domain truth.
This phase is explicitly future and does not justify AI infrastructure today.
