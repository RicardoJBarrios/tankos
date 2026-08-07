# Use Cases

This document distinguishes accepted and candidate discovery. A candidate item
creates no invariant, aggregate, event, screen, API or persistence design.

## Accepted: Establish an Aquarium

- **Actor:** an authenticated keeper; collaboration is deferred.
- **Goal:** establish one private, durable Aquarium with a name.
- **Main flow:** the keeper supplies a name and the system establishes the root
  Aquarium when the current product limit permits it.
- **Deferred:** Display, System, technical setup, public presentation and shared
  management.
- **Event:** `AquariumEstablished`.

## Record an observation or measurement

- **Actor:** an authorized person or a future device integration.
- **Goal:** capture information relevant to an Aquarium context.
- **Main flow:** input is identified, validated and recorded with its relevant
  time and provenance when those concepts are required.
- **Variants:** manual entry, imported device input, correction and offline work
  are unresolved.
- **Constraints:** units, quality, correction semantics and synchronization
  class are unknown.
- **Candidate events:** `ObservationRecorded`, `MeasurementRecorded`.

## Plan and complete care work

- **Actor:** an authorized person.
- **Goal:** plan or record care work related to an Aquarium, System or Equipment.
- **Main flow:** the actor records an intention or completed work; the resulting
  state and history semantics are to be discovered.
- **Variants:** recurrence, delegation, cancellation, Water Change and Feeding
  are not yet specified.
- **Constraints:** authorization, auditability and offline behavior are pending.
- **Candidate events:** `TaskPlanned`, `MaintenanceCompleted`.

## Manage Livestock or Equipment

- **Actor:** an authorized person.
- **Goal:** keep the relevant care context accurate.
- **Main flow:** the actor records or changes an association with an Aquarium.
- **Variants:** groups, transfers, shared equipment and lifecycle history are
  unresolved.
- **Constraints:** identity, ownership and history rules are pending.
- **Candidate events:** `LivestockRegistered`, `EquipmentAssociated`.

## Discovery rule

For every candidate use case, document the actor, goal, main flow, variants,
constraints and business events before deciding aggregates, interfaces, routes,
Firestore collections or Nx libraries.
