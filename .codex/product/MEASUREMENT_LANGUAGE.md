# Measurement Language

This document defines the durable product language for Measurements. It does
not define a use case, UI, Firestore schema or recommended aquarium ranges.

## Measurement

A Measurement is quantitative, durable evidence about a Parameter of an
Aquarium. It is a Fact when persisted, but recording it does not automatically
create a Domain Event.

Measurement and Observation are sibling evidence concepts. A Measurement is not
implemented as a subclass of Observation, and Observation is not a generic
container for all recorded information. Both may be projected into a future
Timeline without making that projection a source of truth.

A Measurement is independently attributable to an Aquarium through
`AquariumId`. It does not belong to the transactional boundary of the
`Aquarium` aggregate.

## Parameter

A Parameter is a product-defined kind of quantity that can be measured for an
Aquarium. It defines the semantic meaning of a Measurement and the Units that
are compatible with it.

Parameter is a domain catalogue concept, not an Aquarium-owned Entity, user
record, Aggregate or free-form string. It has no per-Aquarium lifecycle or
ownership. The MVP catalogue is closed and system-defined; users cannot create
custom Parameters until a separate product decision accepts the vocabulary,
units, migration and interoperability consequences.

Each Parameter has:

- a stable machine identifier;
- one canonical English code used by the domain;
- localized labels outside the domain language;
- a semantic definition;
- one canonical Unit;
- a finite set of allowed input Units.

Parameter identifiers are durable. Labels may be localized without changing
identity. Parameters are not versioned per Measurement in the MVP. If the
meaning of a Parameter changes incompatibly, a new identifier is introduced;
existing records retain the old meaning.

## Unit model

The valid relationship is:

```text
Parameter -> canonical Unit -> allowed input Units
```

The Parameter catalogue, not user input, determines compatibility. Free-form
unit strings are invalid.

The first catalogue accepts the canonical Unit as input and stores it without
conversion. Its canonical mappings are:

| Parameter     | Unit identifier               | Symbol/label | Negative values |
| ------------- | ----------------------------- | ------------ | --------------- |
| `temperature` | `celsius`                     | °C           | not allowed     |
| `salinity`    | `parts-per-thousand`          | ppt          | not allowed     |
| `alkalinity`  | `degrees-kh`                  | dKH          | not allowed     |
| `nitrate`     | `milligrams-per-litre-as-no3` | mg/L as NO₃  | not allowed     |
| `phosphate`   | `milligrams-per-litre-as-po4` | mg/L as PO₄  | not allowed     |

The model permits additional input Units later, with explicit conversion rules
at the application boundary. Conversion must never combine an incompatible
Parameter and Unit. The symbols are presentation labels; the identifiers carry
the durable semantics, including the chemical basis of nitrate and phosphate.

## Measurement value

The durable model retains both representations:

- `enteredValue` and `enteredUnit`: the value supplied by the keeper;
- `canonicalValue` and `canonicalUnit`: the normalized value used for future
  comparison and export-independent calculations.

For the first catalogue, entered and canonical values are identical because
only canonical input is accepted. Keeping both fields preserves auditability
and avoids losing the original unit when conversion is introduced. It does not
require conversion behavior in the first use case.

## Numeric semantics

Values are finite numbers. `NaN`, positive infinity and negative infinity are
invalid. The initial catalogue rejects negative values because none of its five
quantities is represented as negative in this product model. Zero remains valid
for every initial Parameter.

There is no global arbitrary decimal limit or rounding rule. The catalogue may
define Parameter-specific validation when physical representation requires it.
Recommended aquarium ranges are guidance, not measurement validity rules.

## Time semantics

Every persisted Measurement has two distinct instants:

- `measuredAt`: when the keeper or source took the measurement;
- `recordedAt`: when Veril accepted it.

Both are required because a keeper may record a value after taking the reading.
They must not be overloaded into one timestamp. The user-facing flow may
default `measuredAt` to the current time, but it must preserve the distinction
for retrospective entry. Both instants use the project's canonical UTC
representation at the boundary.

## Provenance

Provenance is persisted and extensible. The initial value is:

```text
manual
```

The model reserves future source classifications such as `imported` and
`sensor`, but the first use case does not implement them. Provenance describes
where the evidence came from; it does not grant authorization or change the
Measurement's ownership.

## Initial catalogue

The first catalogue contains five marine Parameters supported by the domain
evidence in the aquarium corpus:

- `temperature`;
- `salinity`;
- `alkalinity`;
- `nitrate`;
- `phosphate`.

This is a product catalogue choice for the marine MVP, not a restriction in the
Measurement model. It defines no target ranges, health thresholds or mandatory
testing schedule. The canonical Units and their identifiers are defined in the
Unit model above; the accepted `Record Measurement` use case may only accept
those Units.

Users cannot extend this catalogue in the MVP. Adding a Parameter later is an
additive catalogue decision and does not require changing the Measurement
concept.

## Boundary check

This language is independent of Firestore and does not require inheritance,
Timeline, Dashboard, charts, offline synchronization, CQRS, Event Sourcing or
hardware integration. Firestore may persist the resulting contract, but it does
not define the concepts. Measurements remain independent from dashboards and
future read models.
