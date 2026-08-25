# Product and Technical Evolution Roadmap

This roadmap sequences product capabilities and their enabling technical work.
It is not a feature commitment. Each step is conditional on a real requirement
and should add only the boundaries it needs. See the [capability map](../product/CAPABILITY_MAP.md)
for the product grouping; this document does not define bounded contexts.

The cross-capability, mobile-first presentation migration is sequenced in the
[UX implementation path](../product/UX_IMPLEMENTATION_PATH.md). That path may
reorganize navigation and composition, but it does not authorize deferred domain
capabilities.

The candidate improvements identified through the Coral Mastery comparison are
sequenced in the
[Coral Mastery improvement plan](../product/CORAL_MASTERY_IMPROVEMENT_PLAN.md).
Each candidate still requires an accepted use-case specification before it may
change domain behavior, persistence, notifications, image handling or AI.

Longer-horizon ideas involving an Aquarium Digital Model, evidence
relationships, vision, quantitative scenarios, IoT and spatial planning are
classified in the
[Aquarium Intelligence strategic vision](../product/AQUARIUM_INTELLIGENCE_VISION.md).
That document preserves research proposals and their consequences. Its
classifications and sequence are agent analysis, not product-owner decisions.

No idea is removed by those plans. The exhaustive
[product idea register](../product/PRODUCT_IDEA_REGISTER.md) preserves all gathered
proposals, including conflicting, commercial, experimental and previously
agent-filtered alternatives, until the user/product owner explicitly decides
their status and scope.

The current planning priority is configurable measurable properties. The
[Parameter configurability master plan](../product/PARAMETER_CONFIGURABILITY_PLAN.md)
consolidates the public `ParameterDefinition` catalogue, Aquarium profile,
custom-definition lifecycle and dependent-consumer work. Its accepted
direction supersedes the legacy closed-catalogue wording in older Measurement
specifications.

## 1. Bootstrap

Keep one Nx application, shared tooling, PWA shell, Codex documentation and
neutral retrieval. No empty domain libraries. Risk: bootstrap architecture can
become ceremonial if extraction happens before ownership exists.

Expected ADRs: only changes to the accepted baseline or tooling policy.

## 2. Aquarium Management — current capability

The current baseline contains the accepted increments `Establish Aquarium`,
`List My Aquariums`, `Select Aquarium`, `Record Observation` and `List
Observations`. Together they establish a private Aquarium context and the
first durable qualitative evidence loop.
They do not require public presentation, domain offline, App Check, E2E,
Aquarium components, Equipment, Livestock or Timeline.
`Configure Aquarium Timezone` is implemented as the one-way configuration of
legacy Aquariums without a canonical timezone. Changing an existing timezone
remains a separate future decision.

This increment closes the legacy browser-local fallback without opening
timezone editing semantics.
`Configure Aquarium Location` and `Review Local Weather` are implemented as a
Spark-first contextual increment. Approximate location is owner-configured;
weather remains an ephemeral cached external read and is not domain history.

The Aquarium operational surface is now classified as a Dashboard by
responsibility. A scoped `AquariumDashboardStore` coordinates shared context
and configuration state, while section-only state remains local when it has no
shared consumer. Runtime external HTTP uses Angular `HttpClient`.

## 3. Measurements — current capability

`Record Measurement` is accepted and implemented as the first increment of this
capability. Its Parameter catalogue, units, provenance, ownership and
append-only semantics are defined in the measurement language and specification.
`List Measurements` is implemented as a bounded read of the existing
collection, not a universal Timeline. A future current-state read may use a
derived materialized model once its first consumer is accepted; it must not
replace the historical collection or introduce a second source of truth.
Future increments still require decisions about correction, retention and
broader ownership semantics.

`Review Measurement Age` is implemented: it shows the elapsed age of the latest
known value without introducing freshness thresholds. It remains independent of
Parameter Status.

`Configure Parameter Targets` is implemented as optional Aquarium-owned
operating intervals without product-wide biological defaults; see
[`configure-parameter-targets.md`](../specifications/configure-parameter-targets.md).
`Review Parameter Status` is implemented in
[`review-parameter-status.md`](../specifications/review-parameter-status.md). It
compares latest evidence with keeper-owned targets without freshness thresholds
or biological interpretation; the result remains derived in the Workspace
Store and is not persisted.

## 3.1 Timeline — accepted first increment

`Review Recent Timeline` is the first bounded Timeline increment. It combines
the existing Observation, Measurement and Care Work read sources for recent
contextual review without introducing a Timeline collection or changing source
truth. Complete pagination and materialization remain deferred.

## 4. Care

`Record Care Work` and `List Care Work` are implemented as bounded historical
Care records. Planning, completing and cancelling concrete Planned Care Work
are also implemented without a generic Task lifecycle. Weekly recurring Care
is implemented as a Care-specific calendar definition plus one concrete
outstanding occurrence. `Review Due Care` is implemented as a derived
presentation of overdue and upcoming plans. Aquarium-local time presentation
is now an implemented cross-cutting policy. Reminders, monthly rules,
multiple weekdays, editing, pause, notifications and Maintenance subtypes
remain future decisions. Completed Care Work is included in the bounded recent
Timeline read but remains its own source of truth.

## 5. Timeline

The accepted first increment is a bounded recent review over trustworthy source
records. Complete Timeline review and filters require separate pagination,
retention and consistency decisions. Timeline remains a projection, not a new
source of truth.

## 6. Livestock and Equipment

The first Livestock increment is accepted now that Aquarium ownership is stable:
individuals and groups can be associated, transferred between owned Aquariums
and soft-removed while preserving traceability. Implement it before Equipment;
keep taxonomy, broader lifecycle states and source-record associations deferred.
Equipment remains a separate future decision because its ownership, state and
sharing rules are different.

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

Add Alerts and notification delivery only after alert semantics, user consent
and trusted background delivery are accepted. Browser-visible awareness is not
notification delivery. Impact: background infrastructure, preferences, token
lifecycle and delivery failure handling. This may require a separate cost and
security decision.

## 11. Analytics

Add derived reports and Timeline projections once source events and measurements
are trustworthy. Impact: read models and bounded queries. Do not make analytics
the source of truth.

## 12. AI Assistance

Consider AI only after permissions, provenance, history, privacy and evaluation
criteria are mature. It must assist rather than silently alter domain truth.
This phase is explicitly future and does not justify AI infrastructure today.
