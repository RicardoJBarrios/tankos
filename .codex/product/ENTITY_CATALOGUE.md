# Candidate Entity Catalogue

The catalogue is a discovery aid. “Candidate” does not mean an entity, aggregate
or stored record will be created.

| Concept | Purpose | Responsibilities or relationships | Status |
| --- | --- | --- | --- |
| Aquarium | Provide the manageable care system and domain root. | Aggregate root relating care records, Livestock, Equipment and supporting systems. | accepted aggregate root |
| Display | Name a physical aquarium display. | May be related to Aquarium. | pending |
| System | Name supporting care equipment or configuration. | May relate to Aquarium and Equipment. | pending |
| Livestock | Represent organisms receiving care. | May be associated with an Aquarium. | candidate |
| Equipment | Represent a care-related device or item. | May be associated with Aquarium or System. | candidate |
| Measurement | Represent a recorded Parameter value. | May relate to Aquarium, Parameter and provenance. | candidate |
| Observation | Represent a human or device note. | May relate to an Aquarium, Event or Livestock. | candidate |
| Care work | Represent planned or performed care. | May include Maintenance, Task, Feeding or Water Change. | pending |
| Alert | Represent a need for attention. | May relate to a condition or care context. | pending |
| Automation | Represent permitted assisted action or recommendation. | May relate to Rules, inputs and an actor. | future |

`Aquarium` is the accepted aggregate root. Every other concept needs an accepted
use case before it becomes an Entity with identity, lifecycle and responsibilities.
