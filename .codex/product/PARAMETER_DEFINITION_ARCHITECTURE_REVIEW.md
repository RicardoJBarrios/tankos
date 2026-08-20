# ParameterDefinition — Architectural Review

**Status:** completed architectural review. The six findings are resolved by
the final specification linked below; this document preserves the reasoning
and resulting constraints.

**Authoritative decision sources:**

- [`PARAMETER_CONFIGURABILITY_PLAN.md`](PARAMETER_CONFIGURABILITY_PLAN.md)
- [`PRODUCT_IDEA_REGISTER.md`](PRODUCT_IDEA_REGISTER.md)
- [`DOMAIN_RULES.md`](../DOMAIN_RULES.md)
- [`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md)

## 1. Scope

`ParameterDefinition` is a global Veril catalogue domain. It defines the
meaning and measurement contract of a quantitative property. It is not owned
by an Aquarium, is not a free-form Measurement field and must not be persisted
as a generic record in `shared`.

The domain is consumed by:

- Measurement capture and correction;
- Aquarium Parameter profiles;
- targets and derived Parameter Status;
- owner and guest history;
- Digital Twin projections;
- import/export and future IoT adapters.

## 2. Decisions that are architecturally coherent

The following decisions fit together without requiring foreign keys or a
single large aggregate:

- The catalogue is global and public to all Aquariums.
- A keeper may create a definition.
- All users may list and view definitions and choose them for Aquariums they
  manage.
- Only administrators may edit or delete definitions.
- A definition is selected independently in each Aquarium profile.
- A global deletion is mark-first and physically manual with confirmation.
- A marked definition is unavailable to new Measurement and profile-selection
  flows.
- Existing profile selections become inactive but are not cascaded away.
- Keepers or administrators may remove an inactive local selection.
- Global restoration is required before an inactive selection may be enabled
  again.
- An administrator edit creates a new version; historical Measurements are not
  rewritten.
- Existing profiles are not migrated automatically to the new version.
- New selections use the active version.
- Measurements preserve enough embedded definition meaning to remain readable
  if a definition is later disabled, versioned or physically deleted.
- Units use the UN/CEFACT/FIWARE vocabulary where applicable, with one
  canonical Unit and compatible accepted input Units.
- Context-dependent conversions require only the metadata necessary for the
  selected method or equivalence.
- No FK, cascade or mandatory catalogue lookup is required to read historical
  evidence.

## 3. Architectural consequences

### 3.1 Domain boundaries

`ParameterDefinition` owns catalogue identity, definition validation,
versioning, lifecycle and administrative management. Aquarium Management owns
the per-Aquarium profile. Measurements own immutable evidence. A shared kernel
may expose value objects and stable contracts, but not the definition
repository or CRUD use cases.

### 3.2 NoSQL references

References are denormalized values, not referential constraints. A profile
selection must carry enough information to identify the selected definition
version and its local state. A Measurement must carry its original definition
identity/version and a semantic snapshot. Readers must tolerate a missing,
marked or physically deleted catalogue record.

### 3.3 Versioned writes

An edit is not an in-place mutation. The write creates a complete new valid
version and marks the previous version for deletion. This is compatible with
the global lifecycle and prevents historical interpretation from depending on
mutable catalogue state.

### 3.4 Deletion and stale profile references

Because profile references are not cascaded, a physically deleted definition
may leave an inactive historical selection in a profile. Profile reads must
render that state safely and provide the allowed removal/recovery action. A
definition must never be physically deleted before the Measurement snapshot
contract is sufficient for historical rendering.

### 3.5 Authorization

Catalogue visibility, Aquarium selection and catalogue management are separate
permissions. Public readability does not grant edit/delete authority. The
server must enforce administrator-only edit/delete and keeper ownership or
creation authority independently from client visibility.

## 4. Findings and resolutions

### A. Logical identity versus version identity — resolved

The resolved model is:

```text
definitionId + versionId + version
  one stable logical identity and multiple immutable versions
```

The final schema and Rules preserve both identifiers.

### B. Exact profile reference — resolved

The profile stores both `definitionId` and `versionId`, plus local enabled state
and selection provenance. It is a denormalized NoSQL reference.

### C. Measurement snapshot boundary — resolved

The final snapshot includes identity/version, quantity, semantic display name,
entered and canonical values/Units, conversion context and method context when
required. The snapshot is self-contained for historical rendering.

### D. Catalogue authorship and administrator authority — resolved

Definitions are created by keepers but edited/deleted only by administrators.
Creator, version creator and the last administrative action are persisted with
server-generated timestamps and administrator identity.

### E. Definition version field mutability — resolved

All definition edits, including presentation-only edits, create a new complete
version. Persisted versions are immutable.

### F. Standard mapping for non-standard aquarium quantities — resolved

FIWARE/UN/CEFACT identifiers are used where available. For quantities such as
dKH or salinity representations whose relationship depends on scale,
temperature, density, conductivity or procedure, the definition carries
documented mapping metadata and required context rather than pretending that
every conversion is a linear Unit conversion. Veril does not invent
UN/CEFACT codes.

## 5. Data-shape observations

The candidate shape in the master plan must preserve the following
implementation constraints:

- include explicit version/lineage and lifecycle fields;
- include creator and administrative provenance;
- keep one `methodMetadataRequirements` field;
- distinguish stable Unit identity from presentation metadata;
- distinguish deterministic conversion from contextual equivalence;
- keep `targetEligible` in the definition version contract;
- copy method identifiers as provenance while validating current capture
  requirements against the active catalogue method;
- use the same identity/version shape for system-defined and keeper-created
  definitions, with server-side collision handling.

## 6. Current conclusion

The high-level architecture is coherent: a global catalogue domain, per-
Aquarium selection, immutable versioned definitions, embedded Measurement
meaning and NoSQL lifecycle operations. No architectural reversal is required.

Findings A–F are closed in the final specification. Implementation still
requires executable schema, Rules, migration and conversion tests, but no
architectural decision from this review remains open.
