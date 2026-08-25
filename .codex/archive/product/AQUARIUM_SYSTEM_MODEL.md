# Aquarium as a System — Domain Model

**Status:** foundational domain model and implementation proposal.

**Vocabulary reference:** [`AQUARIUM_SYSTEM_VOCABULARY.md`](AQUARIUM_SYSTEM_VOCABULARY.md)
contains the standards terms and English hobby terminology used by this model.

**Scope:** model any managed aquarium ecosystem as one system boundary that
can contain physical, technical and biological components. This supports
freshwater, saltwater, brackish, planted, fish, shrimp, snail, coral and mixed
systems without creating a different root aggregate for each hobby category.

## 1. Foundational rule

An Aquarium is a managed system, not only a display tank.

```text
AquariumSystem
  ├── display / containment units
  ├── sump and recirculation units
  ├── refugia and treatment units
  ├── technical components and Devices
  ├── biological zones or subjects
  └── Measurements, Observations and operational evidence
```

A sump, refugium, filter, quarantine chamber or other unit may have its own
identity and Measurements. It is a component when connected to the same water
and system boundary, and a separate AquariumSystem when independently
operated with separate water and lifecycle.

For example, a breeding box inside the display tank or sump is an
`AquariumComponent`. A breeding box operated outside the system with its own
water and lifecycle is a separate `AquariumSystem`. This rule applies to
quarantine, hospital, grow-out and other auxiliary enclosures as well.

The product language may continue to say “Aquarium”. `AquariumSystem` is the
technical model for that managed whole. The existing `AquariumId` is the
natural candidate for the stable system identity.

## 2. Do not encode the hobby as one mutually exclusive type

The following are different classification dimensions and must not be one
large enum:

```text
waterMedium       freshwater | saltwater | brackish | other | unknown
biologicalFocus   fish, coral, shrimp, snail, planted, macroalgae, mixed, ...
operationalRole   display, breeding, quarantine, grow-out, experimental, ...
```

Examples:

| System                 | `waterMedium` | `biologicalFocus`          | `operationalRole` |
| ---------------------- | ------------- | -------------------------- | ----------------- |
| planted community tank | freshwater    | planted, fish              | display           |
| shrimp tank            | freshwater    | shrimp, planted            | display           |
| marine reef            | saltwater     | coral, fish, invertebrates | display           |
| snail breeding tank    | freshwater    | snail                      | breeding          |
| marine quarantine      | saltwater     | fish or coral              | quarantine        |

The classification vocabulary should be controlled and extensible. It must
not make a system invalid merely because a keeper has a new combination.

## 3. System root

The system root owns the identity, keeper boundary and global configuration of
the managed whole:

```text
AquariumSystem
  id                    # existing AquariumId candidate
  schemaVersion
  ownerId
  name
  lifecycle
  waterMedium
  biologicalFocus[]
  operationalRole[]
  timezone?
  location?
  createdAt
  updatedAt
```

`waterMedium` and classifications describe the system. They do not determine
which Parameters may exist. Parameter enablement remains an independent
Aquarium Parameter profile.

## 4. Components and zones

The system contains components. A component is an identity-bearing object or
zone that can be the Feature of Interest of a Measurement:

```text
AquariumComponent
  id
  systemId
  schemaVersion
  componentType
  name
  lifecycle
  parentComponentId?
  fiwareType?
  locationWithinSystem?
  createdAt
  updatedAt
```

Initial `componentType` candidates:

- `containment` — display tank, pond, cage or other water containment;
- `sump` — treatment and recirculation unit;
- `refugium` — biological or plant refugium;
- `quarantine` — isolated containment unit within the managed system;
- `treatment` — filtration, reactor or water-treatment unit;
- `technical` — technical area or non-water equipment zone;
- `biologicalZone` — a meaningful biological area within a containment unit.

These are roles, not aquarium hobby types. A component may have additional
controlled capabilities without changing the system root.

## 5. Part-of and connection relationships

The minimum structural relation is membership in the system:

```text
AquariumComponent.systemId == AquariumSystem.id
```

This is a denormalized NoSQL value, not a foreign key. Future relationships
may describe water or technical topology:

```text
ComponentRelationship
  id
  systemId
  subjectComponentId
  relationshipType       # partOf, receivesWaterFrom, sendsWaterTo, connectedTo
  objectComponentId
  lifecycle
  createdAt
  updatedAt
```

Topology relationships are not required to record a basic aquarium. A sump
can belong to the system before detailed hydraulic connections are modelled.

## 6. Measurement scope

Every Measurement belongs to the AquariumSystem. Its Feature of Interest is:

```text
FeatureOfInterest
  systemId
  componentId?           # absent means the complete system
  zoneId?
  snapshot?
```

The default remains the complete AquariumSystem. A salinity measurement of
the display tank, sump or refugium can target a component without creating a
second aquarium.

The Measurement must preserve the Feature-of-Interest identity and enough
snapshot information to remain interpretable if a component is renamed,
disabled or physically deleted.

## 7. FIWARE alignment

The model uses the closest structure for each semantic role rather than
pretending that every TankOS object has a direct Smart Data Model equivalent:

| TankOS role                   | Closest standard structure               | Use                                       |
| ---------------------------- | ---------------------------------------- | ----------------------------------------- |
| managed water containment    | `FishContainment` when its semantics fit | tank/display/pond-like containment        |
| recirculation/treatment unit | `Sump` when its semantics fit            | sump and treatment component              |
| water-quality evidence       | `WaterQualityObserved` where applicable  | observed water-quality values             |
| measured value               | NGSI-LD `Property`                       | value, `unitCode`, `observedAt`           |
| component/system relation    | NGSI-LD `Relationship`                   | `object` points to a stable URI           |
| measurement target           | Feature of Interest relationship         | system, component or zone                 |
| TankOS system catalogue       | TankOS extension                          | lifecycle and Aquarium-specific semantics |

The AquariumSystem and component IDs need a stable standard-facing URI when
exported to NGSI-LD. Firestore IDs remain internal storage identifiers.

The FIWARE models are aquaculture-oriented and are composable references, not
a claim that every reef-aquarium concept is already covered. A TankOS-specific
extension is allowed only when the closest standard structure is insufficient,
and the mapping must be documented beside the contract that introduces it.

## 8. NoSQL persistence proposal

The first physical shape may be:

```text
aquariums/{systemId}
aquariums/{systemId}/components/{componentId}
aquariums/{systemId}/componentRelationships/{relationshipId}
aquariums/{systemId}/parameterSelections/{selectionId}
measurements/{measurementId}
```

Measurements denormalize `systemId`, `componentId?`, `zoneId?` and the
Feature-of-Interest snapshot. There are no FK checks and no cascades.

Deleting or disabling a component does not rewrite Measurements or delete
related evidence. A later administrative batch may physically remove the
component document after the historical snapshot contract is satisfied.

## 9. Relationship with Equipment and Livestock

Existing Equipment and Livestock domains should remain independent domains.
They may carry `systemId` and, where relevant, `componentId` as denormalized
association values. The AquariumSystem does not absorb their CRUD or lifecycle.

Examples:

- a return pump belongs to Equipment and is associated with a sump component;
- a coral specimen belongs to Livestock and is associated with a display or
  biological zone;
- a temperature probe belongs to a Device/source domain and targets a
  component Feature of Interest.

## 10. Initial acceptance criteria

The model is ready for the next specification when:

- one system can represent freshwater, saltwater, brackish and mixed cases;
- shrimp, snails, fish, corals and plants are classifications or subjects, not
  alternative root aggregates;
- a sump is represented as a system component, not a second Aquarium;
- a Measurement can target the system or a component;
- FIWARE structures are selected per semantic role;
- no FK or cascade is required;
- existing Aquarium routes and ownership boundaries have an explicit mapping;
- Rules, indexes, snapshots and lifecycle behavior are specified.

## 11. Decisions still open

This first model intentionally does not close:

1. the final controlled vocabulary for `waterMedium`, `biologicalFocus` and
   `componentType`;
2. whether one AquariumSystem may contain multiple display/containment units;
3. whether components may be nested beyond one parent level;
4. the exact relationship vocabulary for hydraulic topology;
5. whether `Aquarium` remains the only product name and `AquariumSystem` is
   implementation terminology;
6. the exact NGSI-LD entity types and JSON-LD contexts for each component.
