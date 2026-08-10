# Domain Rules

This document describes business truths, not architecture or implementation.
Rules are classified to avoid turning assumptions into code prematurely.

## Keeper and Aquarium cardinality

- A keeper may own or manage zero, one or many independent Aquariums.
- Each Aquarium is an independent aggregate root.
- In the first version, each Aquarium has one owning keeper; collaboration,
  memberships and roles are deferred.

## Accepted rules for Establish an Aquarium

- An authenticated keeper may establish any number of independent private
  Aquariums. Each Aquarium has one owning keeper in this first version.
- Establishment requires only an Aquarium name. It creates no Display, System,
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
  not block Aquarium-owned Workspace capabilities.

## Candidate invariants requiring validation

Other business invariants remain unaccepted. The following hypotheses must be
decided in a use-case specification before code, Rules, events or persistence
enforce them:

- Whether an Aquarium is the ownership boundary for Measurements.
- Whether Measurements are immutable, editable or corrected by compensation.
- Whether Livestock can belong to one or multiple Aquariums over time.
- Whether Water Change is a distinct domain Event.
- Whether an Observation may correct, qualify or otherwise relate to a
  Measurement.

## Soft conventions

These are preferred behaviors, but require product confirmation before becoming
enforced invariants:

- Equipment may be shared by more than one Aquarium when ownership allows it.
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
- Shared equipment ownership and permissions.
- Livestock transfer, grouping and identification history.
- Conflict policy for concurrent edits to domain records.

## Unknown rules

The following are intentionally unresolved:

- Whether `Display` requires its own identity or lifecycle within the Aquarium
  aggregate.
- Whether Fish or Coral can be represented as groups as well as individuals.
- Whether a Measurement can be corrected through a compensating Event.
- Whether users can share an Aquarium and at what permission levels.
- Which parameters are mandatory for each type of Aquarium.
- Which domain Events may be created offline.

Do not implement unknown rules by inference. Capture the decision with a domain
specification or ADR when the first affected feature is designed.
