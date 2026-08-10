# Domain Model Discovery

This document records the current language and relationships for discovery.
`Aquarium` is the accepted aggregate root; this document does not declare its
invariants, cardinalities or persistence ownership.
The [candidate use cases](use-cases.md) and
[aggregate hypotheses](aggregate-hypotheses.md) must provide the evidence before
any item becomes accepted.

## Concepts to refine

| Area                       | Current language                                            | Questions still open                                                                           |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Aquarium                   | The managed care system and aggregate root.                 | Required attributes, ownership, sharing, and its relationship to Display and System.           |
| Livestock                  | Fish, Coral and other organisms associated with care.       | Individual versus group, transfers, taxonomy and lifecycle.                                    |
| Equipment                  | A physical or logical device used in care.                  | Ownership, sharing, installation, state and safety.                                            |
| Care work                  | An intentional action already performed for an Aquarium.    | Relationship to planned work, Maintenance, Water Change and Feeding; recurrence and lifecycle. |
| Recorded information       | Measurement, Observation, Parameter, Sensor and Inspection. | Provenance, units, quality, corrections and required parameters.                               |
| Automation                 | Rules, inputs, recommendations or actions.                  | Authority, safety, audit, retries and offline behavior.                                        |
| Notifications              | Alert, Reminder and delivery.                               | Consent, severity, acknowledgement, retention and delivery policy.                             |
| Identity and collaboration | Authentication, authorization, ownership and collaboration. | Membership model, permissions, invitations and account deletion.                               |

## Candidate relationships

```text
Person --manages or collaborates on?--> Aquarium
Aquarium --relates to?--> Livestock / Equipment / care work / recorded information
Sensor --may produce?--> Measurement
Automation --may evaluate?--> recorded information or Event
Alert or Reminder --may inform?--> Person
```

Question marks are intentional. These are semantic prompts for discovery, not
accepted ownership, aggregate or storage boundaries.

## Accepted Observation boundary

For the accepted `Record an Observation` use case, `Observation` is an
independently persisted aggregate. It references `AquariumId` but does not
belong to the Aquarium aggregate's consistency boundary. Creating an
Observation therefore does not require loading or mutating the Aquarium
aggregate; Firestore Rules verify that the referenced Aquarium is owned by the
authenticated keeper.

This boundary keeps unbounded historical evidence from growing the Aquarium
aggregate. Timeline remains a future chronological projection of durable Facts,
not a second source of truth. Measurements and Care Work may use related but
independent boundaries when their accepted use cases define them.

## Accepted Care Work boundary

For `Record Care Work`, Care Work is an independently persisted aggregate root
and durable Fact. It references `AquariumId` without belonging to the Aquarium
aggregate consistency boundary. It describes an intentional action already
performed, not an Observation or planned Task. `performedAt` and `recordedAt`
remain distinct. The first slice uses free text and manual provenance; it does
not establish Maintenance, Water Change, Feeding, recurrence or correction as
shared domain types.

## Accepted Weekly Recurring Care boundary

`RecurringCarePlan` is an independently persisted, Care-specific aggregate. It
references `AquariumId`, defines one weekly local-calendar intention, and owns
the relationship to at most one outstanding `PlannedCareWork`. The occurrence
remains a concrete independent planned intention; `CareWork` remains a separate
durable Fact created only by completion. Neither recurrence definitions nor
future occurrences are Timeline facts.

The Aquarium owns the authoritative IANA time zone for calendar Care. It is a
property needed when the first recurrence is established, not a Keeper or
browser preference. Recurrence does not turn Aquarium into the transactional
owner of its planned or completed Care records.

An Aquarium may also own one approximate `AquariumLocation` containing rounded
coordinates and a locality label. Configuration is a one-way owner-scoped
transition for the current capability. Local Weather is an infrastructure-backed
ephemeral read model and never becomes an Aquarium Measurement or Timeline
source.

## Accepted Parameter Target boundary

`ParameterTarget` is a value in Aquarium configuration, not a Measurement,
Fact, Domain Event or independent Aggregate. The configuration slot is keyed by
`AquariumId + ParameterId` and contains one optional canonical interval with
finite non-negative values and `minimum <= maximum`. It does not alter
Measurement validity or historical meaning. Absence means that a future status
read is `uninterpreted`.

The five-slot target map is bounded and persisted with the Aquarium document.
The `AquariumWorkspaceStore` may expose it as shared Dashboard configuration.
`Parameter Status` is an accepted application read model that derives a
comparison from the latest known Measurement and explicit target without
persisting status. This does not turn Aquarium into generic CRUD or make
Measurement part of the Aquarium transaction boundary.

## Acceptance rule

Promote a relationship to a domain rule only when a validated use case states
the command, actor, invariant, consistency requirement and resulting business
event. Record durable cross-cutting consequences in an ADR.
