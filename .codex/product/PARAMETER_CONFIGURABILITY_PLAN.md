# Configurable Parameter Properties Master Plan

**Status:** user-prioritized planning area; this document does not authorize an
implementation or choose any unresolved product option.

**Decision authority:** the user/product owner. This plan consolidates the
known work around configurable measurable properties. In TankOS's language, a
measurable property is a **Parameter**. A risk, dependency or candidate phase
in this document is not an acceptance, rejection, prioritization or scope
decision.

**Recorded technical precedence:** when a recorded product decision conflicts
with a technically required practice for Firebase/Firestore security,
consistency, limits, reliability or data integrity, the technically correct
solution prevails. The deviation and its resulting behavior must be documented.

**Recorded BatchOperations architecture:** batch management is a domain of its
own, not a generic helper inside `shared`. It uses a reusable execution engine
through ports/adapters. The domain owns lifecycle, confirmation, frozen scope,
authorization policy, resumability, warnings, concurrency semantics and
terminal cleanup. The reusable engine owns chunking, progress, idempotency,
retries and partial execution. Firebase/Firestore is the initial execution
adapter.

**Recorded direction:** the user has decided that `ParameterDefinition` is a
persisted domain of its own. Keepers may create definitions and all users may
list and view the global catalogue and select definitions for their Aquariums.
Only administrators may edit or delete definitions. This supersedes the
earlier generic wording that granted every user complete CRUD.

**Recorded catalogue direction:** the product will expose a marketplace or
global catalogue of `ParameterDefinition` items. Every Aquarium may discover
the definitions, while each Aquarium has an independent profile selecting the
definitions it uses.

**Recorded custom-definition scope direction:** custom `ParameterDefinition`
records belong to the global TankOS catalogue and are available to all
Aquariums. A keeper independently enables or disables a definition in each
Aquarium they manage. The Aquarium profile does not duplicate, transfer or
change the definition's catalogue authorship or management permissions.

**Recorded custom-definition lifecycle direction:** a published or used
definition is never edited or physically deleted as a normal operation. An
administrator creates a new immutable version and deprecates or retires the
previous one. The old version stops being available for new Measurements or
Aquarium selections while historical Measurements remain interpretable through
their embedded evidence snapshot. Physical deletion is reserved for drafts or
versions proven never to have been published or used, with explicit
confirmation. No automatic cascade or foreign-key cleanup is introduced.

**Recorded Aquarium-profile behavior for retired definitions:** when a global
`ParameterDefinition` version is deprecated or retired, any existing Aquarium
profile selection becomes inactive but remains recoverable. The keeper or an
administrator may remove that inactive selection from the profile. It cannot
be re-enabled while the global version is unavailable for new selections; an
administrator must restore it globally first when restoration is permitted.
After global restoration, the keeper may enable it again in the Aquarium.

**Recorded custom-definition edit direction:** an administrator edit creates a
new `ParameterDefinition` version, deprecates or retires the previous version
and leaves existing Measurements attached to their original definition
snapshot. The new version becomes the active global catalogue definition;
editing never rewrites historical evidence.

**Recorded profile-version direction:** Aquarium profiles are not migrated
automatically when a new definition version is created. Existing profiles keep
their reference to the previous version, which becomes locked and, when
deprecated or retired, inactive. A keeper or administrator may remove that
local selection, but cannot edit it. A new Aquarium selection is created
against the active definition version.

**Recorded definition-identity direction:** every `ParameterDefinition` has a
server-generated opaque technical identifier. The identifier is immutable and
separate from the visible name or editable presentation code; versions and
historical Measurements use the stable technical identity plus their version
context rather than a user-supplied key.

**Recorded six-point architectural closure:** the final model uses a stable
`definitionId`, an immutable server-generated `versionId` and a sequential
`version` number. Aquarium profiles store `definitionId + versionId` without a
foreign key, and Measurements embed a self-contained semantic snapshot. All
definition edits, including presentation-only changes, create a new version.
Creator and administrative provenance are persisted, and FIWARE/UN/CEFACT
mapping uses standard codes where available without inventing codes for
unsupported quantities. The complete contract is authoritative in
[`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md).

**Recorded greenfield implementation direction:** TankOS has no users or
production Measurements that require a compatibility migration. The new
ParameterDefinition model will therefore replace the hard-coded five-Parameter
implementation from the first implementation slice. Existing tests and
fixtures must be updated, but no production data migration is required.

**Recorded FIWARE implementation direction:** FIWARE/NGSI-LD interoperability
will not be postponed to a later adapter phase. The implementation will use
existing, established Smart Data Models and their schemas/fixtures from the
first slice, selecting the closest applicable models for the Aquarium Digital
Twin and water-quality measurements. Any TankOS-specific extension must be
explicit and tested at the point where it is introduced.

**Recorded FIWARE structure direction:** `ParameterDefinition` is a TankOS
semantic catalogue extension because no directly equivalent Smart Data Model
is required for its lifecycle. Measurements and Digital Twin projections will
reuse the closest established FIWARE structures from the beginning:
`WaterQualityObserved` where appropriate for water-quality observations,
NGSI-LD `Property` and `Relationship`, `unitCode`, `observedAt`, Feature of
Interest relationships, and Aquaculture structures such as `FishContainment`
or `Sump` where their semantics fit. The absence of a direct
`ParameterDefinition` model does not justify inventing a parallel measurement
model.

**Recorded visibility direction:** a custom `ParameterDefinition` is public to
all users automatically when it is created. There is no private-draft or
publication-request state in the current direction.

**Recorded measurement interoperability direction:** the whole measurement
capability will be modelled around FIWARE's Smart Data Model approach and will
use UN/CEFACT Common Codes for Units of Measurement. This applies to
`ParameterDefinition`, Measurement records and future manual, imported or
sensor-backed sources.

**Recorded standards-first principle:** TankOS will stay as close as possible to
available FIWARE, NGSI-LD, SOSA/SSN and UN/CEFACT semantics. A TankOS-specific
extension is only introduced when the standards do not cover an aquarium
requirement, and that extension must document its relationship to the closest
standard concept.

**Recorded Digital Twin direction:** TankOS will model each Aquarium as a
Digital Twin. Measurements/observations are first-class immutable historical
evidence, while current values may be projected as FIWARE/NGSI-LD-compatible
Properties of the Digital Twin. This does not by itself accept 3D modelling,
simulation, automation or device control.

**Recorded Aquarium-system boundary direction:** an Aquarium is modelled as
one managed system. Display/containment units, sumps, refugia, treatment units,
technical areas and biological zones are components or Features of Interest
within that system, not separate Aquariums. Measurements affect the complete
system by default and may target a component or zone explicitly. The detailed
model is documented in [`AQUARIUM_SYSTEM_MODEL.md`](AQUARIUM_SYSTEM_MODEL.md).

**Recorded canonical concept:** `Measurement` is TankOS's internal canonical
concept for one quantitative historical reading. It will carry the semantic
information needed for SOSA/SSN and NGSI-LD mappings. `Observation` and
`Property` are representations/projections, not a second persisted source of
truth.

**Recorded Unit normalization direction:** a `ParameterDefinition` may accept
multiple compatible input Units. Each Measurement must preserve the entered
value and Unit for historical evidence, while also storing or deriving an
equivalent canonical value in the definition's canonical Unit. The Digital
Twin's projected Property must expose one canonical Unit for that Parameter,
using an explicit conversion/equivalence relation identified with the relevant
UN/CEFACT/FIWARE Unit code where one exists.

**Recorded Unit configuration direction:** when a `ParameterDefinition` is
created, its accepted Units must be configured as part of the definition. The
definition must also identify the canonical Unit used by the Digital Twin;
accepted input Units and the canonical Unit therefore belong to the same
property contract and must be compatible with its quantity kind.

**Recorded Unit conversion module direction:** TankOS will have a dedicated
Unit-conversion capability that centralizes equivalences between Units. It will
be reusable by Measurement capture, canonical Digital Twin projections,
imports/exports, calculations and future IoT sources. It must distinguish
deterministic conversions from conversions that require contextual inputs such
as temperature, and use standard Unit identifiers where available.

**Recorded FIWARE-adapted measurement semantics:** the measurement contract
will distinguish the observed quantity, numeric value, Unit, measurement method
and contextual inputs such as temperature. Related aquarium concepts must not
be treated as interchangeable Units of one magnitude. In particular,
salinity, specific gravity, conductivity and density are distinct quantities,
even if the UI groups them under a friendly salinity concept.

Original observations and derived values remain separate. A conductivity
observation may retain its original value, standard `unitCode`, observation
time, temperature, device, procedure and Feature of Interest. A salinity value
calculated from it is a derived result with an explicit source-observation
relationship and derivation method/version. Historical source evidence remains
unchanged if a future calculation algorithm is revised.

The semantic mapping will follow the closest FIWARE Smart Data Model and
NGSI-LD representation available, using standard properties such as the
observed value, `unitCode`, `observedAt`, device/source reference and
Feature-of-Interest reference. SOSA/SSN concepts remain the semantic
vocabulary for Observation, Property, procedure and result. The exact FIWARE
entity composition, attribute names for derivation and serialization format
remain implementation details to be specified.

**Recorded metadata proportionality rule:** method, contextual inputs and
derivation metadata are required only when they are necessary to interpret the
quantity or conversion correctly. A direct deterministic Unit equivalence does
not require additional scientific metadata; for example, Celsius and degrees
centigrade are the same temperature scale for this purpose. Salinity
representations whose relationship depends on scale, temperature, density,
conductivity or procedure do require the relevant metadata.

**Recorded metadata-requirement direction:** each `ParameterDefinition` will
declare the additional metadata required by each applicable measurement method
or Unit conversion. Measurement capture and conversion must validate against
that declaration, requiring only the context necessary for the selected
method/conversion.

**Recorded Unit vocabulary direction:** accepted and canonical Units will use
the applicable UN/CEFACT/FIWARE standard vocabulary. Arbitrary user-created
Units are not part of the current direction. When an aquarium-specific
quantity lacks a suitable standard Unit, the gap must be analysed and any
extension explicitly mapped and documented rather than silently inventing a
Unit code.

**Recorded canonical-Unit constraint:** the canonical Unit selected by a
`ParameterDefinition` must always be one of that definition's accepted input
Units. This prevents the Digital Twin from exposing a Unit that cannot be used
to record a compatible Measurement through the same property contract.

**Recorded Unit presentation direction:** each standard Unit used by TankOS must
also define its appropriate textual representation. This includes the standard
symbol or scientific name, Unicode form, spacing and placement before or after
the value. Presentation metadata
must remain separate from the stable Unit identity and `unitCode`. The Unit
representation itself will not vary by interface language: TankOS will always
use the scientifically appropriate standard notation and symbol.

**Recorded measurement-method direction:** measurement methods will be managed
through a catalogue with stable identities and links to the closest applicable
standard concepts, including SOSA/SSN procedures where appropriate. A
`ParameterDefinition` may declare the methods applicable to its quantity and
the metadata required by each method. Methods are public to all users when
created. Keepers may create methods at minimum, including manual methods and
methods associated with IoT devices or other sources. Only moderators and
administrators may edit or retire methods. The catalogue must retain authorship
and distinguish standard methods from keeper-created methods. A keeper-created
method is immediately usable; the absence of a standard reference does not
block its use. Moderators and administrators may review or enrich that
reference later. Retiring a method must not remove it from historical
Measurements. TankOS will use a strict NoSQL model: Measurements will not have
foreign keys or mandatory referential lookups. The method context required for
historical interpretation will be embedded as a snapshot in the Measurement.
A stable method identifier may be copied for provenance, but it is not a
dependency required to read the evidence. Changes to or retirement of the
catalogue method therefore cannot alter existing historical Measurements.

**Recorded global NoSQL data-lifecycle rule:** across TankOS, a record may be
created or edited only when it satisfies the complete validity contract for its
type. An incomplete record cannot be created or edited, but it may be deleted.
This applies to methods, ParameterDefinitions, Measurements and other TankOS
data. Historical immutable evidence remains self-contained; valid historical
Measurements are not made deletable by this rule, while an invalid legacy
record can be removed without a referential cascade.

**Recorded validation-version direction:** every TankOS data type will have a
versioned completeness and validation schema. Each persisted record will carry
the schema version needed to interpret its validity and historical shape. New
versions may add or change validation rules without rewriting valid historical
records; migration or compatibility behavior must be specified for each
version transition. `schemaVersion` is immutable for the lifetime of a record;
a contract change creates a new record with the new schema version. For a
published or used business contract, that new record is also a new immutable
business version and the previous version is deprecated or retired rather than
physically deleted. Technical schema migration and business-version lifecycle
are separate operations.

**Recorded deletion-visibility direction:** this lifecycle applies across the
whole application. A record marked for deletion is invisible to all ordinary
users and functional application flows. Only administrators may inspect it.
An administrator may request its definitive physical deletion, or a batch
operation may physically delete all records carrying the deletion marker. No
foreign keys exist in the NoSQL model, so foreign-key cascades are impossible.
The initial batch operation is manual. Future automation through Functions,
scheduled jobs or another mechanism is explicitly a later capability. Each
record's deletion state is evaluated by its own persistence and authorization
rules. Definitive deletion of one record requires explicit confirmation for
that record. A definitive batch deletion requires one confirmation for the
whole batch, not one confirmation per record. Before that confirmation, the
administrator must see the batch scope, including the number of records and the
list of records selected for physical deletion. The batch continues when an
individual deletion fails. On completion it reports successes and failures and
records the result for operational follow-up. The batch result does not need to
survive as permanent audit data after the affected records have been deleted.
If physical deletion fails, the affected record remains marked for deletion so
that a later manual operation can retry it.

The record also retains the cause of its latest physical-deletion failure for
administrator inspection and retry decisions. This is operational deletion
state, separate from the record's business content and any historical
snapshot. A successful retry physically deletes the complete record
immediately, including its deletion state and latest deletion error.

This mark-then-physical-delete lifecycle applies to non-versionable records and
to drafts or versions proven never to have been published or used. For a
published or used versionable contract, deprecation or retirement replaces
physical deletion so that the version remains resolvable for history.

Marking a record for deletion updates `updatedAt` and records the administrator
identity that performed the action as lifecycle metadata.
When a batch marks multiple records, these fields are written independently on
each affected record with the operation's effective timestamp and administrator
identity. If marking one record fails, the batch continues marking the others
and reports the partial result with successes and failures. Marking a batch for
deletion requires one confirmation for the complete batch, not one confirmation
per record. This confirmation pattern is the application-wide standard for
equivalent bulk operations: before confirmation, the operator sees the scope,
record count and item list; processing is independent per item; partial
failures do not cancel the rest; and the operation reports and records its
operational result. Failed items remain retryable when the operation supports
retry.

Administrators will have a dedicated view for records marked for deletion.
That view exposes the deletion state and supports restoration or retrying
definitive physical deletion according to the authorization and confirmation
rules above. Batch warnings and execution details belong to the temporary batch
operation, not to the original record.

The administrative view supports both perspectives: records can be separated
or filtered by entity type, and administrators can also use one combined inbox
containing all marked records. It supports state filters, composable logical
filters over the applicable record fields and pagination. Selection can target
the complete result set matching the filter, not only the records visible on
the current page. Marking or deleting that selection operates on the complete
matching set, and confirmation must make that scope explicit.

When the administrator confirms an operation over all filter results, the
exact matching set is frozen for that operation. Later changes to records or to
the filter do not change its scope; the operation processes the frozen set and
reports any per-record failures.

**Recorded batch-lifecycle direction:** every batch operation persists a
temporary operation entity while it is in progress. That entity contains the
frozen scope and processing state. Once the batch finishes, successful and
warning-only terminal operations may be cleaned, while failed operations remain
inspectable and retryable until explicit administrative cleanup. Durable
per-record state needed for follow-up remains on the affected records. If the
application closes or connectivity is lost while the batch is in progress, the
temporary entity preserves its scope and progress so the operation can resume
later. Resumption does not revalidate the current state of each record before
applying the operation. Batch operations may apply
bulk modification or deletion directly to the frozen set; reported execution
warnings and failures belong to the batch operation and do not add batch-specific
fields to the original record. Bulk modifications do not preserve a copy of
each record's previous business values; they apply the change directly and
retain only the resulting state plus the applicable lifecycle metadata. Each
modified record updates its own `updatedAt` and administrator identity within
the same batch operation, rather than through a separate follow-up operation.

The temporary operation schema includes the batch identity, the affected record
schema/type, the logical frozen record IDs, processing state and all mandatory
operation metadata. The IDs and progress must be physically chunked or stored
in an `items` subcollection when the set cannot fit safely in one document. It
is the source for batch warnings and execution results while the operation
exists. Successful and warning-only terminal operations may be cleaned, while
failed operations remain until explicit administrative cleanup. The server
materializes the frozen set at confirmation time.

```text
BatchOperation
  id
  affectedSchema
  recordIds             # logical set; physical storage may be chunked
  items                 # optional subcollection/chunk representation
  frozenScope
  processingState
  operationMetadata
  warnings
```

Bulk modification confirmation requires the operation scope and selected set,
but does not require a before/after preview of the business values.

Temporary batch-operation entities are an explicit exception to the global
persisted-data schema rule: they do not require `schemaVersion` or a versioned
completeness schema because they are operational structures with bounded
retention and explicit cleanup semantics.

Real-time progress display for an in-progress batch is optional rather than a
correctness requirement. Batch execution, resumability and final reporting
must work without it; live progress may be added when its technical and
operational cost is justified.

Interrupted or in-progress batch operations are exposed in the management
screen that created them. That contextual screen allows the administrator to
inspect and manually resume its operations; a separate global batch dashboard
is not required by this direction. A single management screen may own multiple
concurrent batch operations, each with its own frozen scope, processing state
and independent resumption capability. Batch execution is asynchronous; the
originating management screen does not wait for completion. No locking or
special conflict-management path is required. Concurrent operations use
last-applied-wins semantics: if a modification and deletion compete, deletion
wins when it is applied; if multiple modifications compete, the last applied
modification wins. This is a global TankOS concurrency rule and applies to
individual operations as well as batch operations.

Deletion is terminal: if a later modification reaches a record already deleted,
it does not recreate or modify that record. The operation recognizes the
deleted state and returns a warning, not an error.

Conflict order is determined naturally by server application order and server
timestamps, never by client clocks. No additional conflict-resolution system is
required beyond the persistence behavior and the global last-applied-wins rule.

All lifecycle timestamps, including `createdAt`, `updatedAt`, deletion marks,
restoration and operation-related timestamps, are generated exclusively by the
server.

Measurement event time is separate from lifecycle time: `recordedAt` is always
the server timestamp, while `measuredAt`/`observedAt` preserves the instant
declared by the keeper, device or source and is normalized and persisted in
UTC. The server receipt time must not replace a declared observation time.

An administrator may cancel the deletion mark and restore a record while it
still exists physically. Restoration clears its deletion state and returns the
record to ordinary application visibility and flows. Physical deletion is
irreversible through the application once completed. Restoration does not
require an additional confirmation from the administrator. It updates
`updatedAt` and records the administrator identity that performed the
restoration as lifecycle metadata, without changing the business content.

**Recorded Feature of Interest direction:** a Measurement may target any
identity-bearing entity or zone represented by the Aquarium Digital Twin. The
model is not restricted to the AquariumSystem root or to a fixed enum of
current subtypes; components such as a display tank, chamber, sump, refugium,
technical area, breeding box, biological subject and future Digital Twin
objects can be represented when their identity and lifecycle are defined.

**Recorded default:** if no more specific Feature of Interest is supplied, the
Measurement affects the complete Aquarium system.

**Recorded reference composition:** the Aquarium Digital Twin will use
`FishContainment` as its closest FIWARE Aquaculture structural reference;
technical treatment and recirculation systems will be modelled with reference
to `Sump`; water-quality readings will align with `WaterQualityObserved` and
SOSA/SSN; physical or communicating sources will align with `Device` and
`DeviceModel`; and biological context will use `Specie` and
`FishPopulation` where applicable. This is an accepted modelling direction,
while the exact internal persistence and serialization choices remain open.

**Related register:** [`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md)
contains the source proposals, their current statuses and recorded decisions.
A further decision made for this plan must be appended there and linked to the
resulting accepted specification.

## 1. Purpose and scope

The current priority is to make Parameters configurable rather than permanently
hard-code what can be measured in every Aquarium. The complete capability can
mean several independent things; they must not be conflated:

```text
Parameter definition catalogue
  -> says what a quantity means and which Units are valid
Aquarium Parameter profile
  -> says which defined Parameters are enabled and ordered in one Aquarium
Custom Parameter definition
  -> lets a keeper introduce a new quantity with stable meaning
Measurement configuration
  -> sessions, provenance, units, validation and entry affordances
Parameter consumers
  -> targets, status, history, charts, exports, sharing, models and automation
```

The user may select any subset. For example, an Aquarium-specific enabled list
does not imply custom Parameters; a larger system catalogue does not imply
universal ranges; a custom definition does not imply automation or AI.

## 2. Sources consolidated

| Source                                                                                                                                                                                                                                                                                              | What it contributes                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`MEASUREMENT_LANGUAGE.md`](MEASUREMENT_LANGUAGE.md)                                                                                                                                                                                                                                                | Stable Parameter identity, canonical/entered Units, Measurement evidence, time and provenance language   |
| [`review-parameter-policy.md`](../specifications/review-parameter-policy.md)                                                                                                                                                                                                                        | Current five-Parameter policy, target/status separation and deferred options                             |
| [`record-measurement.md`](../specifications/record-measurement.md)                                                                                                                                                                                                                                  | Accepted immutable Measurement write, validation, authorization and UI baseline                          |
| [`configure-parameter-targets.md`](../specifications/configure-parameter-targets.md)                                                                                                                                                                                                                | Existing Aquarium-owned target configuration and bounded Firestore map                                   |
| [`parameter-history.md`](../specifications/parameter-history.md)                                                                                                                                                                                                                                    | Owner/guest history, exact Parameter filtering, pagination and correction traceability                   |
| [`CORAL_MASTERY_IMPROVEMENT_PLAN.md`](CORAL_MASTERY_IMPROVEMENT_PLAN.md)                                                                                                                                                                                                                            | Existing configurability analysis, candidate definition/profile model and implementation impact          |
| [`AQUARIUM_INTELLIGENCE_VISION.md`](AQUARIUM_INTELLIGENCE_VISION.md)                                                                                                                                                                                                                                | Measurement provenance, rates, forecasts, models, vision and automation consumers                        |
| [`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md)                                                                                                                                                                                                                                              | All pending proposals, including custom definitions, broader catalogue, models and Premium possibilities |
| Existing source, Rules, Emulator and browser tests                                                                                                                                                                                                                                                  | The actual current contracts and every surface that assumes five fixed IDs                               |
| [FIWARE Smart Data Models](https://www.fiware.org/smart-data-models/), [WaterQualityObserved](https://fiware-datamodels.readthedocs.io/en/stable/Environment/WaterQualityObserved/doc/spec/index.html), [FIWARE unit guidance](https://fiware-datamodels.readthedocs.io/en/stable/howto/index.html) | Interoperable measurement vocabulary, NGSI/NGSI-LD entity/property shape and standard `unitCode` values  |

## 3. Current accepted baseline

These are observed, implemented facts, not proposals for the future design:

| Concern      | Current behavior                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| Catalogue    | Five product-defined IDs: `temperature`, `salinity`, `alkalinity`, `nitrate`, `phosphate`                     |
| Identity     | `ParameterId` is a closed TypeScript union; the IDs are persisted in immutable Measurements                   |
| Units        | Each ID has one canonical Unit; entered and canonical values/Units are currently identical                    |
| Validation   | Values are finite and non-negative for all five Parameters; provenance is `manual`                            |
| Recording    | An owner records one Measurement at a time for the active owned Aquarium                                      |
| Targets      | An optional per-Aquarium `parameterTargets` map stores one minimum/maximum interval per known Parameter       |
| Status       | Current Measurement state is derived from its latest value and an explicit keeper target; it is not persisted |
| History      | Private and granted guest history require one exact known Parameter ID and preserve corrections               |
| Security     | Firestore Rules whitelist the five IDs and their exact canonical Units                                        |
| Presentation | Spanish labels and display Units are a separate compile-time presentation mapping                             |

Existing Measurements are immutable evidence. A future configuration change must
not reinterpret, overwrite, hide irretrievably or make their original
Parameter/Unit meaning unreadable.

## 4. Complete proposal inventory

Unresolved entries below remain `pending-user-decision`; this table groups the
ideas already captured in the Product Idea Register so that a decision can be
made by capability rather than by rediscovering adjacent scope.

| Area                          | Register items                                                                | Preserved possibilities                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Definition and profile        | PAR-001, PAR-002, PAR-003, PAR-004                                            | One authoritative system catalogue; Aquarium-enabled/order profile; custom Parameters; broad built-in catalogue                   |
| Capture semantics             | PAR-005 through PAR-010                                                       | Multi-Measurement sessions, provenance, kit/reagent/lots, plausibility/duplicate feedback, calculators/timers and Unit conversion |
| Targets and history           | PAR-011, PAR-012, PAR-013                                                     | Keeper/product/species/model targets; universal ranges; correction, replacement, deletion or retention choices                    |
| Analysis and prediction       | PAR-014 through PAR-024                                                       | Rates, personal baselines, anomalies, cross-Parameter patterns, nitrogen/ionic models, dosing, forecasts, ICP and ATO forecasting |
| Interoperability              | PAR-025                                                                       | FIWARE Smart Data Models, NGSI/NGSI-LD representation and UN/CEFACT `unitCode` interoperability                                   |
| Read and explanation          | ANA-001 through ANA-008, QLT-001 through QLT-007                              | Charts, comparisons, Timeline/graph, health/state views, consistency checks, explanation, export/import/backup                    |
| Evidence sources              | VIS-001, VIS-002, VIS-011, IOT-003 through IOT-009                            | Photos, test readers, photo-derived dosing, Home Assistant/MQTT/vendor input, telemetry, alerts, commands and control             |
| Context that can feed a model | SYS-001, SYS-004, SYS-008, LIV-005, CAR-005, CAR-008, INV-001 through INV-003 | Aquarium volume/filtration/biology, flows, feeding, cycling, Water Change context, consumables and test products                  |
| Assistance/commercial use     | AI-001 through AI-007, INV-010                                                | Integrated explanation, diagnosis hypotheses, briefing, plans and Premium tiers                                                   |

## 5. ParameterDefinition domain boundary

The recorded direction establishes this boundary:

```text
ParameterDefinition domain
  owns definition identity, catalogue/marketplace lifecycle and CRUD use cases
        |
        +--> user catalogue and marketplace visibility/publication
        +--> Measurements consumes a definition reference
        +--> Aquarium Management owns/selects the Aquarium profile
        +--> History, sharing and exports resolve definition meaning
```

`shared` may expose a narrow stable reference/value contract needed by those
consumers, but it must not own the CRUD use cases or become the persistence
repository for `ParameterDefinition`. `Measurements` continues to own
Measurement facts; it does not absorb the definition lifecycle.

The earlier generic “complete CRUD” wording is superseded for authorization:
keepers create, all users list/view/select, and only administrators edit or
delete. The remaining marketplace decisions concern deletion semantics,
attribution, versioning, abuse handling and what happens to Aquariums already
using a public definition.

## 6. FIWARE/UN/CEFACT measurement boundary

The recorded direction is broader than exporting TankOS's current Firestore
documents. The definition and Measurement model must be able to represent the
semantics needed for FIWARE interoperability from the beginning.

The official FIWARE material currently relevant to this plan distinguishes:

- `WaterQualityObserved` for water-quality observations and water-quality
  properties such as pH, salinity, conductivity, TDS and nutrient quantities;
- `Device` and `DeviceModel` for physical or communicating measurement sources;
- NGSIv2 and NGSI-LD representations of Smart Data Models;
- `unitCode` and UN/CEFACT Common Codes for Units, with FIWARE guidance using
  three-character codes where applicable.

The Smart Data Models catalogue also has a dedicated `dataModel.Aquaculture`
subject. The currently published `FishContainment` model describes a tank,
cage, pond or other enclosed water structure that monitors fish populations and
water-quality parameters; `Sump` describes a water-treatment and recirculation
unit monitoring water-quality parameters. Related models cover species, fish
populations, feed, feeders and feeding operations. These are the closest
discovered FIWARE structural references for TankOS's Digital Twin, but they are
aquaculture-oriented, not a complete reef-aquarium model, and their current
versions are early. They should therefore be studied as composable reference
models alongside `WaterQualityObserved`, SOSA/SSN and the FIWARE generic Device
models.

This does not by itself decide that TankOS must run a Context Broker, persist
NGSI-LD JSON-LD internally or expose every FIWARE attribute. The following are
separate decisions:

1. provider-neutral TankOS domain mapped to FIWARE at an adapter boundary;
2. FIWARE/NGSI-LD-native internal domain and persistence;
3. a hybrid in which TankOS's domain uses FIWARE semantic identifiers while
   Firestore remains an internal representation.

The accepted reference composition does not yet close the implementation
details: the exact attributes to adopt, the boundaries between
`WaterQualityObserved`, `FishContainment` and `Sump`, the use of a
TankOS-specific extension, the internal persistence representation and the
NGSI-LD serialization remain to be specified. Aquarium-specific quantities and
Units such as dKH require an explicit mapping decision rather than an invented
code.

## 7. Digital Twin evidence and state model

The accepted conceptual split is:

```text
Aquarium Digital Twin
  ├── current projected Properties
  │     └── latest value + unitCode + observedAt/state metadata
  └── immutable Measurement/Observation evidence
        └── result + ParameterDefinition + provenance + source/time context
```

The historical evidence is the source of truth for what TankOS recorded. The
current Property view is a derived read model and must not overwrite or replace
the evidence. A Property projection may be rebuilt when definitions, source
data or projection rules change.

The following remain separate decisions: whether a Feature of Interest is
mandatory or has an Aquarium default, the exact SOSA/SSN mapping, the NGSI-LD
entity/property structure, projection freshness and conflict behavior, and the Digital Twin's
physical/biological/technical fidelity.

## 8. Capability model and dependency facts

```text
Definition identity + Unit semantics
        |
        +--> system catalogue additions
        +--> Aquarium profile
        +--> custom definition lifecycle
                    |
                    v
           Measurement write and correction
                    |
        +-----------+-------------+----------------+
        |                         |                |
     targets/status            history/share     export/import
        |                         |                |
        +-----------+-------------+----------------+
                    |
         sessions, sources, rates, charts, models, alerts
```

The arrows express technical dependencies, not delivery priority:

- A Measurement needs an unambiguous Parameter identity and compatible Unit.
- A Measurement may be entered in any Unit accepted by its
  `ParameterDefinition`, but the Digital Twin Property must use one canonical
  Unit and an equivalent normalized value.
- A target, status, history filter, chart series and export need to reconstruct
  that identity after a Parameter is disabled, renamed, archived or shared.
- A custom Parameter needs a lifecycle before it can safely be referenced by a
  Measurement, target or guest-visible history.
- Input conversion, imported/ICP/sensor records and calculations need an
  explicit quantity and canonicalization contract.
- Unit conversion must be provided by one shared conversion boundary rather
  than reimplemented independently by each consumer.
- Forecast, alert, dosage and control proposals additionally need their own
  evidence, safety, authority and evaluation decisions; configurability alone
  does not enable them.

## 9. Decision ledger required before each selected slice

No agent should infer an answer to these questions. A selected slice only needs
the rows it touches.

| Decision                      | Options preserved for user decision                                                                                                                                                                                                                                                                                                     | Why it changes implementation                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Definition ownership          | Code-owned product catalogue; persisted TankOS-managed catalogue; another explicitly defined model                                                                                                                                                                                                                                       | Determines migrations, reads, Rules and release operation             |
| Configuration scope           | No profile; Aquarium profile; owner profile; another explicit scope                                                                                                                                                                                                                                                                     | Determines storage, ownership, sharing and defaults                   |
| Marketplace publication       | **User decision recorded:** every created custom definition is public to all users automatically                                                                                                                                                                                                                                        | Determines visibility, authorship, review and Rules                   |
| Profile behavior              | **User decision recorded:** old-version selections are not migrated; they remain locked and, when deprecated or retired, inactive but removable; new selections use the active version                                                                                                                                                  | Changes recording, current state, target and history UX               |
| Legacy absence                | Original five enabled; all current system definitions enabled; explicit migration; another stated behavior                                                                                                                                                                                                                              | Determines what existing Aquariums see after release                  |
| System catalogue              | Keep five; add selected IDs; broad catalogue; classification- or component-aware lists                                                                                                                                                                                                                                                  | Determines semantic definitions, tests, Rules and UI                  |
| Custom scope                  | **User decision recorded:** global TankOS catalogue; every Aquarium may independently select whether to use it                                                                                                                                                                                                                           | Determines identity, reuse and authorization                          |
| Custom identity and lifecycle | **User decision recorded:** server-generated opaque immutable ID; keepers create; only administrators publish/edit/delete; admin edits create a new version; published/used versions are deprecated or retired, while never-published/unused drafts may be physically deleted; public availability is independent of Aquarium selection | Protects historical reconstruction and portability                    |
| Units                         | Multiple compatible input Units; one canonical Digital Twin Unit; explicit equivalence/conversion; user-defined Units under a stated vocabulary                                                                                                                                                                                         | Determines numeric contracts and import/calculator behavior           |
| Numeric semantics             | Per-Parameter negative/zero/precision rules, plausibility, overrides                                                                                                                                                                                                                                                                    | Avoids applying current non-negative rules to incompatible quantities |
| Targets                       | Existing keeper-only model; other explicitly selected target sources                                                                                                                                                                                                                                                                    | Changes status language, provenance and authority                     |
| Visibility                    | Owner-only definitions; guest-readable definitions; public export/presentation                                                                                                                                                                                                                                                          | Determines guest history and Rules/DTO contract                       |
| Retention                     | Append-only correction; replacement/delete/archive paths                                                                                                                                                                                                                                                                                | Determines evidence and correction behavior                           |
| Import/export                 | None; CSV; versioned JSON; ICP/vendor import                                                                                                                                                                                                                                                                                            | Determines schema versioning and restoration order                    |
| FIWARE integration            | Adapter mapping; NGSI-LD-native model; hybrid semantic contract                                                                                                                                                                                                                                                                         | Determines domain shape, transport, JSON-LD context and persistence   |

When a decision is made, record the selected scope, exclusions, rationale and
specification link in the Product Idea Register rather than removing the
unselected alternatives.

## 10. Candidate implementation phases

The following phases are a complete work breakdown. They are not a command to
implement all phases or an ordering decision beyond the dependencies in
sections 5–7. Each selected phase requires its own accepted specification and the
Definition of Ready.

### Phase A — Reconcile the selected Parameter contract

**Outcome:** one accepted specification answers the decisions needed for the
next selected slice.

**Required content:** actor, value, Parameter vocabulary, identity, Unit and
numeric rules, ownership, history, authorization, backward compatibility,
offline class, user-facing Spanish wording, failures and acceptance examples.

**Candidate documentation changes:** the selected specification plus
`GLOSSARY.md`, `MEASUREMENT_LANGUAGE.md`, `DOMAIN_RULES.md` and the Product Idea
Register only where the accepted choice changes them.

### Phase B — Consolidate system definition knowledge

**Outcome:** all existing five-Parameter consumers obtain identity, canonical
Unit, compatible input Units, target eligibility and presentation metadata from
one authoritative definition boundary, with identical current behavior.

**Candidate definition shape:**

```text
ParameterDefinition
  id
  schemaVersion
  deletionState
  quantityKind
  canonicalUnitId
  acceptedUnitIds
  unitEquivalences
  methodMetadataRequirements
  measurementMethodIds
  unitPresentation
  displayPrecision
  targetEligible
```

The managed method catalogue may use a separate definition such as:

```text
MeasurementMethod
  id
  schemaVersion
  standardReference
  sourceType              # manual, IoT device, import, or another source
  authorId
  lifecycle
  metadataRequirements
```

This keeps the source/procedure identity of a method separate from the
ParameterDefinition that declares where the method is applicable.

Whether this is code-owned, persisted or split by a boundary is a user decision
from section 7. Localized Spanish labels remain presentation data rather than a
persisted Measurement identity.

**Known consumers to migrate:** Measurement creation/correction, reference
types, targets, status, dashboard, record form, list, owner history, shared
history, Timeline previews, presentation mapping, Firestore DTO validation and
Rules tests.

**Parity acceptance:** all existing documents and user journeys retain the
same IDs, Units, labels, validation, target behavior, history and grants.

### Phase C — Configure one Aquarium's Parameter profile

**Outcome:** the selected actor can configure the selected profile behavior for
one Aquarium without changing another Aquarium or rewriting Measurements.

**Candidate minimum shape:**

```text
AquariumParameterProfile
  orderedEnabledParameterIds
```

The selected specification must define empty/absent behavior, legacy handling,
ordering, duplicate handling, unknown/archived definitions, disabled target
display, history reachability and guest-visible behavior.

**Likely affected reads and writes:** a capability-specific Aquarium
configuration operation; dashboard context; recording selector; current
Measurement cards; target configuration; owner/guest history selectors; route
and empty-state behavior; Firestore document mapping and Rules.

### Phase D — Add system-defined Parameters through the new path

**Outcome:** each user-selected system Parameter is added end-to-end without
duplicated IDs/Units or implicit enablement for existing Aquariums.

Candidate examples already proposed are calcium, magnesium and pH, followed by
the wider chemistry list in PAR-004. Each one needs an accepted semantic ID,
canonical Unit, input Units, numeric rules, precision, target eligibility,
legacy profile behavior and test examples. The plan does not choose their order.

### Phase E — Custom Parameter definitions

**Outcome:** if selected, a keeper can create the user-selected class of custom
Parameter while every old and shared Measurement remains interpretable.

The accepted specification must close all of these before a write exists:

- global catalogue availability; Aquarium profiles only select use, while
  authorship and management authorization remain separate concerns;
- opaque stable identity and collision behavior;
- required semantic fields, Units and numeric rules;
- create, admin versioned edit, deprecation/retirement and manually confirmed
  physical deletion only for eligible drafts, plus recovery behavior;
- immutability after first Measurement and any explicit migration path;
- target eligibility, profile inclusion and disabled/archive behavior;
- visibility to owners, delegates, exports, imports and public views;
- Firestore representation, document-size/query limits and Rules validation;
- restoration order: definition before target/profile/Measurement;
- collision with a future system-defined Parameter.

### Phase F — Richer Measurement capture

**Outcome:** selected capture options work against the selected definition
contract without changing source evidence silently.

This phase groups independently selectable proposals: multi-Parameter sessions,
manual/imported/sensor/photo/ICP provenance, kit/reagent lots, calculators,
timers, conversions, plausibility and duplicate feedback. Each source type
needs its own required metadata, verification, correction and authorization
rules.

### Phase G — Dependent read models and portability

**Outcome:** selected consumers support disabled, archived and custom
definitions with clear meaning.

Candidate consumers are targets/status, owner and guest history, charts,
comparison, contextual Timeline, explanation panels, CSV/JSON/PDF export,
import/restore and backups. A read model must retain enough definition snapshot
or readable lookup to render historical evidence when the active profile later
changes.

### Phase H — Analysis, forecasts and actions

**Outcome:** only user-selected analysis/action capabilities consume the now
stable Parameter data.

This covers rates, baselines, anomalies, cross-Parameter patterns, nitrogen or
ionic models, dynamic/automatic dosing, chemistry/ATO forecasts, test-photo
reading, telemetry, alerts, commands and control. Every selected item needs a
separate evidence, uncertainty, safety, consent, authority, audit, rollback and
evaluation specification. It is not implied by Phases B–G.

## 11. Actual code and persistence impact map

These paths were identified from the current workspace. They are an impact map,
not a required edit list for every selected phase.

| Boundary                    | Current fixed-Parameter dependency                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Measurement domain          | `apps/tankos/src/app/measurements/domain/measurement.ts` defines IDs, Units, compatibility and numeric/provenance validation    |
| Shared domain               | `apps/tankos/src/app/shared/domain/parameter-reference.ts` and `aquarium-reference.ts` define the shared IDs and targets        |
| Aquarium domain/application | `apps/tankos/src/app/aquarium-management/domain/aquarium.ts` plus target save/remove/read ports and adapters                    |
| Presentation                | `apps/tankos/src/app/shared/ui/parameter-presentation.ts` holds Spanish labels/display Units                                    |
| Capture UI                  | `apps/tankos/src/app/measurements/ui/pages/record-measurement-page.*` assumes all definitions are selectable                    |
| Current state               | `apps/tankos/src/app/composition/aquarium-dashboard/aquarium-dashboard-store.ts` maps all fixed IDs into status cards           |
| Target UI                   | `apps/tankos/src/app/aquarium-management/ui/pages/configure-parameter-targets-page.*` maps all fixed IDs into editable rows     |
| Owner history               | `apps/tankos/src/app/measurements/ui/pages/parameter-history-page.*` filters by one fixed ID                                    |
| Guest history               | `apps/tankos/src/app/shared-access/ui/shared-parameter-history-page.*` has a second local five-ID list                          |
| Other consumers             | Measurement list, corrections, Timeline previews, routes, fixture builders and focused unit/component tests                    |
| Adapter validation          | `apps/tankos/src/app/measurements/infrastructure/firestore-measurement-repository.ts` validates fixed IDs/Units with Zod        |
| Firestore Rules             | `firestore.rules` whitelists five `parameterId` values and their Units; Aquarium target validation is bounded to the same keys |
| Firestore indexes           | `firestore.indexes.json` has Parameter-history query indexes; a changed query shape requires explicit index review             |

## 12. Data compatibility and migration contract

Before any persisted definition/profile/custom implementation, write a
compatibility note that answers:

1. How current Measurement documents reconstruct exactly as they do today.
2. Whether legacy Aquariums get a stored profile, an absence interpretation, or
   another explicit migration strategy.
3. Whether a newly released system Parameter becomes visible automatically,
   remains disabled, or follows another chosen policy for each legacy Aquarium.
4. How existing `parameterTargets` map entries retain valid keys and Units.
5. How owner and already-authorized guest history reads behave after a profile
   change, archive or rename.
6. How Rules and adapter parsers accept legacy documents while rejecting
   malformed new writes.
7. Which rollback is possible if a profile/definition release is withdrawn.
8. How export/import orders definitions, profiles, targets, Measurements and
   corrections so that evidence is never orphaned.

No bulk migration, Firestore index change, Rule deployment or destructive
rewrite is implied until its exact selected contract is accepted.

## 13. Test and acceptance matrix

Every selected phase should use the layers it changes.

| Layer                | Required proof when affected                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Domain               | Stable IDs, semantic/Unit compatibility, numeric rules, lifecycle and legacy reconstruction                                                      |
| Application          | Actor, Active Context, ownership, selected profile semantics, failures and no silent writes                                                      |
| Angular              | Spanish labels, ordering, filtering, disabled/archive states, validation, loading/recovery and accessibility                                     |
| Firestore adapter    | Zod parsing, mapping, legacy/new documents, ordering/query filters and transactions                                                              |
| Firestore Rules      | Owner/guest scope, known/authorized definitions, malformed shapes, cross-Aquarium denial and selected lifecycle rules                            |
| Emulator integration | Real persistence/query behavior, target/profile concurrency, corrected history and index requirements                                            |
| Playwright           | A keeper configures the selected behavior, records/reviews data and sees the expected state after refresh; guest coverage if shared reads change |
| Architecture         | `sheriff` boundaries remain valid; domain does not acquire Angular/Firebase/Zod dependencies                                                     |
| Regression           | Existing five-Parameter record, target, status, correction, owner-history and guest-history journeys still pass                                  |

The current workspace exposes `tankos` targets for `test`, `lint`, `architecture`,
`build`, `e2e` and `e2e-ci`. The selected specification should name the focused
tests first, then expand to the full affected target set before completion.

## 14. Definition-of-ready checklist for the first selected slice

- [ ] The selected layer(s) from section 1 are explicit.
- [ ] The user-selected answers from section 8 are recorded.
- [ ] Existing Measurement and target behavior that must remain compatible is
      listed with examples.
- [ ] Parameter identity, Unit semantics and numeric rules are closed.
- [ ] Authorization, guest visibility, persistence shape and Rules impact are
      closed where durable data changes.
- [ ] Legacy/absence and rollback behavior are specified.
- [ ] Affected UI surfaces and Spanish product language are specified.
- [ ] Test cases include owner, other owner, anonymous, malformed and legacy
      paths as applicable.
- [ ] The result is small enough to implement without inferring a later phase.

## 15. Completion record template

Append one record for every selected phase; do not erase alternatives that were
not selected.

```text
Selected phase:
User decision recorded in PRODUCT_IDEA_REGISTER:
Accepted specification:
Implemented scope:
Explicitly not implemented in this slice:
Legacy/data compatibility result:
Security and sharing result:
Validation run:
Known limits and next decision:
```
