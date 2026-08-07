# Commands, Events and Queries

This is discovery material. It separates intent, occurrences and information
needs without adopting CQRS, event sourcing or any implementation pattern.

## Commands

| Command | Intent | Status |
| --- | --- | --- |
| Establish Aquarium | Create a private, durable Aquarium context. | accepted |
| Record Measurement | Record a Parameter value. | candidate |
| Record Observation | Record a note relevant to care. | candidate |
| Plan care work | Record an intention to perform care. | candidate |
| Complete care work | Record the outcome of planned care. | pending |
| Associate Livestock | Relate Livestock to an Aquarium. | candidate |
| Associate Equipment | Relate Equipment to an Aquarium or System. | candidate |

## Domain Events

| Domain Event | Meaning | Status |
| --- | --- | --- |
| `AquariumEstablished` | A private Aquarium became available for care. | accepted |
| `MeasurementRecorded` | A Parameter value was recorded. | candidate |
| `ObservationRecorded` | A care-relevant note was recorded. | candidate |
| `CareWorkPlanned` | An intention to perform care was recorded. | candidate |
| `CareWorkCompleted` | Care work was recorded as complete. | pending |
| `LivestockAssociated` | Livestock was associated with an Aquarium. | candidate |
| `EquipmentAssociated` | Equipment was associated with an Aquarium or System. | candidate |

## Domain event policy

A Command expresses requested intent. A Fact is durable, immutable attributable
evidence with provenance and occurrence or recording time. An Observation is
something perceived, measured or reported; a Measurement is a quantitative
Observation. It is a Fact only when an accepted use case records it durably. A
Domain Event is a Fact that an accepted use case identifies as a meaningful
domain occurrence, not an additional generic record beside that Fact. An
Interpretation is an attributable assessment of evidence, while Knowledge is
curated contextual understanding; neither becomes a Domain Event by default.

Record a Domain Event only when the occurrence has independent historical or
business meaning beyond a persistence mutation. Do not create one for every
field update, UI transition, cache write, listener update or derived view.
Accepted Domain Events are immutable records of their occurrence. A later
correction, qualification or withdrawal creates new accepted evidence when the
relevant use case says so; it must not silently rewrite historical meaning.
Event sourcing is not adopted.

`AquariumEstablished` occurs exactly once per Aquarium lifecycle: it exists only
when establishment commits successfully and represents that the private root
became available for care. It is immutable. Renaming, publishing, archiving or
later support for multiple Aquariums does not create another establishment
event. Archival or deletion may affect retention or visibility only when a
future accepted use case defines that policy; it cannot make the occurrence
unhappen.

## Queries

| Query | Information need | Status |
| --- | --- | --- |
| Identify Aquarium contexts | Select the care context to work in. | accepted; application query and state transition |
| Consult Parameter history | Interpret recorded values over time. | candidate |
| Consult planned care work | Understand what care is intended. | candidate |
| Consult care history | Review relevant past information. | candidate |
| Consult Livestock associations | Understand care context for organisms. | candidate |

Queries do not imply separate read models. Introduce a different model only if a
validated use case and measured need justify it.
