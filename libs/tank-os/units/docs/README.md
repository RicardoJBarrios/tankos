# TankOS Units

**Status:** the provider-independent unit model, standard catalogue,
deterministic conversion slice and custom-unit CRUD application contract are
implemented. Persistence and transport adapters are separate packages; the
standard CRUD UI is not part of this library's current public API.

`@tank-os/units` is an Angular-centric capability library for unit identity,
dimensional compatibility, scientific representation and declared conversion.
It models units only; it does not model measurements or observations.
Unit definitions are global technical catalogue entries and have no relationship
to an Aquarium, keeper or Aquarium configuration. A Measurement or another
domain record may reference a unit code, but the reference belongs to that
record and never creates an ownership or configuration relationship from the
unit back to an Aquarium.

## Boundaries

Units owns:

- qualified standard unit codes;
- unit systems, quantity kinds and dimensional signatures;
- symbols, Unicode notation, ASCII fallbacks and symbol placement;
- immutable conversion definitions and conversion execution;
- read-only catalogue and conversion ports;
- the standard catalogue composition;
- the global custom-unit CRUD application boundary.

Units does not own:

- `Measurement`, `Observation` or numeric values paired with units as domain
  records;
- `ParameterDefinition`, aquarium configuration, instruments or IoT devices;
- salinity, dosing or other contextual aquarium algorithms;
- Firestore, JSON/HTTP or FIWARE clients;
- custom-unit persistence adapters, moderation screens or batch workflows.

The core depends on the public arithmetic port from
[`@tank-os/decimal`](../../decimal/docs/README.md). It does not import Big.js
or perform its own decimal normalization.

## Public model

Every public reference uses a qualified standard code such as
`UN/CEFACT:LTR`. Labels, aliases and symbols are display metadata and must not
replace that code in APIs or persisted domain references.

`UnitDefinition` is an immutable, value-free definition containing:

- `code` and `catalogueVersion`;
- `system` (`si`, `metric`, `british-imperial`, `us-customary` or `custom`);
- a complete SI-base `DimensionSignature`;
- a semantic `QuantityKind`;
- scientific `UnitRepresentation` metadata;
- a conversion family and lifecycle status.

Dimensional compatibility is structural. Units with the same dimension can be
compatible even when their semantic quantity kinds or display systems differ;
similar names do not make units compatible.

Representation metadata records the standard symbol, an ASCII fallback, its
prefix/suffix position and spacing rule. Formatting is presentation work; the
unit model does not turn a measurement into a formatted string.

## Standard catalogue

The current catalogue is an immutable aquarium-first subset of
UN/CEFACT Recommendation 20, pinned as `UN/CEFACT-Rev17-aquarium-core`.
It contains 13 definitions:

| Family | Codes |
| --- | --- |
| volume | `LTR`, `MLT`, `GLI`, `GLL` |
| length | `MTR`, `CMT` |
| mass | `KGM`, `GRM` |
| temperature | `CEL`, `KEL`, `FAH` |
| pressure | `BAR`, `PAL` |

`GLI` (British Imperial gallon) and `GLL` (US gallon) are distinct units.
The catalogue never collapses them into an ambiguous `gallon`.

The operational catalogue is intentionally smaller than a complete standards
snapshot. A code is not enabled in TankOS merely because it exists in the
external standard. Any catalogue expansion must record its source release and
provenance without silently changing an existing code's meaning.

`createEffectiveUnitCatalogue()` combines the fixed standard catalogue with
active custom definitions, orders codes deterministically and rejects custom
entries with invalid systems or code collisions. Deprecated and retired custom
units are not available for new conversions.

## Conversion contract

`UnitConversionPort` executes a declared conversion between two known,
dimensionally compatible codes. A `ConversionDefinition` declares:

- source and target codes;
- a stable code and version;
- an origin (`standard` or `custom`);
- a conversion family and kind (`linear` or `affine`);
- an exact decimal factor, represented as a rational pair;
- an optional affine offset, also represented exactly;
- optional division context for repeating results;
- provenance.

The first deterministic definitions cover both directions for litre/millilitre,
metre/centimetre, kilogram/gram, Celsius/Kelvin, Celsius/Fahrenheit and
bar/pascal. Conversion does not infer formulas from names or symbols, and it
does not silently accept an unknown code, incompatible dimension or missing
declared definition.

Decimal normalization and arithmetic are delegated to the injected
`DecimalArithmeticPort`. Exact factors and offsets are preserved; repeating
results require the explicit context declared by the conversion definition.
The conversion service returns the result value, source and target codes, and
the conversion definition identity and version.

Contextual transformations are deliberately not ordinary linear conversions.
Salinity is the motivating example: PSU, ppt, specific gravity, density and
conductivity are different quantities or methods and may require temperature
or calibration metadata. They belong to a future contextual transformation
capability, not to a factor-only unit definition.

## Architecture

The source layout follows ports and adapters:

```text
core ports and value types
          |
application conversion service
          |
standard catalogue adapter
          |
standard composition
```

The core is framework- and provider-neutral. The standard adapter owns the
catalogue and conversion definitions. `createStandardUnitConversionService()`
composes the standard catalogue with the injected decimal arithmetic adapter.
`createUnitDefinitionCrudService()` composes the generic CRUD port for the
global custom catalogue and rejects standard definitions at the application
boundary. Replacement uses the shared versioned workflow: it creates the new
custom definition and then marks the previous record for deletion. No Angular
component or template contains conversion logic.

Custom-unit persistence and transport are published behind separate adapter
packages (`units-firestore` and `units-json-http`). They validate DTOs at their
boundary and keep provider types out of the core contracts. Authorization,
Firestore configuration, indexes, cache policy and batch execution belong to
the hosting application and shared data-access capabilities.

Custom conversion definitions follow the same boundary: standard conversions
are immutable catalogue entries, while custom conversions are managed through
`createConversionDefinitionCrudService()` and the shared versioned CRUD
workflow. Before persistence, `validateConversionDefinition()` requires both
endpoints to be active in the effective catalogue and dimensionally compatible.

## Testing and publication

Tests are paired with the implementation responsibility and use Given/When/
Then descriptions as executable documentation. They cover public value
constructors, invalid inputs, dimensional compatibility, catalogue lookup,
conversion definitions and the standard conversion composition.

The library is packaged with Nx `ng-packagr-lite` and exposes its public API
through `@tank-os/units`. Run:

- `pnpm nx run units:build`
- `pnpm nx run units:test`
- `pnpm nx run units:lint`

The test target enforces 100% V8 coverage for executable production code.
