# Architecture references

Read only the page needed for the task. The canonical technical direction is
[`target-architecture.md`](target-architecture.md). It owns dependency
direction, composition, rendering, Firebase integration, state, offline,
testing and Nx boundaries.

## Selective references

- Domain discovery: [`domain-model.md`](domain-model.md),
  [`use-cases.md`](use-cases.md), [`aggregate-hypotheses.md`](aggregate-hypotheses.md)
  and [`bounded-contexts.md`](bounded-contexts.md).
- Events and cross-cutting rules: [`event-storming.md`](event-storming.md) and
  [`cross-cutting-policies.md`](cross-cutting-policies.md).
- Firestore: [`@tankos/data-access-firestore`](../../../libs/data-access-firestore/docs/README.md)
  is the global access/cost/security policy; [`firestore-model.md`](firestore-model.md)
  contains persistence examples and conventions, not a schema.
- Operations and future capabilities:
  [`@tankos/observability`](../../../libs/observability/docs/README.md),
  [`image-strategy.md`](image-strategy.md), [`ai-architecture.md`](ai-architecture.md).

Discovery and future documents do not override the target architecture or an
accepted specification.
