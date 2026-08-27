# Product documentation

Use this directory selectively. It contains accepted product contracts,
candidate discovery and future proposals; only accepted material may authorize
implementation.

## Canonical product sources

- Product model and principles:
  [`MENTAL_MODEL.md`](MENTAL_MODEL.md), [`PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md),
  [`UX_PHILOSOPHY.md`](UX_PHILOSOPHY.md).
- Capabilities and journeys: [`CAPABILITY_MAP.md`](CAPABILITY_MAP.md),
  [`USER_JOURNEYS.md`](USER_JOURNEYS.md), [`FEATURE_MATRIX.md`](FEATURE_MATRIX.md).
- Aquarium system: [`AQUARIUM_SYSTEM_MODEL.md`](AQUARIUM_SYSTEM_MODEL.md) and
  [`AQUARIUM_SYSTEM_VOCABULARY.md`](AQUARIUM_SYSTEM_VOCABULARY.md).
- Measurements and units: [`MEASUREMENT_LANGUAGE.md`](MEASUREMENT_LANGUAGE.md)
  and [`@tankos/units`](../../../libs/units/docs/README.md).
- Accepted ParameterDefinition contract:
  [`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md).
- Accepted batch contract:
  [`@tankos/data-access`](../../../libs/data-access/docs/README.md).
- Current UX delivery sequence:
  [`UX_IMPLEMENTATION_PATH.md`](UX_IMPLEMENTATION_PATH.md).

## Supporting material

- [`PARAMETER_CONFIGURABILITY_PLAN.md`](PARAMETER_CONFIGURABILITY_PLAN.md) is
  the execution map for the configurable-property priority.
- [`PARAMETER_DEFINITION_ARCHITECTURE_REVIEW.md`](PARAMETER_DEFINITION_ARCHITECTURE_REVIEW.md)
  and [`PARAMETER_DEFINITION_FIRESTORE_FIWARE_AUDIT.md`](PARAMETER_DEFINITION_FIRESTORE_FIWARE_AUDIT.md)
  preserve rationale and technical risks; they do not replace the final spec.
- Batch policy is maintained in [`@tankos/data-access`](../../../libs/data-access/docs/README.md).
  preserves the technical review behind the final batch spec.
- [`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md),
  [`AQUARIUM_INTELLIGENCE_VISION.md`](AQUARIUM_INTELLIGENCE_VISION.md) and
  [`CORAL_MASTERY_IMPROVEMENT_PLAN.md`](CORAL_MASTERY_IMPROVEMENT_PLAN.md)
  are candidate/future discovery. They never authorize implementation.
- The remaining files describe privacy, portability, value objects, lifecycle,
  entities and research inputs; consult them only when the task needs them.

## Status vocabulary

- **Accepted:** safe to specify and implement within its boundaries.
- **Candidate:** useful hypothesis; it creates no code, role or data contract.
- **Pending:** unresolved decision or missing evidence.
- **Future:** deliberately outside the current slice.

When a document becomes authoritative, link it here and remove duplicate
normative text from supporting documents.
