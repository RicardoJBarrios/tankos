# Review Parameter Policy

**Status:** Accepted as the semantic policy for future Parameter capabilities.

## Product language

A `Parameter` is a product-defined kind of quantity that may be measured for an
Aquarium. It supplies identity, semantic meaning and compatible Units.

Parameter is not simultaneously a target, a recommendation, an alert or a
measurement schedule. Those are separate concerns.

The catalogue is closed in the MVP and users cannot create Parameters.

## Canonical catalogue

| Parameter     | Unit        | Measurement | Dashboard | History | Target candidate | Future interpretation candidate |
| ------------- | ----------- | ----------- | --------- | ------- | ---------------- | ------------------------------- |
| `temperature` | °C          | Yes         | Yes       | Yes     | Yes              | Yes                             |
| `salinity`    | ppt         | Yes         | Yes       | Yes     | Yes              | Yes                             |
| `alkalinity`  | dKH         | Yes         | Yes       | Yes     | Yes              | Yes                             |
| `nitrate`     | mg/L as NO₃ | Yes         | Yes       | Yes     | Yes              | Yes                             |
| `phosphate`   | mg/L as PO₄ | Yes         | Yes       | Yes     | Yes              | Yes                             |

All five are currently measurable and historically reviewable. “Target
candidate” means that a keeper may eventually define a personal operating
window; it does not mean that Veril currently accepts a target or knows a
biological safe range.

The catalogue does not define mandatory measurement cadence. The domain corpus
shows that cadence varies with Parameter and Aquarium phase, so it must not be
encoded as one global rule.

## Policy assessment

No runtime `ParameterPolicy` abstraction is justified now.

The following responsibilities are intentionally separate:

- identity, meaning, Units and measurability: Parameter catalogue;
- target eligibility: product policy for a future capability;
- target values: optional Aquarium configuration;
- value interpretation: application-derived status;
- charting: presentation/read-model concern;
- alert delivery: future notification policy.

Sharing these responsibilities would hide different ownership and lifecycle
rules behind one generic concept.

The current model is therefore:

```text
Parameter → Measurement → derived Measurement Age
                         → optional Aquarium ParameterTarget
                         → derived ParameterStatus
```

Measurement Age is presentation information, not a domain object. Parameter
Status must not be persisted or mutate Measurement.

## Target eligibility

All five current Parameters are conceptually targetable because each has a
numeric canonical Unit and can be compared with a keeper-declared interval.
None is operationally targetable until that configuration capability exists.

Targetability does not imply that a Parameter is universally interpretable.
Interpretation is legitimate only when an explicit target exists and the UI
clearly presents it as the keeper's configured operating preference.

## Target ownership

The future `ParameterTarget` belongs to Aquarium configuration, not to the
global product catalogue, Livestock, a browser preference or a generic user
profile.

The target is an optional interval for one Aquarium and one Parameter. It is
not a biological guarantee, a safety limit or a Measurement validity rule.
Veril must not ship hidden product defaults as if they were authoritative.

The target configuration is specified in
[`configure-parameter-targets.md`](configure-parameter-targets.md). It uses an
optional bounded `parameterTargets` map in the Aquarium document so one
configuration read exposes the five possible target slots without creating a
collection for hypothetical scale.

## Status semantics

Parameter Status is an accepted application/read-model result:

- value interpretation: `below`, `within`, `above` or `uninterpreted`;
- missing evidence remains separate from interpretation;
- no combined enum such as `stale-high`;
- `uninterpreted` when a known Measurement has no configured target.

An old Measurement remains valid historical evidence. Parameter Status keeps
its age visible and presents latest evidence without claiming it represents the
current physical Aquarium state; it defines no freshness threshold.

## Dashboard and Store

Current Measurements evolves incrementally:

```text
latest value → value + age → value + configured target → derived status
```

Dashboard Attention remains future work. Parameter Status belongs to the scoped
`AquariumDashboardStore` because it combines Store-owned target configuration
with the Dashboard's current Measurement state. It does not justify another
Store or generic interpretation service.

## Next capability

The next capability is `Configure Parameter Targets`, not `Review Parameter
Status`. It allows an authenticated owner to define, edit and remove optional
ranges for the selected Aquarium without claiming biological authority or
changing Measurements. Its Definition-of-Ready decisions are closed in
[`configure-parameter-targets.md`](configure-parameter-targets.md).

`Review Parameter Status` is accepted in
[`review-parameter-status.md`](review-parameter-status.md). It keeps stale-data
thresholds explicitly deferred.

## Deferred scope

- product-wide recommended ranges;
- species- or Livestock-derived ranges;
- automatic target suggestions;
- biological alarms;
- Dashboard Attention;
- Notifications and automation;
- generic policy or rule engines.

## Testing implications

Future target tests must cover optional configuration, ownership, finite values,
canonical Units, lower/upper boundary order, editing and removal. Future status
tests must separately cover missing evidence, age and below/within/above
comparison. No interpretation test belongs in Measurement domain invariants.
