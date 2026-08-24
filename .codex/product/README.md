# Product Discovery

This directory contains product-discovery material. It does not replace the
Vision, the Ubiquitous Language or accepted specifications.

## Evidence status

- **Accepted:** supported by an explicit product decision and safe to specify.
- **Candidate:** a useful hypothesis to validate; it must not create code,
  rules, roles, data structures or delivery commitments by itself.
- **Pending:** a question with insufficient evidence.

Read product material in this order: Vision, Glossary, mental model, capability
map, [product principles](PRODUCT_PRINCIPLES.md),
[UX philosophy](UX_PHILOSOPHY.md), user journeys, specifications, aggregate
hypotheses, domain model and events. Architecture and persistence follow that
sequence.

[`MENTAL_MODEL.md`](MENTAL_MODEL.md) defines the accepted conceptual distinction
between the TankOS product, the Aquarium aggregate root and application context.
It records open behavior questions but does not replace a one-use-case
specification.

[`UX_IMPLEMENTATION_PATH.md`](UX_IMPLEMENTATION_PATH.md) sequences the accepted
mobile-first Material UX migration into small, independently verifiable phases.
Use it after the product principles and UX philosophy when planning presentation
or navigation work.

[`CORAL_MASTERY_IMPROVEMENT_PLAN.md`](CORAL_MASTERY_IMPROVEMENT_PLAN.md)
records the 2026-08-20 comparative audit of Coral Mastery, all observed gaps and
an agent-drafted candidate sequence. It is a discovery and planning guide, not
authorization to implement any unselected capability.

[`AQUARIUM_INTELLIGENCE_VISION.md`](AQUARIUM_INTELLIGENCE_VISION.md) evaluates
the longer-horizon proposals for an Aquarium Digital Model, evidence
relationships, computer vision, quantitative scenarios, IoT, spatial planning
and integrated assistance. It preserves original proposals, terminology
alternatives, consequences, research contracts and an agent-drafted sequence;
none of those are user decisions or feature commitments.

[`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md) is the exhaustive,
unfiltered register of gathered product ideas. Every entry remains pending an
explicit user/product-owner decision; agent assessments and risk notes are not
acceptance, rejection, prioritization or scope decisions.

[`PARAMETER_CONFIGURABILITY_PLAN.md`](PARAMETER_CONFIGURABILITY_PLAN.md)
consolidates the current priority around configurable measurable properties:
Parameter definitions, Aquarium profiles, custom definitions, dependent reads,
data compatibility and the decision gates required before implementation.

[`PARAMETER_DEFINITION_ARCHITECTURE_REVIEW.md`](PARAMETER_DEFINITION_ARCHITECTURE_REVIEW.md)
audits the accepted `ParameterDefinition` architecture and lists the remaining
identity, version, snapshot and FIWARE decisions that must be closed before
implementation.

[`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md) is
the authoritative final domain specification for identity, versions, global
catalogue visibility, Aquarium selection, lifecycle, snapshots and
interoperability.

[`PARAMETER_DEFINITION_FIRESTORE_FIWARE_AUDIT.md`](PARAMETER_DEFINITION_FIRESTORE_FIWARE_AUDIT.md)
contains the expert technical audit of Firestore constraints, trusted writes,
version concurrency, dynamic migration, Unit/method registries and the FIWARE
NGSI-LD adapter boundary.

[`AQUARIUM_SYSTEM_MODEL.md`](AQUARIUM_SYSTEM_MODEL.md) defines the Aquarium as
one managed system containing containment, sump, refugium, treatment,
technical and biological components, with Measurements targeting the complete
system by default or a specific component when supplied.

[`AQUARIUM_SYSTEM_VOCABULARY.md`](AQUARIUM_SYSTEM_VOCABULARY.md) separates
W3C/FIWARE/SOSA/SSN terms from English aquarium-hobby terminology and defines
the system-boundary rule for display tanks, sumps, refugia and quarantine tanks.

[`BATCH_OPERATIONS_FINAL_SPEC.md`](BATCH_OPERATIONS_FINAL_SPEC.md) is the
authoritative final specification for asynchronous, resumable, partial-failure
batch operations and their Firebase/Firestore execution boundary. It records
`BatchOperations` as a domain of its own with a reusable execution engine.
