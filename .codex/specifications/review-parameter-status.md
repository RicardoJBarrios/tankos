# Review Parameter Status

**Status:** Implemented.

## Product value

The keeper can understand how the latest known Measurement compares with the
operating interval they explicitly configured for the selected Aquarium. The
comparison remains explainable: the value, its target, its age and its absolute
timestamp remain visible.

This capability does not assess Aquarium health, biological safety, urgency or
the current physical state of the Aquarium.

## Actor and preconditions

The authenticated keeper has selected an Aquarium in Active Context. Current
Measurements and the Aquarium's optional Parameter Targets are read through
their existing owner-scoped boundaries. Active Context selects the Aquarium; it
does not authorize the read.

## Language and semantics

`ParameterStatus` is an application-derived interpretation of one latest known
Measurement against one explicit `ParameterTarget`. It is not a Measurement,
Fact, Entity, Aggregate, Domain Event, persisted state, Timeline item, alert or
notification.

The sources of truth remain immutable Measurement evidence and Aquarium-owned
target configuration. Status is always reconstructible and is never persisted.

For a known Measurement and configured target:

```text
value < minimum              -> below
minimum <= value <= maximum  -> within
value > maximum              -> above
```

Both boundaries are inclusive; an exact target where `minimum == maximum` is
`within` only for that exact value.

For a known Measurement without a target, the interpretation is
`uninterpreted`. The UI says `Sin objetivo configurado`; it does not infer a
product default.

When no Measurement exists, evidence is missing and no value interpretation is
returned, regardless of whether a target exists. The UI says `Sin datos` and
must not show `below`, `within`, `above` or `uninterpreted` as a substitute.

Measurement Age remains an independent presentation dimension. It uses
`measuredAt` and explicit `now`; it neither suppresses nor changes numerical
interpretation. There is no freshness threshold in this capability.

## Read model and Store

`CurrentParameterState` is a bounded Dashboard read model, not a domain entity.
It combines the existing `CurrentMeasurementValue`, the optional
`ParameterTarget`, and an optional `ParameterStatus` interpretation for one
closed-catalogue Parameter. It exposes no Firestore, DTO or presentation-label
types.

`AquariumWorkspaceStore` becomes the single Dashboard owner of:

- Aquarium context and target configuration;
- current Measurement values and their independent loading/error state; and
- computed `CurrentParameterState` values.

`CurrentMeasurementsSection` becomes presentational: it renders Store-derived
states and asks the Store to retry. It neither queries Firebase nor joins
targets with Measurements.

The Store resets context, targets, Measurements, computed states and their
errors when Active Context changes. It may load the Dashboard context and
current Measurements independently once an Active Context exists, so unrelated
Weather, Care and Activity failures never block this capability.

After recording a Measurement, the current values reload on Dashboard re-entry.
No event bus, mutation side effect or ticking clock state is needed.

## UX

The surface remains `Últimas mediciones`, because it reports the latest known
evidence rather than a physical present state. The surrounding Dashboard copy
must not imply that an old Measurement is current Aquarium condition.

For a known Measurement with a target, show the localized Parameter, canonical
value and Unit, one explicit comparison label, the configured interval, age and
Aquarium-local absolute timestamp. Canonical labels are:

- `Por debajo del objetivo`;
- `Dentro del objetivo`;
- `Por encima del objetivo`.

For a known Measurement without a target, show `Sin objetivo configurado` and a
discoverable `Configurar objetivo` action. For missing evidence, show `Sin
datos`; a target does not fabricate status.

Text and semantics carry the comparison. Material styling may provide restrained
support, but colour, icons, red/green health semantics, severity and alarms are
out of scope. The existing compact list remains compact; no diagnostic panels,
Dashboard Attention section or generic status component are introduced.

## Architecture and persistence

The comparison is a pure application policy, located outside Angular, Firebase,
the Store and the domain aggregate. Its inputs are canonical value and
`ParameterTarget`; its output is only `below`, `within` or `above`.

No schema, collection, index, Rule, Cloud Function, backend service or new
Firebase read is required. The Store reuses the existing bounded current
Measurement reader and the existing Aquarium Dashboard context read.

No generic `Status<T>`, rule engine, parameter policy, insight, alert or
notification abstraction is justified.

## Security and failures

Existing owner-scoped Measurement and Aquarium reads remain authoritative. A
missing target is valid configuration; missing Measurement evidence is valid
absence. An infrastructure failure remains an error and must never be rendered
as either absence.

## Testing

- pure application policy: below, both inclusive boundaries, between, above,
  exact targets and decimal values;
- Store: current-value load, target join, missing target, missing Measurement,
  target edit/remove recomputation, retry/failure isolation and Aquarium reset;
- Angular: value, Unit, target, comparison text, age, absolute timestamp,
  missing target, missing evidence, loading and failure;
- E2E: configure a temperature target, record one within-target Measurement,
  edit the target so the same evidence becomes outside it, then remove the
  target and observe `Sin objetivo configurado`.

No Firebase adapter or Rules coverage is added: this slice reuses existing
owner-scoped reads and writes no new data.

## Deferred scope

- freshness or stale thresholds;
- biological recommendations, health or safety claims;
- Dashboard Attention, notifications and automation;
- target history, status history or Timeline entries;
- generic interpretation/rule infrastructure; and
- refresh timers or a Clock abstraction.

## Definition of Ready

| Decision                                              | Result                                            |
| ----------------------------------------------------- | ------------------------------------------------- |
| Product value, actor and scope                        | Ready                                             |
| Status meaning and inclusive boundaries               | Ready                                             |
| Missing target and missing Measurement semantics      | Ready                                             |
| Age independence and truthful latest-evidence wording | Ready                                             |
| Store/read-model ownership                            | Ready                                             |
| Security, persistence and query cost                  | Ready: existing boundaries, zero additional reads |
| UX, accessibility and deferred scope                  | Ready                                             |
| Focused tests and E2E evidence                        | Ready                                             |

All blocking decisions are explicit. `Review Parameter Status` is ready to
implement without adding a persistence model or Dashboard Attention.
