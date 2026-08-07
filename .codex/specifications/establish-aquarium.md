# Accepted: Establish an Aquarium

## Actor

An authenticated aquarium keeper. Collaboration roles are not part of this use
case.

## Objective

Create a durable, private Aquarium context that the keeper can recognize and
return to for later care records.

## Preconditions

The keeper is authenticated. The current product version has no Aquarium yet.
`Maximum Aquariums = 1` is an initial product constraint, not a domain rule.

## Main flow

The keeper provides an Aquarium name. The system establishes the Aquarium root,
associates it with the authenticated keeper, keeps it private by default and
confirms it as the context for later care information.

## Variants

Technical setup, Display, System, Equipment, Livestock, public presentation and
shared management are deferred. A future product version may allow additional
Aquariums without changing the domain model.

## Expected errors

The name is empty after trimming surrounding whitespace; the keeper is not
authenticated; or an Aquarium already exists under the current product limit.

## Domain events

`AquariumEstablished` is the single durable Fact classified as a Domain Event:
the private aggregate root became available for care. It occurs exactly once per
Aquarium lifecycle after successful establishment. It is immutable; retries,
renaming, publication, archival and future multi-Aquarium support do not create
another occurrence. Future deletion or retention policy may affect availability
of historical records, but does not alter what occurred.

## Acceptance criteria

- The authenticated keeper can establish one private Aquarium using only a name.
- The resulting Aquarium can be identified as the context for subsequent care.
- No Display, System, Equipment, Livestock, technical configuration or public
  information is required or created.
- A second establishment attempt is rejected while `Maximum Aquariums = 1` is
  active.
- Successful establishment produces an attributable durable Fact and the
  `AquariumEstablished` Domain Event; they are one occurrence, not two records.
- The use case is online-required; it does not promise offline creation.

## Definition of Ready assessment

| Mandatory criterion | Result | Evidence |
| --- | --- | --- |
| Accepted status, actor and value | Ready | Title, Actor and Objective. |
| Scope, preconditions, outcome and failures | Ready | Main flow, Variants and Expected errors. |
| Terminology, rules and invariants | Ready | `Aquarium`, `AquariumId`, `AquariumName`, one private Aquarium and `AquariumEstablished` are defined in the glossary and domain rules. |
| Persistence, authorization and offline class | Ready | Private authenticated persistence, transactionally enforced product limit and `online-required` are defined in architecture policies. |
| ADRs, architecture and validation path | Ready | ADR-0002, ADR-0006 and ADR-0007 plus the target architecture define the required boundaries and tests. |
| Non-blocking questions | Ready | Collaboration, public presentation, deletion policy and offline creation are explicitly deferred. |
