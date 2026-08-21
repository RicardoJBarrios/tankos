# Domain Rules

This document describes business truths, not architecture or implementation.
Rules are classified to avoid turning assumptions into code prematurely.

## Accepted global deletion visibility and purge rule

- A record marked for deletion is invisible to ordinary users and functional
  application flows.
- Only an administrator may inspect records marked for deletion.
- An administrator may request definitive physical deletion, or a batch may
  physically delete all records carrying the deletion marker.
- No foreign keys exist in the NoSQL model, so foreign-key cascades are
  impossible. The initial batch operation is manual; future automation is a
  later capability.
- Each record applies its own deletion-state and authorization rules.
- Definitive deletion of one record requires explicit confirmation for that
  record.
- Definitive batch deletion requires one confirmation for the whole batch, not
  one confirmation per record.
- Before that confirmation, the administrator must see the batch scope,
  including the number of records and the list selected for physical deletion.
- The batch continues when an individual deletion fails. On completion it
  reports successes and failures and records the result for operational
  follow-up. The batch result does not need to survive as permanent audit data
  after the affected records have been deleted.
- If physical deletion fails, the affected record remains marked for deletion
  so that a later manual operation can retry it.
- Marking a record for deletion updates `updatedAt` and records the
  administrator identity that performed the action as lifecycle metadata.
- When a batch marks multiple records, these fields are written independently
  on each affected record with the operation's effective timestamp and
  administrator identity.
- If marking one record fails, the batch continues marking the others and
  reports the partial result with successes and failures.
- Marking a batch for deletion requires one confirmation for the complete
  batch, not one confirmation per record.
- This confirmation pattern is the application-wide standard for equivalent
  bulk operations: before confirmation, the operator sees the scope, record
  count and item list; processing is independent per item; partial failures do
  not cancel the rest; and the operation reports and records its operational
  result. Failed items remain retryable when the operation supports retry.
- Administrators have a dedicated view for records marked for deletion. It
  exposes deletion state and supports restoration or retrying definitive
  physical deletion under the applicable authorization and confirmation rules.
  Batch warnings and execution details belong to the temporary batch operation,
  not to the original record.
- The administrative view supports both separation or filtering by entity type
  and one combined inbox containing all records marked for deletion.
- It supports state filters, composable logical filters over applicable record
  fields and pagination.
- Selection may target the complete result set matching the filter, not only
  records visible on the current page. Marking or deleting that selection
  operates on the complete matching set, and confirmation must make that scope
  explicit.
- When an administrator confirms an operation over all filter results, the
  exact matching set is frozen for that operation. Later changes to records or
  to the filter do not change its scope; the operation processes the frozen set
  and reports any per-record failures.
- Every batch operation persists a temporary operation entity while in
  progress, containing the frozen scope and processing state. Successful and
  warning-only terminal operations may be cleaned, while failed operations are
  retained for inspection and retry until explicit administrative cleanup.
  Durable per-record follow-up state remains on the affected records. If the
  application closes or connectivity is lost while the batch is in progress,
  the temporary entity preserves its scope and progress so the operation can
  resume later. Resumption does not revalidate the current state of each
  record before applying the operation.
  Batch operations may apply bulk modification or deletion directly to the
  frozen set; reported execution warnings and failures belong to the batch
  operation and do not add batch-specific fields to the original record. Bulk
  modifications do not preserve a copy of each record's previous business
  values; they apply the change directly and retain only the resulting state
  plus applicable lifecycle metadata. Each modified record updates its own
  `updatedAt` and administrator identity within the same batch operation,
  rather than through a separate follow-up operation.
- The temporary operation schema includes the batch identity, affected record
  schema/type, logical frozen record IDs, processing state and all mandatory
  operation metadata. The IDs and progress may be physically chunked or stored
  in an `items` subcollection when they cannot fit safely in one document. The
  server materializes the frozen set at confirmation time. Successful and
  warning-only terminal operations may be cleaned while their idempotency
  reservation is retained; failed operations remain inspectable and retryable
  until an explicit administrative cleanup.
- Bulk modification confirmation requires the operation scope and selected set,
  but does not require a before/after preview of business values.
- Temporary batch-operation entities are an explicit exception to the global
  persisted-data schema rule: they do not require `schemaVersion` or a
  versioned completeness schema because they are operational structures with
  bounded retention and explicit cleanup semantics.
- Real-time progress display for an in-progress batch is optional rather than a
  correctness requirement. Batch execution, resumability and final reporting
  must work without it; live progress may be added when its technical and
  operational cost is justified.
- Interrupted or in-progress batch operations are exposed in the management
  screen that created them. That contextual screen allows the administrator to
  inspect and manually resume its operations; a separate global batch dashboard
  is not required by this direction. A single management screen may own
  multiple concurrent batch operations, each with its own frozen scope,
  processing state and independent resumption capability.
- Batch execution is asynchronous; the originating management screen does not
  wait for completion.
- No locking or special conflict-management path is required. Concurrent
  operations use last-applied-wins semantics: if a modification and deletion
  compete, deletion wins when it is applied; if multiple modifications compete,
  the last applied modification wins. This rule applies globally to individual
  operations as well as batch operations.
- Deletion is terminal: if a later modification reaches a record already
  deleted, it does not recreate or modify that record. The operation recognizes
  the deleted state and returns a warning, not an error.
- Conflict order is determined naturally by persistence application order and
  transaction/revision checks, never by comparing timestamp values. Technical
  timestamps are metadata and do not act as a conflict-resolution mechanism.
- Technical lifecycle timestamps are generated by the persistence boundary's
  injected clock and normalized to UTC. Firestore adapters use a client-owned
  technical clock by default so writes can return their projected record
  without a read-after-write; a trusted host may inject its own clock.
- For Measurements, `recordedAt` is always the server timestamp, while
  `measuredAt`/`observedAt` preserves the instant declared by the keeper,
  device or source and is normalized and persisted in UTC. Server receipt time
  must not replace a declared observation time.
- The record retains the cause of its latest physical-deletion failure for
  administrator inspection and retry decisions; this is operational deletion
  state, separate from business content.
- A successful retry physically deletes the complete record immediately,
  including its deletion state.
- An administrator may cancel the deletion mark and restore a record while it
  still exists physically; restoration clears its deletion state and returns
  it to ordinary visibility and flows.
- Restoration does not require an additional confirmation from the
  administrator.
  It updates `updatedAt` and records the administrator identity that performed
  the restoration as lifecycle metadata, without changing business content.
- Physical deletion is irreversible through the application once completed.

## Keeper and Aquarium cardinality

- A keeper may own or manage zero, one or many independent Aquariums.
- Each Aquarium is an independent aggregate root.
- An Aquarium is the managed system boundary. Display/containment units,
  sumps, refugia, treatment units, technical areas and biological zones are
  components or Features of Interest within that Aquarium, not separate
  Aquariums. A Measurement affects the complete system by default and may
  target a component or zone explicitly.
- In the first version, each Aquarium has one owning keeper. The owner may
  grant explicit read-only access to selected Aquarium resources for another
  authenticated user.

## Accepted rules for delegated Aquarium access

- A delegated access grant belongs to exactly one Aquarium and one grantee.
- The owner chooses the readable resource categories independently: Aquarium
  metadata, Measurements, Observations, Care Work, Planned Care Work or
  Livestock or Equipment.
- A delegated grantee cannot create, update, delete, transfer or revoke any
  Aquarium data or access grant.
- The owner may revoke a grant. Revocation is retained for traceability and
  immediately prevents further reads.
- Delegated access is scoped to the selected Aquarium and does not grant
  access to the owner's other Aquariums.
- Firebase custom claims remain global capabilities; per-Aquarium grants are
  persisted relationships and are not encoded as claims.

## Accepted rules for Establish an Aquarium

- A user with the Firebase custom claim `isKeeper: true` may establish any
  number of independent private Aquariums. Each Aquarium has one owning keeper
  in this first version; authentication without that claim is not sufficient.
- Establishment requires only an Aquarium name. It creates no components,
  Equipment, Livestock or public representation.
- An Aquarium name is non-empty after surrounding whitespace is trimmed; no
  other naming rule is accepted for this slice.
- A successful establishment creates one durable Fact classified as
  `AquariumEstablished`. Later name or visibility changes do not rewrite that
  occurrence.
- `AquariumEstablished` occurs exactly once per Aquarium lifecycle, only after
  the root is successfully established. A failed attempt creates no event;
  retries create a second event only when they establish a distinct Aquarium.
- Establishment is online-required. These rules apply only to this use case and
  do not decide future ownership, cardinality or offline policy.

## Accepted rules for Record Care Work

- Care Work records one intentional action already performed for exactly one
  Aquarium in the first version.
- Care Work is an independent aggregate root and durable Fact. It references
  `AquariumId` and does not belong to the Aquarium aggregate consistency
  boundary.
- A Care Work record requires a non-empty description, `performedAt`,
  `recordedAt` and provenance `manual`.
- `performedAt` describes when the action happened; `recordedAt` describes when
  Veril accepted the evidence.
- Only the owning authenticated keeper may record Care Work. Active Context is
  not authorization.
- The first slice is append-only and online-required. Planning, recurrence,
  reminders, correction, deletion and offline synchronization are deferred.
- Recording Care Work does not automatically create a Domain Event.

## Accepted rules for Record Water Change

- A Water Change records one completed water replacement for exactly one
  Aquarium and is an independent Maintenance aggregate and durable Fact.
- The replacement volume is required, finite and strictly positive, expressed
  in litres. A Water Change cannot be inferred from a Measurement or Care Work.
- `performedAt` describes when the replacement happened; `recordedAt` describes
  when Veril accepted the evidence. Both are retained and must be valid.
- Notes are optional free text and are trimmed at the domain boundary; they do
  not replace the required volume or timestamps.
- Only the owning authenticated keeper may create or privately read Water
  Changes. A delegated guest may read them only through an explicit
  Aquarium-scoped `waterChanges` grant.
- Water Changes are append-only and online-required in the first slice.
  Editing, deletion, correction, scheduling, chemistry and batch provenance
  require separate accepted decisions.
- Recording a Water Change does not create a Measurement, Care Work record or
  Timeline source automatically.

## Accepted rules for Planned Care Work

- Planned work and completed Care Work remain separate records: completion
  creates a Care Work fact and removes the plan atomically; cancellation removes
  an unperformed plan without creating a Fact or Timeline item.

## Accepted rules for Weekly Recurring Care

- A Recurring Care Plan is a Care-specific independent aggregate that defines
  one weekly calendar intention for one owned Aquarium. It is neither a generic
  Task nor a scheduler.
- The Aquarium time zone is the single authoritative IANA time zone for its
  calendar Care. A keeper confirms it explicitly when recurrence first needs
  it; Veril never silently derives it from the active browser.
- The first recurring occurrence is chosen explicitly. Its local weekday and
  `HH:mm` time define the weekly rule; the schedule remains at that local clock
  time across daylight-saving changes.
- A recurring plan has at most one concrete outstanding Planned Care Work.
  That occurrence remains actionable even when overdue and blocks creation of
  another occurrence.
- Recurrence is schedule-driven. Completing or cancelling an occurrence creates
  the first scheduled occurrence strictly after the later of the occurrence's
  scheduled instant and the action time. It never recreates missed backlog.
- Cancelling an occurrence does not stop its recurring plan. Stopping a
  recurring plan is a separate operation that deletes the plan and its current
  outstanding occurrence without creating a Fact or Timeline item.
- A generated occurrence has provenance `recurring-plan`; a resulting Care
  Work remains `manual` because the keeper confirms that the work was actually
  performed.
- Calendar correctness belongs to the domain/application calculation. Rules
  protect ownership and structural links; a keeper manipulating their own
  future schedule does not authorize access to another Aquarium or create a
  historical Fact.

## Accepted rules for Configure Aquarium Timezone

- An authenticated owner may configure the `timeZone` of an Aquarium only when
  it is currently absent.
- Configuration requires explicit keeper confirmation of a valid IANA timezone
  identifier. The browser timezone is only a proposal, never silent domain
  truth.
- Configuration changes presentation and future calendar authority; it does
  not rewrite historical absolute instants or mutate Measurements,
  Observations, Care Work, Planned Care Work or Recurring Care Plans.
- Changing or clearing an existing Aquarium timezone is not part of this use
  case. Correction and physical relocation require a separate accepted
  decision before any existing schedule semantics are changed.
- The operation creates no Fact or Domain Event and is online-required.

## Accepted rules for Aquarium Location and Local Weather

- An Aquarium may transition from no location to one confirmed approximate
  location. Coordinates are rounded to two decimals and remain within WGS84
  latitude/longitude bounds; the locality label is non-empty.
- Only the authenticated owner may configure a missing location. Correction and
  physical relocation are separate future decisions.
- Location configuration does not rewrite historical timestamps, Measurements,
  Observations, Care Work or recurrence data.
- Local Weather is an ephemeral external read model. It is not persisted,
  treated as Aquarium evidence or included in Timeline; provider failure must
  not block Aquarium operational capabilities.

## Measurement age

- A persisted `Measurement` remains durable evidence regardless of age.
- The age of a Measurement is derived from `measuredAt` and an explicit current
  instant; it is not persisted and does not mutate the Measurement.
- Measurement cadence and freshness thresholds are separate product decisions
  and are not implied by the Measurement catalogue. Parameter Status compares
  only the latest known value with an explicit keeper target.

## Accepted rules for Correct Measurement

- Only the owning authenticated keeper may correct a Measurement.
- A correction creates one new immutable Measurement Fact referencing the
  original through `correctsMeasurementId`; it never updates or deletes the
  original.
- The original Parameter and canonical Unit remain unchanged. The correction
  may replace only the value and `measuredAt` in this increment.
- An original Measurement may be corrected at most once. A correction cannot
  itself be corrected in this increment.
- The replacement and its technical uniqueness marker are created atomically.
- A delegated guest may read the original and replacement when the Aquarium
  grant includes `measurements`, but cannot create, correct or delete either.

## Parameter policy

- The Parameter catalogue contains public system-defined and
  `ParameterDefinition` entries. Keepers may create definitions; all users may
  list and view the global catalogue and select definitions for their
  Aquariums. Only administrators may edit or delete definitions. A custom
  definition is public to all users according to the accepted catalogue rules.
- A custom `ParameterDefinition` belongs to the global Veril catalogue and is
  available to all Aquariums. Each keeper independently selects whether to
  use it in each Aquarium they manage. The profile does not duplicate,
  transfer or change the definition's catalogue authorship or management
  permissions.
- Definition deletion follows the global lifecycle: an administrator marks
  it for deletion, it becomes unavailable for new Measurements and Aquarium
  selections, historical Measurements remain interpretable from their embedded
  snapshot, and an administrator may later physically delete it manually with
  confirmation. No foreign-key cascade or automatic cleanup is used.
- Existing Aquarium profile selections are not cascaded away when the
  definition is marked. They become inactive and recoverable; the keeper or an
  administrator may remove the local selection. Re-enabling requires global
  administrative restoration first.
- Editing a definition is versioned: an administrator creates a new version,
  the previous version is marked for deletion, and existing Measurements keep
  their original definition snapshot. Historical evidence is never rewritten.
- Aquarium profiles are not migrated automatically between definition
  versions. Existing selections retain the old locked reference and become
  inactive when that version is marked for deletion; new selections use the
  active version.
- A `ParameterDefinition` identifier is generated by the server, opaque and
  immutable. It is separate from the visible name or presentation code, which
  cannot determine historical identity or create collisions.
- A definition uses a stable logical `definitionId`, an immutable
  server-generated `versionId` and a sequential `version` number. Profiles
  store the logical/version pair without a foreign key; Measurements embed a
  self-contained semantic snapshot. Every administrative edit, including a
  presentation-only edit, creates a new complete version.
- The five current system Parameters remain measurable and targetable, but no
  biological interpretation is accepted by default. Custom definitions must
  satisfy the same complete validity contract before they can be used by a
  Measurement.
- A future Parameter Target belongs to Aquarium configuration and does not alter
  Measurement validity, provenance or historical meaning.
- A Parameter Target is an optional keeper-owned interval identified by
  `AquariumId + ParameterId`; there is at most one per Parameter, with finite
  non-negative canonical values and `minimum <= maximum`.
- The target map is persisted with Aquarium configuration. Absence means
  `uninterpreted`; there are no product defaults, target history or status
  persistence.
- Parameter Status is derived application state, not a Fact, Domain Event or
  persisted Measurement state. It classifies a known value as `below`,
  `within`, `above` or `uninterpreted` against an explicit target; Measurement
  Age remains independent and missing evidence has no value classification.

## Candidate invariants requiring validation

Other business invariants remain unaccepted. The following hypotheses must be
decided in a use-case specification before code, Rules, events or persistence
enforce them:

- Whether an Aquarium is the ownership boundary for Measurements.
- Whether Measurement corrections may include a reason or appear differently
  in Timeline remains a presentation decision.
- Livestock belongs to one Aquarium at a time; an accepted transfer records the
  previous association and moves it to another Aquarium owned by the keeper.
- Whether future Water Change corrections are compensating Facts or an explicit
  correction workflow.
- Whether an Observation may correct, qualify or otherwise relate to a
  Measurement.

## Soft conventions

These are preferred behaviors, but require product confirmation before becoming
enforced invariants:

- Equipment is an independent aggregate owned by the keeper through one
  Aquarium association at a time. Read-only sharing is granted per Aquarium;
  shared ownership is not part of the first workflow.
- Measurements may need timestamp, source and provenance where available.
- Events may need stable identifiers and original time.
- Timeline views should expose stale, cached or pending information clearly.
- Destructive changes may need explicit history when the domain requires
  auditability.

## Future rules

These are likely to matter but must wait for concrete features:

- Sensor calibration and measurement-quality rules.
- Controller safety limits and automation authorization.
- Alert severity, acknowledgement and resolution.
- Sensors, controllers, installation state, failure state and automation
  authority for Equipment.
- Livestock transfer, grouping and identification history are governed by the
  accepted Add Livestock specification; further lifecycle states remain future.
- Species Profiles are globally shared documentary Knowledge, not owned by a
  keeper or Aquarium. Published content is publicly readable; maintenance is
  restricted to a persistent keeper with the Firebase `editorialAdmin: true`
  custom claim, and objective claims require attribution.
- Conflict policy for concurrent edits to domain records.

## Unknown rules

The following are intentionally unresolved:

- The exact component creation, identity and lifecycle flows within the
  AquariumSystem.
- The accepted Livestock slice represents both individuals and groups; species
  taxonomy remains unresolved.
- Whether a Measurement can be corrected through a compensating Event.
- Which parameters are mandatory for each Aquarium classification or component
  role.
- Which domain Events may be created offline.

Do not implement unknown rules by inference. Capture the decision with a domain
specification or ADR when the first affected feature is designed.
