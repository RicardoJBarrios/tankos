# Product Capability Map

This is a product map, not a bounded-context map, code structure or delivery
commitment. A capability groups an observable product outcome; its use cases may
still be delivered incrementally.

## Current capability

### Aquarium Management

Provides the keeper with a private Aquarium context that can be created,
discovered, selected and used for durable qualitative records.

- Establish Aquarium — accepted and implemented.
- List My Aquariums — accepted and implemented.
- Select Aquarium — accepted and implemented.
- Record Observation — accepted and implemented.
- List Observations — accepted and implemented.

These use cases share product language and the Aquarium as their subject, but
they do not require a single large transaction boundary or a shared technical
module.

### Measurements

Provides durable quantitative evidence for the selected Aquarium through a
closed Parameter catalogue.

- Record Measurement — accepted and implemented.
- List Measurements — accepted and implemented.
- Correct Measurement — candidate.
- Parameter History — candidate.

Measurement remains an independent aggregate and does not become part of the
Aquarium transaction boundary.

## Candidate capabilities

### Care

- Record Care Work
- Schedule Care Work
- Complete Care Work
- Review Care History

### Timeline

- Review Timeline
- Timeline filters
- Contextual navigation

Timeline remains a read model over accepted durable records, not an independent
source of truth.

### Livestock

Manage the organisms associated with an Aquarium once identity, grouping,
transfers and lifecycle are validated.

### Equipment

Manage devices and care-supporting equipment once identity, ownership, state and
sharing rules are validated.

### Notifications

Surface alerts and reminders once semantics, consent, severity and delivery
behavior are accepted.

### Automation

Evaluate rules and recommend or perform actions only after safety, authority,
audit and failure behavior are defined.

### AI Assistance

Provide attributable assistance over trusted evidence. It is optional and must
not become a prerequisite for recording, reviewing or operating an Aquarium.

## Evolution rule

Capabilities are planning units, not architecture mandates. Split or combine a
capability only when accepted use cases reveal different language, ownership,
authorization or consistency needs. Do not create a library, aggregate or
infrastructure boundary solely because a capability appears on this map.
