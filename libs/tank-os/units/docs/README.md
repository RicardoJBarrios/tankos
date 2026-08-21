# TankOS Units

**Status:** core value types, dimensional compatibility, the immutable
aquarium-first standard catalogue and the first deterministic conversion slice
are implemented. Management and transport slices remain pending.

`Units` is an Angular-centric library for the identity, representation,
compatibility and conversion of units. It is intentionally independent from
values observed in the world and from the domains that may later consume those
units.

Decimal arithmetic is provided by the separate
[`Decimal`](../../decimal/docs/README.md) library through its public arithmetic
port. `Units` must not import `big.js` or own decimal normalization.

## Scope

`Units` owns:

- stable unit identity and standard codes;
- quantity dimensions and compatibility rules;
- symbols, Unicode notation, names and aliases;
- unit representation metadata;
- conversion definitions and conversion execution;
- conversion precision, rounding and failure semantics;
- unit catalogue and conversion-registry ports;
- Angular facades and presentation helpers for unit-only concerns;
- Angular management components and application services for custom-unit CRUD;
- adapters for unit catalogues or conversion sources when they are added.

The current conversion slice provides immutable standard definitions and a
conversion port for litre/millilitre, metre/centimetre, kilogram/gram,
Celsius/Kelvin, Celsius/Fahrenheit and bar/pascal. Factors and affine offsets
are represented exactly as decimal values or rational pairs; repeating results
require an explicit decimal context. This does not yet include compound,
contextual or salinity transformations.

`Units` does not own:

- `Measurement` or `Observation` records;
- `ParameterDefinition` or aquarium configuration;
- numeric values paired with units as domain observations;
- measurement methods, instruments or IoT devices;
- digital twins, historical evidence or derived observations;
- salinity, dosing or other aquarium algorithms;
- Firestore schemas, JSON resources or FIWARE transport clients.

Future domains may depend on the public unit contracts. They must not make
`Units` depend on their records or workflows.

## Custom-unit management

The library includes the Angular-facing management slice for custom units. It
does not expose mutation controls for standard definitions, which remain
read-only and versioned.

The management slice supports:

- listing units with filters and pagination;
- viewing a unit and its conversion metadata;
- creating a custom unit;
- editing a custom unit by creating a new immutable version;
- activating, deactivating and restoring a custom unit;
- deleting a custom unit according to the catalogue lifecycle policy.

### Authorization and publication

Standard units are imported from the pinned standards catalogue and cannot be
created, edited or deleted through the application.

Authenticated keepers may create private custom drafts or submit a custom-unit
proposal. Only moderators or administrators may approve and publish a custom
unit in the global catalogue. Public visibility does not grant catalogue
management authority.

The custom-unit lifecycle is:

```text
draft -> submitted -> published -> deprecated -> retired
```

Rejected or never-published drafts may be physically deleted by an authorized
administrator. A published or used unit is retired rather than physically
deleted, so historical records can continue to resolve its identity and
version.

The expected separation is:

```text
UnitListComponent / UnitDetailComponent / UnitFormComponent
                         |
                         v
              CustomUnitApplicationService
                         |
                         v
                 CustomUnitCatalogPort
                         |
                         v
                 persistence adapter
```

Components own rendering, user interaction and validation feedback. Application
services own use-case orchestration. Core validation owns unit identity,
dimension, symbol, conversion and lifecycle invariants. Persistence adapters
own DTO validation and mapping. No component may write Firestore, HTTP or
custom catalogue documents directly.

The management UI must make the distinction visible:

- standard units are viewable but not editable or deletable;
- custom units show namespace, version and lifecycle state;
- editing creates a new version instead of mutating a published definition;
- deactivation removes a unit from normal selection without destroying its
  historical definition;
- conversion definitions are edited through their own responsibility and are
  not hidden inside an unrelated unit form.
- publication state and moderation responsibility are visible separately from
  whether the unit is active for new selections.

The CRUD feature follows the repository testing guardrails. Application
services use focused Vitest tests, rendered Angular components use Spectator,
and persistence adapters use their appropriate emulator or transport tests.

### Management use cases

The management boundary is divided into read and mutation capabilities:

```text
ListUnits
  filters: namespace, system, dimension, quantityKind, status, text
  pagination: page size + opaque continuation

GetUnit
  input: UnitCode + optional version

CreateCustomUnit
  input: validated CustomUnitDraft
  output: published or draft custom UnitDefinition

EditCustomUnit
  input: existing custom UnitCode + new definition
  output: new immutable version

ChangeCustomUnitStatus
  input: custom UnitCode + lifecycle transition
  output: updated version

DeleteCustomUnit
  input: custom UnitCode + explicit confirmation
  output: lifecycle result according to the configured deletion policy
```

`ListUnits` and `GetUnit` may return standard and custom definitions. Mutation
use cases must reject standard definitions with a typed read-only error. The
application layer must not infer authorization from the unit document; an
authorization port or the hosting application supplies that boundary.

### Management contracts

The initial application ports are intentionally separate:

```ts
interface UnitCatalogQueryPort {
  list(request: ListUnitsRequest): Promise<Page<UnitDefinition>>;
  get(request: GetUnitRequest): Promise<UnitDefinition | undefined>;
}

interface CustomUnitCommandPort {
  create(request: CreateCustomUnitRequest): Promise<UnitDefinition>;
  edit(request: EditCustomUnitRequest): Promise<UnitDefinition>;
  changeStatus(request: ChangeCustomUnitStatusRequest): Promise<UnitDefinition>;
  delete(request: DeleteCustomUnitRequest): Promise<DeleteUnitResult>;
}
```

The concrete TypeScript names may be refined during implementation, but the
separation is mandatory: queries must not expose mutation behavior and command
ports must not leak persistence DTOs. Pagination uses an opaque continuation
value and filters are applied to the complete query, not just the visible
page.

### Component responsibilities

The Angular management surface is split by responsibility:

- `UnitListComponent`: filters, sorting, pagination, loading, empty, error and
  selection states;
- `UnitDetailComponent`: read-only definition, standard metadata, conversion
  functions, versions and lifecycle state;
- `UnitFormComponent`: create/edit draft fields, dimension and conversion
  validation feedback, symbol and code preview;
- status/deletion confirmation components: explicit confirmation and result
  feedback, without embedding command orchestration in the template.

Each component receives typed view models and emits user intents. The
application services perform commands and queries; components do not contain
conversion formulas, persistence calls or authorization decisions.

### Lifecycle and deletion boundary

Custom-unit management inherits the repository-wide data lifecycle defined in
[`PARAMETER_CONFIGURABILITY_PLAN.md`](../../../../.codex/product/PARAMETER_CONFIGURABILITY_PLAN.md)
and the reusable batch execution rules in
[`BATCH_OPERATIONS_FINAL_SPEC.md`](../../../../.codex/product/BATCH_OPERATIONS_FINAL_SPEC.md).
The Units library must not create a local lifecycle variant.

The inherited rules are:

- the persistence model is strict NoSQL; there are no foreign keys or cascade
  deletes;
- a unit can be created or edited only when its complete schema and validation
  contract is valid;
- every persisted unit carries an immutable `schemaVersion`;
- editing a published definition creates a new version/record; the previous
  record is not mutated and is deprecated or retired according to its usage;
- deprecated and retired records are unavailable for new selections but remain
  resolvable for historical records; only administrators may inspect or restore
  them when the domain policy permits restoration;
- never-published or never-used drafts may be physically deleted after explicit
  confirmation;
- restoration clears only lifecycle state and records server lifecycle
  metadata; it does not change business content;
- physical deletion is irreversible through the application and is not the
  normal operation for a published or used unit;
- all lifecycle timestamps and actor metadata are server-generated.

The custom-unit command surface therefore maps to the global lifecycle:

```text
submit      -> create or update a proposal without global publication
publish     -> moderator/admin creates the active global version
edit        -> create replacement version + deprecate previous published version
deactivate  -> change lifecycle state without changing unit meaning
restore     -> restore an eligible deprecated/retired version, administrator-only
delete      -> definitive physical deletion only for never-published/unused data
```

### Batch inheritance

Bulk unit operations use the shared `BatchOperations` domain and execution
engine. The Units management screen owns the operation it creates; it does not
wait synchronously for completion. The inherited batch behavior is:

- filters apply to the complete result set, not only the current page;
- confirmation freezes the complete matching scope;
- execution is asynchronous, resumable and partial-failure tolerant;
- one confirmation covers the complete batch;
- the temporary batch schema stores the batch identity, affected schema,
  frozen scope, logical IDs, processing state and mandatory metadata;
- the temporary batch entity is deleted after completion;
- warnings and execution details do not modify the original unit schema;
- concurrent operations use natural server ordering and last-applied-wins;
- deletion is terminal: a later modification does not recreate a physically
  deleted unit and returns a warning;
- published or used units are retired rather than physically deleted;
- failed items remain retryable and retain the global lifecycle state required
  for follow-up.

Batch operations may mark, modify or physically delete units according to the
same reusable policies as every other managed entity. Units must provide only
the entity-specific validation, mapping and authorization hooks.

### Firestore and cost boundary

Units inherits the shared Firestore cost policy; it must not create a more
expensive persistence strategy for unit CRUD. Standard unit definitions are
code-owned and versioned, so they do not generate Firestore writes for ordinary
catalogue reads. Only custom-unit lifecycle and management state are persisted.

The Units adapter must:

- use cursor-based pagination with a stable ordering and no offsets;
- avoid real-time listeners over the complete custom-unit catalogue or batch
  chunks;
- use transactions for version replacement, where the current custom unit is
  read before the new version is created and the previous version is marked;
- use bounded write batches for independent lifecycle writes;
- materialize a filtered batch scope once and store bounded chunk manifests,
  not one progress document per unit by default;
- update batch progress per chunk and store only warnings or failures that need
  individual inspection;
- exclude conversion definitions, aliases, diagnostic metadata and other
  non-query fields from indexes where the Firestore adapter does not query
  them;
- remove temporary batch and chunk documents after terminal completion;
- reject or require an explicit administrator decision for scopes above the
  configured maximum before any writes begin.

For example, editing one custom unit normally produces the replacement version
and the lifecycle transition of the previous version in one transaction. A
large status or deletion operation additionally incurs one read per candidate
unit during scope freezing, one lifecycle write per successfully processed
unit, bounded chunk/progress writes and, for definitive deletion, one delete
per physically removed unit. The adapter must not add per-unit progress writes
unless the Units product explicitly requires that level of inspection.

The Units library owns the operation-specific cost estimate shown before
confirmation; the reusable batch engine owns the execution counters and usage
metrics. Neither layer embeds provider prices. A hosting application supplies
regional pricing, quota and budget alert configuration.

### Catalogue cache policy

Unit definitions are reference data and normally change infrequently. The Units
application should therefore use a long local-cache TTL for the standard and
custom catalogue, subject to the global cache contract in
[`firestore-data-access-and-finops.md`](../../../../.codex/architecture/firestore-data-access-and-finops.md).

The cache key must include at least the catalogue identity, catalogue/schema
version and authorization scope. A cached catalogue is valid for normal reads
until its TTL expires, but it must be invalidated or refreshed immediately
after a successful custom-unit create, edit, restore, activation or
deactivation that can affect the visible catalogue. A failed mutation must not
discard a valid catalogue entry without evidence that it is stale.

The management UI must offer a manual one-shot “refresh” action. It maps to the
provider-independent `refresh`/`network-only` cache directive; it must not turn
off caching globally or alter the catalogue TTL. After a successful refresh,
the response replaces the cached catalogue and resets its validation time.

Long TTL does not permit stale data to bypass authorization. A change of user,
permissions or active scope invalidates the previous entry before rendering.

### CRUD test contract

The management feature must include tests for:

- standard-unit read-only behavior;
- custom-unit creation and validation errors;
- duplicate qualified codes;
- dimension and conversion incompatibilities;
- custom-unit editing as a new version;
- status transitions and invalid transitions;
- list filters across all pages;
- opaque pagination and empty results;
- detail loading, not-found and infrastructure failures;
- deletion confirmation, cancellation, logical deletion and restoration;
- concurrent or stale-version command conflicts when the adapter exposes them;
- Angular loading, success, empty, validation, confirmation and recoverable
  error states.

Every executable source file will have its paired spec file. Pure unit rules
use Vitest, Angular rendered components use Spectator, and persistence
behavior uses the adapter's integration test boundary.

## Standards-first direction

The standard-facing identity will follow the closest applicable standard:

1. UN/CEFACT Common Codes for Units of Measurement, including UNECE
   Recommendation 20 and its applicable code-list release.
2. FIWARE and NGSI-LD conventions at the integration boundary, especially the
   `unitCode` representation used by NGSI-LD properties.
3. A documented TankOS extension only when the standards cannot represent a
   required unit or scientific distinction.

The standard code is the mandatory public machine reference for a unit. A
localized label, local alias, UI symbol or internal database identifier must
never replace it in public APIs, persisted domain references or templates.
FIWARE support belongs in an adapter or mapping boundary; this library must not
become an NGSI-LD client.

The initial catalogue must record the exact source release and provenance of
each imported code. The first operational subset includes separate UK and US
gallon definitions (`GLI` and `GLL`) so the system never collapses those
systems into one ambiguous gallon. A future change of the external code list
must not silently change the identity of an existing unit.

The source catalogue and the operational catalogue are separate. TankOS may
retain a complete versioned snapshot of the official code list for traceability,
but the first operational catalogue will be an aquarium-first subset. Units
must not become available in the product merely because they exist in
Recommendation 20.

## Supported unit systems

TankOS must support the unit systems commonly encountered in aquarium
documentation and equipment:

- SI and metric units;
- British Imperial units;
- US customary units.

British Imperial and US customary units are separate systems. They must never
be represented by one ambiguous `imperial` flag or by an unqualified label such
as `gallon`. A catalogue entry must identify the exact unit, system and
standard-facing code. For example, an Imperial gallon and a US liquid gallon
must be different units with different conversion factors to litres.

SI should be the preferred canonical system for generic scientific and
interoperability calculations, but the library must not reject Imperial or US
customary input when a unit is defined and dimensionally compatible. The
choice of a canonical unit belongs to a consuming domain; `Units` only provides
the system identities and conversions.

The same distinction applies to units such as fluid ounces, pints, pounds,
ounces, inches and Fahrenheit. A display label may be localized, but it must
not hide whether a value uses SI, British Imperial or US customary units.

## Concepts

### Unit

An immutable definition of a unit, identified publicly by its standard code and
the applicable standard/code-list namespace. An internal identity may exist for
storage, but it is never the functional reference exposed to consumers. A unit
describes what it means and how it is represented; it does not contain a
measured value.

Expected concerns include:

- stable identifier;
- standard system and code;
- quantity dimension or compatible quantity kind;
- canonical scientific symbol;
- Unicode and ASCII-safe representations where needed;
- singular, plural and localized labels;
- accepted aliases for parsing or import;
- conversion family and reference-unit relationship;
- definition and catalogue version.

Public unit references must use the standard code. If two standards or code
list releases could assign the same textual code different meanings, the
reference must include its standard namespace and code-list version rather
than falling back to a local identifier.

The canonical public code shape is `namespace:code`, for example
`UN/CEFACT:LTR` or `TANKOS:CUSTOM-SCOOP`. The namespace and code are
case-sensitive after normalization. Catalogue version is metadata, not part of
the functional code. Symbols, aliases, translated names and internal storage
IDs are never accepted as public references.

The planned unit presentation pipe therefore has this contract:

```html
{{ volume | tankUnit: sourceStandardUnitCode }} {{ volume | tankUnit: sourceStandardUnitCode : targetStandardUnitCode }}
```

The first code identifies the unit in which the numeric value is expressed.
The optional second code identifies the unit in which the value should be
displayed. When the second code is omitted, the pipe displays the source unit
without conversion. When it is present, the pipe delegates to the conversion
capability, resolves the target unit by standard code and renders the converted
value using the target representation policy.

The pipe must reject symbols, aliases and internal identifiers as references.
It must also reject incompatible units, unknown codes and conversions that
require contextual metadata not supplied to the pipe. It must never silently
apply an approximate conversion. Contextual transformations require an
explicit conversion function and parameters. Errors produce the configured
fallback representation (`—` by default) and are reported through a display
error port.

The eventual API may add display options after the two codes, for example a
locale or precision policy, but those options must not change the meaning of
the source and target standard codes.

### Quantity dimension

A compatibility signature used to decide whether two units express the same
kind of physical quantity. It is not a measurement and does not identify an
aquarium parameter.

Examples of unit families include:

```text
temperature        -> kelvin, degree Celsius, degree Fahrenheit
pressure           -> pascal, bar, psi
conductivity       -> siemens per metre, millisiemens per centimetre
mass concentration -> kilogram per cubic metre, milligram per litre
```

The model must distinguish dimensional compatibility from domain similarity.
Two representations commonly used for the same aquarium concept are not
automatically units of the same dimension.

### Conversion

A conversion is a declared transformation between compatible units. The first
conversion engine should support explicit, deterministic conversions such as:

```text
degree Celsius <-> kelvin
bar             <-> pascal
millisiemens per centimetre <-> siemens per metre
```

Conversion definitions must state:

- source and target unit identities;
- conversion family or reference unit;
- factor and offset, when applicable;
- precision and rounding policy;
- supported input range, when bounded;
- definition version and provenance;
- structured errors for unsupported or invalid conversions.

Contextual scientific transformations are not ordinary unit conversions. For
example, conductivity plus temperature plus a method may produce a salinity
value. That belongs to a future domain transformation capability, not to the
base linear conversion formula, but it is still part of the generalized
conversion-function capability described below.

### Conversion functions

All conversions are modeled as versioned functions with declared input and
output schemas. A linear conversion is simply a function with one primary
numeric input and no additional parameters.

```text
ConversionFunction
  code
  version
  inputs
  outputs
  implementation
```

An invocation contains a primary value and, when required, additional typed
parameters. Parameters may themselves carry a standard unit code:

```text
ConversionRequest
  functionCode
  functionVersion
  primaryInput: value + sourceUnitCode
  parameters: {
    temperature: value + unitCode
    pressure: value + unitCode
    method: methodCode
  }
```

The result is structured rather than being only a naked number:

```text
ConversionResult
  primaryOutput: value + targetUnitCode
  outputs: additional named outputs
  appliedParameters
  functionCode
  functionVersion
```

The function schema declares required and optional inputs, accepted unit codes,
value constraints and output types. Missing, invalid or incompatible
parameters are structured conversion errors. Functions must not silently
discard supplied parameters or invent missing context.

For example, a practical-salinity function may accept conductivity, temperature
and a method, and return practical salinity plus the normalized parameters used
by the function. This is still a unit-library conversion capability; it is not
a `Measurement` or `Observation` record.

### Representation

`Units` owns the canonical representation of a unit, while full numeric-value
formatting may be owned by a later presentation layer. Representation metadata
must define, where relevant:

- scientific symbol and Unicode form;
- ASCII fallback;
- spacing between a value and symbol;
- symbol placement and ordering;
- singular, plural and localized labels;
- accessibility text;
- decimal and significant-figure guidance;
- scientific-notation guidance for extreme magnitudes;
- representation of dimensionless units.

The machine code, scientific symbol and localized label are separate fields.
Scientific notation must be used consistently; a product-specific shorthand
must not replace the standard notation.

## Conversion model

The conversion engine must follow this boundary:

```text
source Unit + target Unit
              |
              v
     compatibility validation
              |
              v
       declared conversion
              |
              v
      normalized numeric result
```

The engine must not infer conversion from similar names, symbols or aliases.
It must reject:

- unknown units;
- units from incompatible dimensions;
- missing conversion definitions;
- invalid numeric input;
- values outside a declared supported range;
- conversions requiring context that has not been supplied.

The base API should distinguish a pure unit conversion from a contextual
transformation. Contextual metadata must not be added to every unit merely to
support future salinity algorithms.

## Persistence and integration boundary

The first unit model should be storage-independent. The library may expose
ports for:

- reading a catalogue;
- resolving a unit by stable identity or standard code;
- listing compatible units;
- resolving a conversion definition;
- executing a conversion.

Firestore, JSON/HTTP and FIWARE adapters may be added later. Their DTOs must
remain outside the core unit contracts and be validated at the adapter
boundary.

Unit catalogue changes and conversion-definition changes require explicit
versioning. A future consumer may preserve the unit and conversion versions it
used, but `Units` itself does not own historical measurement records.

Custom units are supported from the first implementation. Their definitions
are persisted through a catalogue port and follow `draft`, `active` and
`inactive` lifecycle states. Publishing a change creates a new immutable
version; an existing custom code cannot be reused for a different meaning.

## Angular-centric architecture

The public integration surface is Angular-centric, while unit rules remain
independently testable:

```text
Angular presentation/services -> application ports -> unit core rules
                                                   <- catalogue/conversion adapters
```

Expected areas are:

- `core`: unit contracts, value types and pure compatibility rules;
- `application`: catalogue and conversion use-case facades;
- `composition/standard`: the configured standard conversion factory;
- `adapters`: standard catalogues, persistence and external representations;
- `presentation`: unit-only labels, symbols and selectors.

Conversion rules must not live in templates or Angular components.

The package follows the same boundary discipline as `Time`:

```text
core
  ports, value-types, validation
application
  catalogue, conversion and display services/tokens
composition/angular
  Angular providers and dependency wiring
adapters
  generated standard catalogue, custom catalogue, decimal engine and
  transport integrations
presentation
  unit-only pipes and display helpers
```

The dependency direction is strict:

```text
presentation -> application -> core
adapters      -> core
composition   -> application, adapters
```

The standard catalogue and conversion definitions remain adapters. The
standard conversion factory is composition because it wires those adapters
into the application conversion service.

Core contracts must not depend on Angular, Firebase, Firestore, HTTP, FIWARE
or `Time`. A compound dimension may include the `time` base dimension, but
that is a dimensional exponent and does not create a runtime dependency on the
`Time` library. The library must use Angular `inject()`, ports and adapters,
one semantic responsibility per file, directory barrels for public surfaces
and paired Given/When/Then tests according to the repository guardrails.

## Test and coverage boundary

The library must maintain 100% V8 coverage for executable production code:

- lines: 100%;
- statements: 100%;
- functions: 100%;
- branches: 100%.

Tests must be paired with their implementation files and written as
Given/When/Then behavior specifications. They must cover successful conversion,
incompatible units, missing definitions, invalid values, precision boundaries,
rounding and all public input variants. The repository-wide testing guardrails
define the required `NaN`, infinities, nullability, string and structured-input
matrix.

Type-only contracts and empty public barrels do not need runtime test files,
but their public import paths must be covered by contract tests once the API
exists.

## Explicit non-goals for the first implementation slice

The first implementation must not add:

- `Measurement`, `Observation` or `ParameterDefinition` models;
- aquarium-specific unit catalogues;
- salinity algorithms or method-specific transformations;
- device, sensor or IoT integrations;
- Firestore persistence;
- FIWARE synchronization clients;
- advanced marketplace discovery, external moderation workflows or cross-domain
  administration dashboards;
- automatic dosing, alerts or recommendations.

## Accepted implementation decisions

The following decisions are closed for the first implementation:

1. **Standard and catalogue:** use UN/CEFACT Recommendation 20, pinned to the
   official Rev17 source snapshot. Keep the complete source catalogue
   versioned, but expose an aquarium-first operational subset covering length,
   area, volume/capacity, mass, temperature, pressure, flow, conductivity and
   concentration. SI, British Imperial and US customary units are supported.
2. **Ownership:** standard definitions and conversion functions are
   code-owned, versioned and immutable. The architecture supports persisted
   catalogue configuration and custom units from the first implementation.
3. **Identity and versioning:** public references use immutable qualified codes
   such as `UN/CEFACT:LTR` or `TANKOS:CUSTOM-SCOOP`. Catalogue definitions and
   conversion functions are versioned; changes create new versions.
4. **Dimensions:** use seven SI base dimensions and compound dimension
   signatures. Keep `QuantityKind` and `ConversionFamily` separate from the
   dimensional signature.
5. **Conversions:** model every conversion as a versioned function with
   declared input and output schemas. Linear, affine, compound and contextual
   conversions are supported. Salinity is a contextual family, not a special
   hardcoded exception.
6. **Precision:** use replaceable decimal arithmetic internally. The first
   adapter is `big.js`; the public/core contracts do not expose its types.
   Accept finite numbers and canonical decimal strings, reject `NaN` and
   infinities, avoid implicit rounding, and declare range and rounding policies
   per function.
7. **Representation:** use canonical scientific Unicode symbols, explicit
   ASCII fallbacks, localized names through a replaceable locale port and
   standard spacing/composition rules.
8. **Public API:** expose qualified unit codes, unit definitions, dimension
   signatures, catalogue/conversion/presentation ports, Angular services and
   the `tankUnit` pipe. Do not expose internal tables, transport DTOs or
   measurement-domain models.

The implementation must follow these decisions. Any future change to them
requires an explicit library documentation update before code changes.

## Implementation contract refinements

The following details refine the accepted decisions and are implementation
contracts rather than new product scope.

### Decimal values

The canonical internal value is a decimal string:

```ts
type DecimalValue = string;
```

The first concrete arithmetic adapter is `big.js`, consumed through the
packaged `@tank-os/decimal-big-js` adapter package. Only the adapter may
import `big.js`; core contracts and application ports use
`DecimalValue` and decimal contexts. A future adapter may replace it without
changing the public Units API.

Public boundaries may accept finite JavaScript numbers and canonical decimal
strings, but normalize them immediately. Exact values from forms, JSON,
Firestore or measurements should use strings. `NaN`, positive and negative
infinity, `null`, `undefined`, empty strings, whitespace, locale separators,
hexadecimal values and other ambiguous numeric formats are rejected.

Scientific notation such as `1e-6` is accepted and normalized to the canonical
decimal representation. Negative zero is normalized to `0`. Arithmetic never
uses JavaScript `number` after normalization.

Conversion does not round implicitly. Addition, subtraction and multiplication
retain the exact representable decimal result. Division and any other
non-terminating operation require an explicit context:

```ts
type DecimalValue = string;

interface DecimalContext {
  decimalPlaces: number;
  rounding: RoundingMode;
}

interface DecimalArithmeticPort {
  add(left: DecimalValue, right: DecimalValue): DecimalValue;
  subtract(left: DecimalValue, right: DecimalValue): DecimalValue;
  multiply(left: DecimalValue, right: DecimalValue): DecimalValue;
  divide(left: DecimalValue, right: DecimalValue, context: DecimalContext): DecimalValue;
  compare(left: DecimalValue, right: DecimalValue): -1 | 0 | 1;
}
```

The decimal adapter owns conversion to and from `big.js`, division-by-zero
errors and mapping of arithmetic failures. Precision of calculation is
separate from precision of display. Display pipes may round only when their
explicit presentation options require it.

The initial RoundingMode vocabulary is:

```text
up
down
half-up
half-even
ceil
floor
```

The adapter must use an isolated configuration per operation or request. A
mutable process-wide precision setting is not part of the Units contract.

### First implementation slices

Implementation proceeds in this order:

1. `DecimalValue`, validation, `DecimalContext` and the decimal adapter;
2. `UnitCode`, `DimensionSignature`, `QuantityKind` and immutable definitions;
3. compatibility and the generated aquarium-first standard catalogue;
4. linear, affine and compound conversion functions;
5. scientific representation, locale port and `tankUnit` presentation;
6. in-memory custom catalogue and application ports;
7. Angular CRUD components and services;
8. local cache with TTL and manual refresh;
9. Firestore and JSON/HTTP adapters;
10. contextual conversions such as salinity.

The first slices must not introduce Measurement, ParameterDefinition,
Firestore persistence, FIWARE clients or salinity algorithms.

### Identity and lifecycle state

The qualified `namespace:code` identifies the logical unit. A server-generated
immutable `versionId` identifies one published definition. Codes are never
reused for a different meaning and standard/custom namespaces cannot collide.

Publication and availability are separate state machines:

```text
draft -> submitted -> published -> rejected
published/active -> deprecated -> retired
```

Keepers may create and edit their own drafts and submit proposals. Moderators
or administrators publish global custom units. Administrators may retire,
restore or remove eligible drafts. Published or used versions are never
edited or physically deleted in normal application flows; editing creates a
complete replacement version.

### Planned initial conversions and test vectors

The complete first conversion set is planned as:

```text
L <-> mL
m <-> cm
kg <-> g
°C <-> K
°C <-> °F
bar <-> Pa
L/min <-> m³/h
mS/cm <-> S/m
```

Each conversion has deterministic reference vectors, declared range and
rounding behavior. The current deterministic slice implements L/mL, m/cm, kg/g,
°C/K, °C/°F and bar/Pa. L/min/m³/h and mS/cm/S/m require their compound unit
definitions before they can be added to the operational catalogue. Contextual
salinity functions are deferred until the function input/output contract is
implemented; they will accept parameters such as conductivity, temperature and
method rather than becoming special hardcoded unit formulas.

### Cache defaults

The standard catalogue is generated, immutable reference data and uses a
versioned application asset with a long local-cache lifetime. The initial
custom-catalogue cache policy is:

```text
standard catalogue: up to 30 days or application-version invalidation
custom catalogue: 7 days, invalidated after successful local mutation
drafts: session cache or short TTL
```

All reads remain `cache-first` by default. The management UI exposes a one-shot
`refresh`/`network-only` action. User, permission and Aquarium-scope changes
invalidate incompatible entries before rendering.

### Quantity kinds and dimensions

The initial controlled quantity-kind vocabulary includes `length`, `area`,
`volume`, `mass`, `temperature`, `pressure`, `flow`, `conductivity`,
`massConcentration`, `density`, `practicalSalinity`, `absoluteSalinity` and
`specificGravity`. Compatibility is determined by the dimension signature and,
where required, by quantity kind and conversion family.

### Conversion functions

Every conversion is a versioned function with declared inputs, outputs,
constraints and required parameters. Linear, affine, compound and contextual
conversions use the same function boundary. A result contains the primary
output, additional named outputs, applied parameters and function provenance.
Salinity functions may require conductivity, temperature, pressure and method
parameters; they are not hardcoded as a special-case formula.

### Initial operational catalogue

The first operational subset is aquarium-first: length, area, volume/capacity,
mass, temperature, pressure, flow, conductivity, concentration and the
explicitly defined salinity-related scales. The complete Rec20 snapshot is
retained for provenance, but irrelevant units such as joules are not exposed
until a real use case requires them.

### Catalogue import

The standard catalogue is generated reproducibly from the pinned Rec20 Rev17
source snapshot. The import records the source file, revision, publication
metadata and SHA-256 hash, then validates codes, symbols, dimensions and
conversion vectors before generating the code-owned catalogue. Custom units
are resolved through a separate catalogue port and cannot modify generated
standard definitions.
