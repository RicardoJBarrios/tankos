# ParameterDefinition — Firestore and FIWARE Architecture Audit

**Status:** technical audit. This document identifies weaknesses and proposes
technical improvements. It does not silently override the product decisions
recorded in the final specification.

**Audited specification:**
[`PARAMETER_DEFINITION_FINAL_SPEC.md`](PARAMETER_DEFINITION_FINAL_SPEC.md)

## Executive conclusion

The high-level direction is viable, but the current specification is not yet
safe to implement directly. The strongest improvements are:

1. move catalogue writes and version/lifecycle transitions behind a trusted
   server boundary;
2. separate logical definition lifecycle from version lifecycle;
3. allocate versions transactionally and atomically advance the active pointer;
4. make profile selections and catalogue queries explicit, bounded and
   indexable;
5. keep the Unit/conversion and method catalogues versioned and snapshot their
   exact interpretation into Measurements;
6. treat FIWARE as a semantic/serialization adapter, not as a claim that the
   Firestore document is already an NGSI-LD entity;
7. replace the current hard-coded five-Parameter code, Rules and target maps
   directly because there is no production user/data compatibility burden.

## 1. Findings by severity

### Critical — client writes cannot be the authoritative definition boundary

The product requires complete semantic validation: quantity kind, standard
Units, compatible conversions, method requirements, numeric rules, public
visibility, version uniqueness and administrator-only lifecycle operations.
Firestore Rules can validate shapes and simple field constraints, but they are
not a suitable conversion engine or a complete semantic registry. A client can
also be stale or malicious.

The current repository has Firestore Rules and browser SDK repositories but no
deployed Functions source. The final design therefore has an implementation
gap: there is no trusted server boundary for keeper creation, administrator
versioning, restore or physical deletion.

**Recommendation:** use a trusted server application service for all
`ParameterDefinition` creates, version creation, lifecycle transitions and
physical deletion. The server validates the complete contract, writes server
timestamps and uses the Admin SDK with explicit IAM. Keep Rules as a second
boundary for public reads, Aquarium selection and Measurement writes.

Firebase documents that server client libraries bypass Firestore Rules and must
instead be protected with IAM, so this boundary must not be treated as a way to
avoid authorization.

### Critical — version allocation and active-version changes need a transaction

“Create a new version and mark the previous version” is a multi-document
invariant if versions and a logical catalogue record are separate documents.
Two administrators can otherwise create competing version numbers or two
active versions.

**Recommendation:** keep a small logical-definition head document containing
the active `versionId`, next version number and lifecycle state. In one trusted
Firestore transaction:

1. read the head;
2. allocate the next version number;
3. create the immutable version document;
4. deprecate or retire the previous active version according to its usage and
   the accepted version lifecycle;
5. update the head to the new active version.

The transaction should be short and retriable. Firestore transactions provide
serializable isolation, but can retry or fail under contention; the server
must make the operation idempotent using a request/operation key.

### Critical — logical-definition deletion and version deletion are conflated

The specification sometimes says “definition/version”. These are different
operations:

- deleting one historical version;
- replacing the active version;
- retiring the logical definition from the global catalogue;
- physically deleting one version document;
- physically deleting the complete definition lineage.

Without separate states, it is possible to mark the active head deleted while
an older version remains selected, or to physically delete a version that an
inactive profile still needs to display.

**Recommendation:** model lifecycle separately:

```text
DefinitionHead
  definitionId
  activeVersionId
  catalogueState

DefinitionVersion
  definitionId
  versionId
  version
  versionState
```

Use explicit states such as `active`, `superseded`, `deletionPending`,
`restored` and `physicallyDeleted` only where each state has a defined
transition. “Invisible” is a read policy, not a replacement for lifecycle
state.

### Critical — current implementation is still closed and hard-coded

The code currently contains:

- a closed TypeScript `ParameterId` union with five values;
- a closed `UnitId` union;
- hard-coded canonical-unit mapping;
- Measurement validation requiring entered and canonical Units to be equal;
- Firestore Rules whitelisting the five IDs and Units;
- a hard-coded `parameterTargets` map.

This is not just a UI migration. It affects domain types, DTO validation,
Rules, target configuration, history cursors, dashboard reads, tests and
existing persisted Measurements.

**Recommendation:** replace the five-value path directly with the dynamic
`ParameterDefinitionReference` contract. Do not maintain two independent
canonical-unit registries. Keep tests for the old behavior only as regression
examples while the new system-definition documents and custom definitions are
introduced.

### High — Rules are not filters

The catalogue is public, but marked/deleted definitions must be invisible to
ordinary users. A Firestore query does not receive post-query filtering from
Rules; the query itself must constrain the lifecycle/visibility fields so the
Rules can prove that every returned document is allowed.

**Recommendation:** define separate query contracts:

- public catalogue: active/public definitions only, cursor pagination;
- keeper selection: active definitions only;
- administrator review: lifecycle states included, admin-only;
- historical resolution: never require a catalogue query; use the embedded
  Measurement snapshot.

All public list queries must have a bounded page size and the required filters
and ordering. Use cursor pagination, not offsets.

### High — profile selection shape may become an unqueryable map

The conceptual profile contains selections, but the physical representation is
not closed. An array or map embedded in the Aquarium document is convenient for
small profiles, but makes per-selection queries, indexes, concurrent edits and
large future catalogues harder. It also couples profile writes to the Aquarium
hot document.

**Recommendation:** use a capability-specific subcollection when the profile
needs independent CRUD or querying:

```text
aquariums/{aquariumId}/parameterSelections/{definitionId}--{versionId}
```

The selection document contains the denormalized version reference, enabled
state and selection provenance. A small summary projection may remain on the
Aquarium document only if it is not treated as the source of truth.

If the first slice proves that a bounded map is sufficient, document its hard
limits and migration path before adopting it.

### High — profile selection and Measurement capture can race

A keeper can have a stale client profile while an administrator retires or
replaces a definition. Offline Firestore writes can be delivered later. A
Measurement write must therefore validate the selected `definitionId +
versionId` and active profile state at the server boundary, not trust the
client's cached catalogue.

**Recommendation:** Rules or the trusted write service must reject a new
Measurement whose selected version is not active/allowed for that Aquarium.
Historical reads must remain independent of that lookup. If selection and
first Measurement creation must be atomic, use a bounded transaction or batch;
do not simulate atomicity with sequential client writes.

### High — snapshots are correct in principle but need bounded size

Embedding the semantic Measurement snapshot is the right historical strategy,
but the snapshot currently includes open-ended conversion and method context.
Firestore has a 1 MiB document limit and index fanout can be significant for
large arrays/maps. A method snapshot or conversion trace must not accidentally
grow without bound.

**Recommendation:** define a bounded snapshot schema and explicitly exempt
large non-query fields from indexing. Store the exact method/version and
conversion algorithm/version, not an unbounded copy of a catalogue. Keep
attachments, long explanations or raw device payloads outside the Measurement
document.

### High — Unit conversion is too close to the definition document

`unitEquivalences` inside each definition risks duplicating the central Unit
conversion module and creating divergent rules. It also risks treating
salinity, specific gravity, conductivity and density as ordinary Unit
conversion when they are distinct quantities or method-dependent derivations.

**Recommendation:** make the Unit and conversion capability authoritative and
versioned. `ParameterDefinitionVersion` should reference a conversion policy
or equivalence version. The Measurement snapshot records the exact policy and
context used. Deterministic conversions and contextual derivations must be
different types, with different validation requirements.

### High — measurement methods need versions, not only IDs

The specification correctly says that a retired method must not break history,
but a `measurementMethodId` alone is insufficient if the method can be edited
or enriched. The current plan also says methods are immediately public and
keeper-created, which creates a public semantic-governance surface.

**Recommendation:** use `methodId + methodVersionId` in the definition and
snapshot. A current capture validates against the active method version; the
historical snapshot contains the exact method contract needed for interpretation.
Keep method content bounded and separate from raw device payloads. Add abuse,
quality and duplicate-definition handling to the moderation design without
changing the immediate-public product decision.

### High — FIWARE identity is not the same as Firestore identity

NGSI-LD entity IDs are URIs, and NGSI-LD models Properties, Relationships and
GeoProperties rather than arbitrary Firestore maps. `unitCode` belongs to the
NGSI-LD Property representation and uses the UNECE/CEFACT code vocabulary.
`observedAt` is the time the Property was observed, while system timestamps
such as `createdAt` and `modifiedAt` have different meanings.

An opaque Firestore `definitionId` must not be presented as if it were already
a globally meaningful NGSI-LD URI.

**Recommendation:** keep the internal IDs and expose a stable standard-facing
mapping, for example a documented `urn:tankos:parameter-definition:{definitionId}`
URI or an equivalent HTTPS URI. Keep the JSON-LD `@context`, entity `type`,
Property/Relationship shape and `datasetId`/method distinction in the contract
from the first slice. Do not make Firestore documents NGSI-LD by adding a few
field names, and do not postpone this mapping to a later integration phase.

### Medium — `WaterQualityObserved` is an observation model, not the catalogue

FIWARE's `WaterQualityObserved` is designed to represent water-quality
observations and measurands. `FishContainment` and `Sump` are useful structural
references for aquaculture, but they do not define TankOS's catalogue or every
reef-aquarium concept.

**Recommendation:** map the Aquarium Digital Twin to the closest structural
entity and map current projected quantitative values as NGSI-LD Properties.
Keep immutable TankOS Measurements as evidence records. Use separate
observation/derivation mappings for source readings and calculated salinity;
do not flatten every ParameterDefinition into an attribute of
`WaterQualityObserved`.

### Medium — multiple observations need an NGSI-LD dataset strategy

Different devices, methods or derivations can produce multiple values for the
same property at the same time. NGSI-LD supports `datasetId` to distinguish
multiple instances of a Property. The current design mentions method/source
but does not define its external representation.

**Recommendation:** define whether `datasetId` is derived from the source/method
version, whether each Measurement exports as a separate observation entity, or
whether only the Digital Twin projection uses dataset instances. Preserve the
original source and method in all cases.

### Medium — FIWARE schemas do not remove the need for TankOS validation

Smart Data Models provide interoperable shapes, but a generic water-quality
model does not automatically define TankOS's keeper permissions, Aquarium
profiles, historical snapshots, correction rules or custom-property lifecycle.

**Recommendation:** use the established Smart Data Models and their schemas or
fixtures from the first implementation slice. `ParameterDefinition` remains a
TankOS catalogue extension, while Measurements and Digital Twin projections
reuse the closest applicable standard structures. Keep TankOS's domain
validation explicit, and validate each persisted/exported contract against the
selected standard model. There is no separate later adapter phase; any
TankOS-specific extension is versioned and tested where it is introduced.

## 2. Firestore implementation recommendations

### Trusted write boundary

Use a server-side application service for:

- create definition;
- create version;
- mark/restore/physically delete;
- admin batch operations;
- optional conversion/method validation that exceeds Rules capability.

The server must use IAM because Admin/server libraries bypass Rules. The
client-facing callable/HTTP contract must authenticate the Firebase user and
authorize the operation explicitly; an `admin` custom claim alone is not a
complete audit trail.

### Atomicity and idempotency

Use a transaction only for the small head/version invariant. Use bounded batch
writes or BulkWriter-style server writes for independent item work. Do not put
an entire catalogue or profile migration into one atomic WriteBatch.

Every server command should accept an idempotency key and record the command
result while it is active. If Cloud Tasks or retry-enabled Functions are used,
assume at-least-once delivery and make each item operation idempotent.

### Index and document policy

- Exempt snapshots, descriptions, raw method context and conversion traces from
  indexing unless they are queried.
- Index only catalogue state, public visibility, quantity kind, updated time
  and fields used by bounded catalogue queries.
- Use automatic/scattered document IDs, not sequential document IDs.
- Use cursors for catalogue and selection pagination.
- Load-test the head document and popular catalogue queries.
- Keep Firestore location and trusted compute co-located; the current project
  is in `europe-west1`.

### Deletion policy

The managed Firestore bulk-delete service is not a substitute for the product
batch contract: it is collection-group oriented, requires billing and deletes
documents progressively without the product's frozen semantic scope and
per-item result model. Use the application batch domain for product operations.
Use managed bulk delete only for an explicitly separate operational purge.

## 3. FIWARE implementation recommendations

Define an adapter contract with at least:

```text
toNgsiLdDefinition(version)
toNgsiLdMeasurement(measurement)
toNgsiLdDigitalTwin(aquariumProjection)
fromNgsiLdObservation(payload)
```

The contract must specify:

- stable URI generation;
- `@context` version;
- entity and attribute types;
- `unitCode` mapping;
- `observedAt` versus `createdAt`/`modifiedAt`;
- Feature-of-Interest Relationships;
- method/source and `datasetId` handling;
- derived-result provenance;
- behavior when no standard code exists.

## 4. Priority order

1. Trusted write boundary and Rules/authorization model.
2. Logical head/version schema and transactional version allocation.
3. Direct replacement of the five hard-coded Parameters with standard-backed
   definitions.
4. Bounded profile selection and Measurement snapshot schemas.
5. Versioned Unit/conversion and method registries.
6. Standard Smart Data Model schemas/fixtures in each affected contract.
7. Load, cost, contention, offline-race and deletion/recovery tests.

## 5. Closed implementation strategy

The following strategy is now the consolidated direction:

1. Define the canonical TankOS contracts for definitions, versions, profiles,
   snapshots, Units and Methods.
2. Select the closest established FIWARE Smart Data Models and schemas for
   Measurements and Digital Twin projections.
3. Keep `ParameterDefinition` as an explicit TankOS catalogue extension, with
   documented standard-facing identifiers where it is exported.
4. Implement the trusted server boundary and authorization model.
5. Implement Firestore heads, immutable versions, profiles, indexes and Rules.
6. Replace the hard-coded five-Parameter implementation directly; no
   production data migration is required.
7. Implement profile selection, Measurement capture, Unit conversion and
   Method versioning against the canonical contracts.
8. Implement lifecycle and batch operations.
9. Validate each affected contract with the selected FIWARE schemas/fixtures
   as part of that slice. There is no later standalone FIWARE adapter phase.
10. Execute security, concurrency, offline-race, size, cost and
    deletion/recovery tests before activation.

The direct replacement decision applies only to the absence of production
users and data. Existing source tests, emulator fixtures and hard-coded
implementation assumptions still require deliberate updates.

## 6. Sources

- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore transaction contention and serializability](https://firebase.google.com/docs/firestore/transaction-data-contention)
- [Firestore Rules conditions and server-client authorization](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firestore managed bulk delete](https://firebase.google.com/docs/firestore/manage-data/bulk-delete)
- [Firebase Cloud Tasks functions](https://firebase.google.com/docs/functions/task-functions)
- [Firebase retry semantics](https://firebase.google.com/docs/functions/retries)
- [FIWARE NGSI-LD FAQ](https://fiware-datamodels.readthedocs.io/en/stable/ngsi-ld_faq/)
- [FIWARE WaterQualityObserved](https://fiware-datamodels.readthedocs.io/en/stable/Environment/WaterQualityObserved/doc/spec/index.html)
- [FIWARE NGSI-LD how-to](https://fiware-datamodels.readthedocs.io/en/stable/ngsi-ld_howto/index.html)
- [Smart Data Models Aquaculture announcement](https://smartdatamodels.org/index.php/new-data-models-fishcontainment-specie-and-sump-at-subject-datamodel-aquaculture/)
- [ETSI NGSI-LD Information Model](https://cim.etsi.org/NGSI-LD/official/clause-4.html)
