# Domain and architecture references

Start domain work with [the Vision](../VISION.md), the
[Glossary](../GLOSSARY.md), [mental model](../product/MENTAL_MODEL.md),
[use cases](use-cases.md) and [aggregate hypotheses](aggregate-hypotheses.md).
They precede technical architecture and persistence design.

Product-discovery artefacts, including capability map, personas, journeys, value
objects, units, privacy and portability, are indexed in
[`../product/README.md`](../product/README.md). One-use-case specifications live
in [`../specifications/`](../specifications/).

The maintained technical direction is
[`target-architecture.md`](target-architecture.md). Supporting discovery and
architecture documents follow the design precedence defined in `AGENT.md`:

- [`domain-model.md`](domain-model.md)
- [`event-storming.md`](event-storming.md)
- [`bounded-contexts.md`](bounded-contexts.md)
- [`firestore-model.md`](firestore-model.md) — persistence conventions, not a
  schema
- [`firestore-data-access-and-finops.md`](firestore-data-access-and-finops.md) —
  global access, security, consistency, cost and operations policy
- [`cross-cutting-policies.md`](cross-cutting-policies.md)
- [`image-strategy.md`](image-strategy.md)
- [`operations-and-observability.md`](operations-and-observability.md)
- [`ai-architecture.md`](ai-architecture.md)
