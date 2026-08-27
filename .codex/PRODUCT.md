# Product contract

## Current product model

TankOS helps authenticated keepers operate one or more private Aquariums.
The first useful loop is: establish/select an Aquarium, record evidence, review
history and plan or complete care. Public presentation, collaboration,
automation, AI, advanced analytics and device input require explicit scope.

The UX is mobile-first, calm, accessible and evidence-first. Loading, empty,
validation, failure and success states are intentional. Material/CDK is the
default UI foundation.

## Accepted domain directions

- Aquarium is a managed system, not a mutually exclusive freshwater/marine
  type. Internal connected components share its system boundary.
- An Aquarium may have multiple keeper members. The creator, membership roles
  and capability permissions must be modelled explicitly when that use case is
  implemented; a single-owner assumption is not valid.
- Properties/ParameterDefinitions are global, versioned and administrator
  managed; keepers select which definitions their Aquariums use.
- Units are independent global contracts. Measurement transformations may need
  method and contextual parameters; those semantics belong to Measurements.
- Batch operations are asynchronous, resumable, observable and reusable; their
  execution engine is technical infrastructure, not an Aquarium relationship.

## Status vocabulary

- **Accepted:** may be specified and implemented within its boundary.
- **Candidate:** hypothesis; creates no implementation commitment.
- **Pending:** unresolved decision or evidence.
- **Future:** deliberately outside the current slice.

Detailed accepted specifications, parameter, system and batch contracts are
preserved under [`archive/product/`](archive/product/) and should be consulted
only for the affected concept.
