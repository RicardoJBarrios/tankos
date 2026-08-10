# Review Measurement Age

**Status:** Ready for implementation as the next Measurement increment.

## Product value

The keeper can see when the latest known value for each Parameter was actually
measured. This makes the existing Current Measurements surface more truthful
without claiming that the value describes the Aquarium at this moment.

## Scope

This increment adds age information to the existing Current Measurements view.
It does not interpret values, define target ranges or classify Measurements as
safe, unsafe, fresh or stale.

## Language

`Current Measurement` means the most recently known Measurement for a Parameter
according to the accepted ordering. It does not mean the Aquarium's current
physical value.

`Measurement age` is the elapsed time between `measuredAt` and an explicit
`now`. It is derived presentation information and is never persisted.

## Time semantics

- Age uses `measuredAt`, never `recordedAt`.
- Both values are absolute instants.
- Aquarium timezone affects only the presentation of the absolute timestamp.
- The calculation receives `now` explicitly so it remains deterministic.
- A future `measuredAt` is not silently converted into a valid age; the
  application must retain the absolute timestamp and handle the anomaly
  explicitly.

## States and wording

The UI distinguishes:

- `Sin datos`: no Measurement exists;
- `Medido hace …`: a Measurement exists and its age can be presented.

The first increment does not show `Fresco`, `Antiguo`, `Obsoleto` or a warning.
Relative age may be accompanied by the Aquarium-local absolute timestamp where
that improves precision. The text must not depend on colour or an icon.

## Freshness policy

There is no accepted freshness threshold in this increment. Measurement cadence
and suitability for a future current-state interpretation remain separate
decisions. The available domain corpus indicates that cadence depends on the
parameter and operating phase, but does not justify one product-wide threshold.

## Parameter targets

This increment defines no target ranges. The external Aquarium corpus contains
contextual recommendations and scenario-specific values, not a universal Veril
policy. `Parameter Status` remains blocked until target ownership, provenance,
and interpretation semantics are accepted.

## Ownership and architecture

`Measurement` remains an independent aggregate and durable Fact. Age is an
application/UI read-model derivation and is not a Domain Event, Fact, Entity,
Value Object or persisted Aquarium state.

The existing `AquariumWorkspaceStore` remains sufficient for this increment:
the age is used only by the Current Measurements section and has no second
consumer. Current Measurement data is not duplicated into the Store merely for
symmetry. Weather is not combined with age in this slice.

## Persistence and cost

- No Firestore schema, collection, index or Rule changes.
- No additional query.
- Existing `measuredAt` is the only source timestamp.
- No backend, scheduler, notification or projection is required.

## Testing

Deterministic application/presentation tests cover:

- no Measurement;
- a Measurement measured exactly at `now`;
- a recent Measurement;
- an explicit absolute timestamp alongside its age;
- `recordedAt` not being used for age;
- Aquarium timezone not changing elapsed-time calculation.

Tests must pass `now` explicitly. Boundary tests for a stale threshold are not
required because this increment deliberately defines no threshold.

## Deferred scope

- Parameter-specific or global freshness thresholds;
- measurement cadence configuration;
- target ranges and `Parameter Status`;
- Environmental Awareness;
- Dashboard Attention;
- Notifications and automation.

## Definition of Ready

| Criterion | Result | Evidence |
| --- | --- | --- |
| User value | Ready | Makes the existing latest-value surface more truthful. |
| Source and time | Ready | Uses `measuredAt` and explicit `now`. |
| Semantics | Ready | Age is distinct from Fact validity and target interpretation. |
| Store ownership | Ready | No cross-section consumer requires moving section state. |
| Persistence and cost | Ready | No schema or query change. |
| UX and accessibility | Ready | Explicit Spanish text; no colour-only meaning. |
| Testing | Ready | Deterministic age and timestamp cases are defined. |
| Deferred scope | Ready | Thresholds, targets and status interpretation are explicit. |
