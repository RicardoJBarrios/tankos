# Candidate Bounded Contexts

These contexts are hypotheses for future domain boundaries. They do not authorize
Nx libraries or separate deployables, and must follow accepted use cases and
aggregate evidence.

| Context             | Owns language around                     | Likely consistency concern            | Boundary trigger           |
| ------------------- | ---------------------------------------- | ------------------------------------- | -------------------------- |
| Aquarium Management | Aquarium, Display, configuration         | ownership and active context          | first Aquarium feature     |
| Identity and Access | User, membership, role, invitation       | authorization and privacy             | first authenticated data   |
| Livestock           | Fish, Coral, lifecycle                   | ownership and transfer history        | first livestock workflow   |
| Equipment           | Equipment, Sensor, Controller            | ownership, state and safety           | first device workflow      |
| Maintenance         | Task, Maintenance, Water Change, Feeding | history semantics to discover         | first maintenance workflow |
| Measurements        | Parameter, Measurement, provenance       | correction, provenance and query cost | first measurement workflow |
| Automation          | Rule, Trigger, Condition, Action         | safety and authorization              | first automated action     |
| Notifications       | Alert, Reminder, delivery                | consent and retry semantics           | first notification channel |
| Administration      | policy and operational controls          | privileged changes and audit          | concrete admin requirement |

## Boundary rules

- A context owns its business language and invariants.
- Cross-context communication uses explicit application contracts or events.
- Shared libraries may contain technical utilities, not undeclared domain truth.
- A context must not be split merely because a folder is large.
- A context must not be merged merely to avoid defining a contract.

## Pending decisions

- Whether Aquarium Management and Identity are separate contexts in the first
  release.
- Whether Measurements and Maintenance share an event history or only references.
- Whether Equipment and Automation are separate contexts or one device context.
- Which context owns Timeline projections.
