# Configure Parameter Targets

**Status:** Implemented.

## Product value

The keeper can record the operating interval they want to use for each
Parameter in one Aquarium. This makes a later comparison with current
Measurements explicit and personal without presenting Veril's biological
recommendation as fact.

This capability configures targets only. It does not implement `Parameter
Status`, Dashboard Attention, alerts, Notifications, charts or recommendations.

## Actor

The authenticated keeper who owns the selected Aquarium.

## Preconditions

- The keeper is authenticated.
- An Aquarium is selected in Active Context.
- The selected Aquarium belongs to the authenticated keeper.
- The Parameter belongs to the active catalogue, whether it is system-defined
  or a valid public `ParameterDefinition`.

Active Context identifies the Aquarium but is not authorization. Firestore
Rules remain authoritative.

## Domain language

`ParameterTarget` is an optional Aquarium-owned configuration value describing
one keeper-declared desired interval for one canonical `Parameter`.

It is not a Measurement, Fact, Domain Event, biological invariant, safety
limit, recommendation, alert, current state or historical evidence. It does
not change Measurement validity, provenance, timestamps or history.

There is at most one target for each `AquariumId + ParameterId`. A target has
no independent identity: the configuration slot is identified by that pair.
There are no overlapping ranges, named ranges or target versions in this
capability.

## Minimum target shape

```text
ParameterTarget
  parameterId
  minimum
  maximum
```

The target uses the canonical Unit defined by `ParameterId`. The unit is not
persisted redundantly and the keeper does not choose a unit in the form.

The current canonical mappings are:

| Parameter   | Canonical Unit |
| ----------- | -------------- |
| temperature | °C             |
| salinity    | ppt            |
| alkalinity  | dKH            |
| nitrate     | mg/L as NO₃    |
| phosphate   | mg/L as PO₄    |

Both values must be finite, canonical numeric values and non-negative, using
the same numeric semantics as `Measurement`. The interval invariant is
`minimum <= maximum`; equality is valid for a keeper who wants an exact value.
No additional rounding or arbitrary decimal precision is introduced.

The model contains no midpoint, warning or critical range, provenance,
notes, severity, recommendation or created-by field.

## Lifecycle

The accepted lifecycle is:

```text
absent → configure → configured
configured → edit → configured
configured → remove → absent
```

The three operations are capability-specific:

- `ConfigureParameterTarget` creates an absent target;
- `ChangeParameterTarget` replaces the interval of an existing target;
- `RemoveParameterTarget` removes it.

An implementation may share one narrow `ParameterTargetWriter` boundary for
these operations, but must not introduce generic update, CRUD or lifecycle
abstractions.

Changing or removing a target does not rewrite Measurements, create a Fact or
Domain Event, add Timeline history, or require a migration. It affects only
future application interpretation. Removal is true absence; no `disabled`
flag is persisted.

Target history is not justified for this keeper configuration. Concurrent
updates use the persistence system's normal optimistic transaction behaviour;
the last successful update for the same configuration slot wins. There is no
versioning or conflict framework in this capability.

## Absence and future status

No target means `uninterpreted`. It does not mean healthy, unsafe, unknown
configuration failure or a product default. Current Measurements remain
usable and continue to show their value and age without a target message in
this capability.

`Parameter Status` remains a future application/read-model result. It may
compare a current Measurement with an explicit target and classify it as
`below`, `within`, `above` or `uninterpreted`, but it is not persisted here.
Missing Measurements and Measurement Age remain independent concerns.

## Persistence

Targets are logically part of Aquarium configuration and are persisted as an
optional `parameterTargets` map in the Aquarium document:

```text
aquariums/{aquariumId}
  parameterTargets: {
    temperature: { minimum, maximum },
    ...
  }
```

Only configured Parameters appear in the map. An Aquarium with no targets has
no `parameterTargets` field. The map is bounded by the five closed MVP
Parameters and is negligible relative to Firestore's document limit.

This shape gives the actual consumer one bounded Aquarium configuration read,
avoids five target reads, avoids a collection created for hypothetical scale,
and keeps target configuration with its owner. It does not make the target a
separate Aggregate or expand Aquarium into a generic settings bag.

Target writes must update only `parameterTargets` through a capability-specific
application operation. A transaction preserves other configured Parameters
when two tabs edit different slots. A same-slot concurrent edit has ordinary
last-successful-write semantics. No new collection, index, backend process or
background read is required.

The Firestore adapter validates the complete external document at its boundary
and maps the target map to the domain value. Rules allow only owner-scoped
changes to the target map, known Parameter keys and the permitted numeric
shape; they do not calculate biological meaning. Exact Rules expressions must
be covered by Emulator tests when implemented.

`AquariumListItem` must not grow targets merely because it is convenient for
the list page. The Dashboard should use a narrow `AquariumDashboardContext`
read model containing only the active Aquarium context/configuration it needs,
including targets once implemented. It must not hydrate a domain Aggregate into
the UI.

## Store and application boundary

`ConfigureParameterTargetsPage` owns its editing state and the target snapshot
needed by that capability. It invokes Aquarium application use cases directly;
the Dashboard Store does not acquire target-mutation methods merely to serve a
separate route. `AquariumDashboardStore` reads targets only as part of its own
Dashboard context and uses them to derive Parameter Status.

The flow is:

```text
UI → Aquarium application use case → consumer-owned port → adapter
 ↓
local target snapshot updates after success
```

Forms, validation errors and mutation state remain capability-local. No extra
Signal Store, CQRS projection or Nx library is needed.

## UX

The configuration surface is a capability-specific page labelled
`Objetivos de parámetros`, reachable from the Aquarium Dashboard through one
clear action. It is not a generic Settings framework and does not put five
forms permanently into the Current Measurements section.

Each Parameter row shows its localized label, canonical unit, minimum and
maximum. The form starts unconfigured, never prepopulates biological values,
does not ask for a unit and presents configured values as keeper-owned desired
intervals, for example `24,5–25,5 °C`.

Configured targets are editable. `Eliminar objetivo` returns the Parameter to
the unconfigured state; a destructive confirmation is not required because
this removes low-risk preference configuration and not durable evidence. Save,
edit and remove must expose pending, success and recoverable error states.

The UI must not use terms such as safe range, healthy range, alarm or
recommendation. Explicit text, not colour alone, communicates configuration
and validation errors. No target means the Parameter remains unclassified.

## Security

Only the authenticated owner of the Aquarium may configure, change or remove
a target. Anonymous clients, other keepers, unknown Aquariums and unknown
Parameters are denied. Active Context is never a security mechanism.

The intended Rules cases are:

| Scenario                        | Expected result             |
| ------------------------------- | --------------------------- |
| Owner writes valid known target | Allowed                     |
| Anonymous client                | Denied                      |
| Other keeper                    | Denied                      |
| Other Aquarium                  | Denied                      |
| Unknown Parameter key           | Denied                      |
| Non-finite or malformed value   | Denied/rejected at boundary |
| `minimum > maximum`             | Denied/rejected             |
| Extra fields                    | Denied/rejected             |
| Owner edits own target          | Allowed                     |
| Owner removes own target        | Allowed                     |

Rules enforce ownership, allowed fields/keys and structural constraints within
their supported language. Domain validation remains the authoritative
application boundary for the complete value semantics.

## Deferred scope

- `Parameter Status` and freshness/status presentation;
- biological or product-wide recommendations;
- species- or Livestock-specific ranges;
- target history, audit and Timeline entries;
- Dashboard Attention, alerts, Notifications and automation;
- custom Parameters;
- per-Parameter units or conversions;
- generic Aquarium Settings or CRUD;
- importing, exporting or collaborative conflict resolution.

## Testing strategy

The implementation has proportional evidence:

- domain: known Parameters, finite/non-negative values, equality boundary,
  ordering invariant and unknown Parameter rejection;
- application: authentication, Active Context, ownership, configure/edit/
  remove, absent target, no Measurement dependency and infrastructure failure;
- adapter: map persistence, read, edit, remove, multiple Parameters, owner
  isolation and malformed external data;
- Rules: the attack matrix above and only the structural query/write cases
  needed by this shape;
- Store: load, target lookup, mutation state, Aquarium switch and failure
  preservation;
- Angular: unconfigured/configured rows, canonical units, validation, edit,
  remove, pending, error and accessible semantics;
- E2E: configure, observe, edit and remove a target with deterministic data.

No test should implement or assert `Parameter Status` before that capability
is separately accepted.

## Definition of Ready

| Decision                                | Status                                                  |
| --------------------------------------- | ------------------------------------------------------- |
| Product value and owner                 | Ready                                                   |
| Target identity and cardinality         | Ready: AquariumId + ParameterId; one slot               |
| Shape, canonical Unit and numeric rules | Ready                                                   |
| Lifecycle and absence                   | Ready: configure, edit, remove                          |
| Persistence and read cost               | Ready: bounded map in Aquarium                          |
| Ownership and Rules boundary            | Ready                                                   |
| Store ownership and read model          | Ready                                                   |
| UX and Spanish terminology              | Ready                                                   |
| Concurrency                             | Ready: transactional merge, same-slot last success wins |
| Testing and deferred scope              | Ready                                                   |
| No-default policy                       | Ready                                                   |

All blocking decisions were explicit. The capability is implemented without
introducing Parameter Status or future notification infrastructure.
