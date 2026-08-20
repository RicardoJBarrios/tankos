# TankOS Units

**Status:** domain documentation and recorded decisions. No runtime behavior
has been implemented yet.

This library owns the reusable Angular-centric capability for describing,
validating, converting and presenting measurement units. It must remain
self-contained and must not depend on the TankOS application, Firebase,
Firestore or any aquarium-specific feature.

## 1. Purpose

TankOS must allow a measurement property to accept more than one input unit
while maintaining one canonical unit in the digital twin. The Units library is
responsible for the unit semantics and conversion boundary required to make
that safe and consistent.

The library does not own:

- `Measurement` records;
- `ParameterDefinition` records;
- Aquarium or AquariumSystem identity;
- device, sensor or IoT transport;
- Firestore persistence;
- FIWARE synchronization;
- keeper or administrator authorization.

Those consumers may use this library through explicit public APIs.

## 2. Standards-first direction

The preferred vocabulary is the closest applicable standard, in this order:

1. UN/CEFACT Common Codes for Units of Measurement (UNECE Recommendation 20
   and related common-code semantics).
2. FIWARE and NGSI-LD conventions, especially `unitCode` for an NGSI-LD
   `Property` value.
3. A TankOS extension only when the standards do not express a required
   aquarium or scientific distinction.

The library must preserve the standard code as a stable machine identifier and
keep user-facing labels separate. A local alias or translated label must never
replace the standard identity.

The FIWARE integration boundary is an adapter concern. The Units library can
provide the canonical code and conversion metadata needed by an adapter, but it
must not become an NGSI-LD client or embed transport DTOs in its domain model.

## 3. Core concepts

### Unit

An identifiable unit of measurement with stable standard-facing identity,
scientific meaning, dimensional information and presentation metadata.

At minimum, a future implementation will need to distinguish:

- stable code;
- canonical name;
- quantity or dimension compatibility;
- symbol and textual representation;
- conversion strategy;
- accepted aliases and input forms;
- lifecycle and schema version when the catalogue becomes configurable.

### Quantity kind

The scientific magnitude being measured, such as temperature, pressure,
conductivity, density, salinity or mass concentration. A quantity kind is not
the same thing as a unit.

Examples:

```text
temperature       -> degree Celsius, kelvin, degree Fahrenheit
conductivity      -> siemens per metre, millisiemens per centimetre
salinity          -> practical salinity, parts per thousand, absolute salinity
specificGravity   -> dimensionless specific gravity
density           -> kilogram per cubic metre, kilogram per litre
```

### Canonical unit

The one unit selected by the owning `ParameterDefinition` for the digital twin
and normalized calculations. Incoming values may use another accepted unit,
but the normalized representation uses the canonical unit when a valid
conversion exists.

The canonical unit is a property of the parameter definition, not a global
assumption that every measurement of a quantity must use the same display unit.

### Accepted input unit

A unit that a parameter explicitly permits at input time. The accepted-unit
list is configured when the property/`ParameterDefinition` is created or
versioned. A unit is not accepted merely because a generic converter knows how
to transform it.

### Conversion

A declared transformation from one compatible representation to another. A
conversion may be:

- a direct linear transformation;
- a temperature-dependent or otherwise contextual transformation;
- a method-specific transformation;
- unavailable without required metadata.

Conversions must be explicit, deterministic where possible, and independently
testable.

### Representation

The human-facing rendering of a value and unit. Representation is separate from
the stored numeric value and standard code. It includes the symbol, Unicode
form, spacing, decimal rules, significant precision and placement conventions.

TankOS must use scientifically appropriate notation consistently rather than
inventing a product-specific shorthand.

## 4. Unit lifecycle and parameter relationship

The intended relationship is:

```text
ParameterDefinition
  quantity kind
  canonical unit
  accepted input units
  conversion requirements
  representation policy

Measurement input
  value + input unit + required context
        |
        v
Units conversion and validation
        |
        v
Measurement / Digital Twin canonical value + canonical unit
```

The Units library provides the conversion and validation capability. The
ParameterDefinition domain decides which units are allowed for a particular
property and which canonical unit is used. The Measurement domain records the
source value and the normalized value according to its own evidence policy.

## Test and coverage boundary

The library enforces 100% V8 lines, statements, functions and branches for
executable production code. The coverage configuration excludes only the
type-only public barrel and test/build tooling; the public Angular entry point
is covered by its contract test.

Changing a unit definition or conversion must not silently rewrite historical
observations. Historical measurements retain their original observation data
and the applicable unit/conversion metadata so that later algorithms can be
audited or recalculated.

## 5. Salinity and other contextual quantities

Salinity is the required design example because apparently equivalent readings
are not always interchangeable through a simple rule of three.

| Representation     |  Example | Unit or scale | Meaning                                                            |
| ------------------ | -------: | ------------- | ------------------------------------------------------------------ |
| Practical salinity |     `35` | PSU / PSS-78  | Conductivity-derived practical salinity; technically dimensionless |
| Parts per thousand |     `35` | ppt / `‰`     | Approximate parts per thousand representation                      |
| Absolute salinity  |  `35.16` | `g/kg`        | Mass of dissolved salts per mass of water                          |
| Specific gravity   | `1.0264` | `1`           | Density ratio, dependent on definition and reference conditions    |
| Density            | `~1.023` | `kg/L`        | Mass per volume                                                    |
| Conductivity       |    `~53` | `mS/cm`       | Electrical property that may be used to infer salinity             |

These are related concepts, not automatically interchangeable units of one
quantity. The model must distinguish at least:

```text
Salinity
SpecificGravity
Conductivity
Density
```

When a conversion requires a method, temperature or reference conditions, that
metadata is part of the conversion input. It is not a generic property of the
unit alone.

Example observations:

```json
{
  "quantity": "salinity",
  "value": 35,
  "unit": "ppt"
}
```

```json
{
  "quantity": "specificGravity",
  "value": 1.0264,
  "unit": "1",
  "temperature": {
    "value": 25,
    "unit": "Cel"
  }
}
```

```json
{
  "quantity": "conductivity",
  "value": 53,
  "unit": "mS/cm",
  "temperature": {
    "value": 25,
    "unit": "Cel"
  }
}
```

For a conductivity-derived salinity value, TankOS should preserve the original
conductivity observation and represent salinity as a derived result linked to
the source observation. Replacing the original reading with the derived value
would lose instrument evidence and prevent later recalculation with an updated
method.

## 6. Metadata required only when necessary

The model must not force contextual conversion metadata onto every unit.

Simple transformations, such as degrees Celsius to kelvin, need only the value
and the compatible units. Contextual transformations, such as conductivity or
specific gravity to a salinity representation, may require:

- conversion method or scale;
- temperature and its unit;
- reference temperature or density convention;
- pressure or other environmental conditions where scientifically required;
- device or procedure provenance when the conversion depends on the source.

The conversion engine must report missing required metadata as a structured
validation result. It must not silently approximate or apply a simple linear
conversion when the quantity semantics do not justify it.

## 7. Conversion registry

The application requires a separate conversion capability containing the
known relationships between compatible units and quantity kinds. This registry
belongs to the Units library boundary, not to individual Measurement records.

It must support:

- standard unit identity and aliases;
- dimensional compatibility checks;
- direct conversion definitions;
- contextual conversion definitions;
- required metadata declarations;
- conversion versioning or provenance;
- explicit unsupported-conversion results;
- deterministic test vectors.

The registry must not infer compatibility from similar labels. For example,
`PSU`, `ppt`, `g/kg`, `SG` and conductivity are not accepted as interchangeable
just because aquarists often use them to describe approximately the same reef
water.

## 8. Scientific representation

Unit presentation is managed, not hardcoded independently in each screen.

The representation policy must define, per unit or quantity when necessary:

- standard symbol and Unicode form;
- whether a space separates value and symbol;
- symbol placement and ordering;
- decimal separator according to the locale;
- decimal places or significant figures;
- scientific notation rules for very large or small values;
- how dimensionless values are displayed;
- how uncertainty or qualifiers are shown;
- accessible text for symbols that are not obvious when read aloud.

The canonical machine code, scientific symbol and localized label are separate
fields. User-facing UI may localize the label, but it must preserve the
standard-facing code and scientifically correct symbol.

## 9. Angular-centric boundary

The library is Angular-centric in its public integration surface, but the unit
rules must remain independently testable from rendering.

Expected internal separation:

```text
Units domain rules
  -> pure conversion and validation services

Angular application layer
  -> injectable facades/services and typed view models

Angular UI layer
  -> unit selectors, formatted values and validation messages
```

The first scaffold may contain a standalone Angular component, but future work
must not put conversion rules in templates or component classes merely because
the library is Angular-centric.

## 10. Explicit non-goals for the first slice

The first implementation should not yet decide or implement:

- a Firestore schema;
- a FIWARE transport client;
- IoT device adapters;
- aquarium-specific parameter catalogues;
- salinity algorithms without authoritative method definitions;
- automatic dosing or treatment recommendations;
- global administration or marketplace workflows;
- historical measurement migration.

Those capabilities can consume Units through stable contracts after their own
domains are defined.

## 11. Open decisions

These points remain open and must be decided before implementing the relevant
slice:

1. The exact initial standard-code catalogue and source release.
2. Whether unit definitions are code-owned, persisted or both.
3. The identity and version policy for unit definitions and conversions.
4. Whether custom units are allowed, and under which moderation policy.
5. The exact public TypeScript API exported from `@tank-os/units`.
6. The first conversion slice and its authoritative test vectors.
7. The exact representation policy for locales and accessibility.
8. The format used to preserve conversion metadata with historical evidence.

Until those decisions are closed, this document is the authoritative record of
the current direction, not an implementation contract for unapproved behavior.
