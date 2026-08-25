# AquariumSystem — Standards and English Hobby Vocabulary

**Status:** vocabulary research and proposed canonical terminology.

This document separates formal semantic standards from English terms used by
aquarists. A common hobby term is not promoted to a standard merely because it
is widespread.

## 1. Standards layer

### W3C SOSA/SSN

| Standard term               | Role in TankOS                                        |
| --------------------------- | ---------------------------------------------------- |
| `ssn:System`                | an infrastructure system that may contain subsystems |
| `ssn:hasSubSystem`          | system-to-subsystem relation                         |
| `sosa:FeatureOfInterest`    | entity whose property is observed or acted upon      |
| `sosa:hasFeatureOfInterest` | Observation-to-target relation                       |
| `sosa:Property`             | identifiable quality of a Feature of Interest        |
| `sosa:Observation`          | act/evidence of estimating a property                |
| `sosa:observedProperty`     | Observation-to-property relation                     |
| `sosa:phenomenonTime`       | time to which the result applies                     |
| `sosa:Platform`             | entity hosting sensors, actuators or subsystems      |

This gives TankOS a semantic distinction between:

```text
AquariumSystem / Component = system or Feature of Interest
ParameterDefinition         = observable Property vocabulary
Measurement                 = Observation / result evidence
Device                      = Sensor or Platform/source context
```

Reference: [W3C SSN/SOSA](https://www.w3.org/TR/vocab-ssn-2023/).

### FIWARE and Smart Data Models

| FIWARE structure       | Proposed TankOS use                                                     |
| ---------------------- | ---------------------------------------------------------------------- |
| `FishContainment`      | display tank or water-containment component when its semantics fit     |
| `Sump`                 | sump or water-treatment/recirculation component when its semantics fit |
| `WaterQualityObserved` | water-quality observation representation when its semantics fit        |
| NGSI-LD `Property`     | observed value with `unitCode` and `observedAt`                        |
| NGSI-LD `Relationship` | system/component/source/Feature-of-Interest links                      |

These models are composable references. They do not define the complete
AquariumSystem catalogue or every freshwater, reef, shrimp or snail concept.

References: [WaterQualityObserved](https://fiware-datamodels.readthedocs.io/en/stable/Environment/WaterQualityObserved/doc/spec/index.html),
[Aquaculture Smart Data Models](https://smartdatamodels.org/index.php/new-data-models-fishcontainment-specie-and-sump-at-subject-datamodel-aquaculture/).

## 2. English hobby vocabulary

The following terms are common aquarist language, not formal system classes.

| English term                                  | Meaning in the hobby                                                 | Proposed TankOS role                                         |
| --------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `aquarium`                                    | the whole managed aquatic setup, or sometimes only the tank          | product-facing name for `AquariumSystem`                    |
| `aquarium system` / `system`                  | the complete connected setup and its water/equipment context         | root system concept                                         |
| `tank`                                        | physical vessel or tank-shaped containment                           | physical component                                          |
| `display tank` / `DT`                         | main visible tank where livestock is displayed                       | `containment` component with display role                   |
| `sump`                                        | connected low-lying tank or chamber receiving and returning water    | `sump` component                                            |
| `refugium` / `fuge`                           | connected area/tank intended as refuge or for cultivation/filtration | `refugium` component or zone                                |
| `quarantine tank` / `QT`                      | tank used to isolate new or affected livestock                       | separate system by default; component when connected        |
| `hospital tank` / `HT`                        | isolation/treatment setup for sick livestock                         | usually separate system; operational role `hospital`        |
| `reef tank` / `reef aquarium` / `reef system` | marine aquarium focused on corals and reef invertebrates             | saltwater + coral focus                                     |
| `fish-only` / `FO`                            | marine system focused on fish without a reef-coral profile           | classification                                              |
| `FOWLR`                                       | fish-only-with-live-rock marine system                               | classification/profile                                      |
| `planted tank` / `planted aquarium`           | aquarium focused on aquatic plants                                   | biological focus/profile                                    |
| `shrimp tank` / `shrimp aquarium`             | aquarium focused on ornamental shrimp                                | biological focus/profile                                    |
| `snail tank` / `snail aquarium`               | aquarium focused on snails                                           | biological focus/profile                                    |
| `community tank`                              | aquarium holding multiple compatible species                         | stocking/operational profile                                |
| `all-in-one` / `AIO`                          | display aquarium with integrated filtration chambers                 | one system with internal components                         |
| `chamber` / `compartment`                     | subdivision inside a sump or integrated aquarium                     | child component/zone                                        |
| `breeding box` / `spawning box`               | small enclosure used for breeding, spawning or temporary isolation   | component when integrated; separate system when independent |

Usage evidence for these terms appears in [Bulk Reef Supply's aquarium
glossary](https://www.bulkreefsupply.com/content/post/md-2016-04-aquarium-glossary)
and [LiveAquaria's glossary](https://www.liveaquaria.com/blogs/aquarium-setup/glossary-of-aquarium-terms).
These are usage references, not normative standards.

## 3. System-boundary rule for quarantine

`Quarantine` describes an operational purpose, not automatically a component
relationship:

```text
Independent water and lifecycle
  → separate AquariumSystem with operationalRole = quarantine

Connected water circuit or integrated chamber
  → AquariumComponent with operationalRole = quarantine

Integrated breeding or spawning box inside the display tank or sump
  → AquariumComponent with operationalRole = breeding

External breeding or spawning setup with independent water and lifecycle
  → separate AquariumSystem with operationalRole = breeding
```

The same rule applies to hospital, breeding, grow-out and other auxiliary
enclosures. Physical proximity is not sufficient to determine the boundary:
the relevant criteria are water connectivity and independent operational
lifecycle.

## 4. Recommended canonical vocabulary shape

Use stable English machine terms and localized labels separately:

```text
SystemClassification
  waterMedium: freshwater | saltwater | brackish | other | unknown
  biologicalFocus: fish | coral | shrimp | snail | planted | macroalgae | mixed | other
  operationalRole: display | quarantine | hospital | breeding | growOut | experimental | other

ComponentType
  containment | sump | refugium | treatment | quarantine | hospital
  technicalArea | biologicalZone | chamber | other
```

The exact controlled-code registry remains a domain decision. Water medium,
biological focus and operational role remain independent dimensions.

## 5. Decisions still required

1. Which hobby aliases become selectable UI values.
2. Whether `brackish` is included in the first water-medium set.
3. Whether `hospital` and `quarantine` share one role or remain separate.
4. The exact controlled-code IDs and localized labels.
5. The exact FIWARE entity type and JSON-LD context for `AquariumSystem`.
