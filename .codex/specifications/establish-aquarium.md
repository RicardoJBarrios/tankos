# Accepted: Establish an Aquarium

## Actor

An authenticated aquarium keeper. Collaboration roles are not part of this use
case.

## Objective

Create a durable, private Aquarium context that the keeper can recognize and
return to for later care records.

## Preconditions

The keeper is authenticated. The new Aquarium receives an independent identity
and is not required to be the keeper's first Aquarium.

The authenticated user must carry the Firebase custom claim `isKeeper: true`.
Anonymous Auth and authenticated users without that claim cannot establish an
Aquarium. Account recovery and other identity lifecycle concerns are outside
this use case.

## Main flow

The keeper provides an Aquarium name. The system establishes the Aquarium root,
associates it with the authenticated keeper, keeps it private by default and
confirms it as the context for later care information.

## Variants

Technical setup, Display, System, Equipment, Livestock, public presentation and
shared management are deferred. A future product version may allow additional
Aquariums without changing the domain model.

## Expected errors

The name is empty after trimming surrounding whitespace or the keeper is not
authenticated.

## Domain events

`AquariumEstablished` is the single durable Fact classified as a Domain Event:
the private aggregate root became available for care. It occurs exactly once per
Aquarium lifecycle after successful establishment. It is immutable; retries,
renaming, publication, archival and future multi-Aquarium support do not create
another occurrence. Future deletion or retention policy may affect availability
of historical records, but does not alter what occurred.

## Acceptance criteria

- The authenticated keeper can establish multiple independent private Aquariums,
  each using only a name.
- The resulting Aquarium can be identified as the context for subsequent care.
- No Display, System, Equipment, Livestock, technical configuration or public
  information is required or created.
- A second establishment by the same keeper creates a distinct Aquarium and does
  not alter the first one.
- Successful establishment produces an attributable durable Fact and the
  `AquariumEstablished` Domain Event; they are one occurrence, not two records.
- The use case is online-required; it does not promise offline creation.

## Validation scope

The slice is validated by focused domain and application tests, an Angular
component test, a Firebase SDK repository-adapter integration test against the
Auth and Firestore emulators, and Security Rules integration tests. Browser E2E
remains deferred because this use case is a single component interaction.

## Definition of Ready assessment

| Mandatory criterion                          | Result | Evidence                                                                                                                                        |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted status, actor and value             | Ready  | Title, Actor and Objective.                                                                                                                     |
| Scope, preconditions, outcome and failures   | Ready  | Main flow, Variants and Expected errors.                                                                                                        |
| Terminology, rules and invariants            | Ready  | `Aquarium`, `AquariumId`, `AquariumName`, independent private Aquariums and `AquariumEstablished` are defined in the glossary and domain rules. |
| Persistence, authorization and offline class | Ready  | Private authenticated persistence, owner association and `online-required` are defined in architecture policies.                                |
| ADRs, architecture and validation path       | Ready  | ADR-0002, ADR-0006 and ADR-0007 plus the target architecture define the required boundaries and tests.                                          |
| Non-blocking questions                       | Ready  | Collaboration, public presentation, deletion policy and offline creation are explicitly deferred.                                               |
