# Configure Aquarium Timezone

**Status:** Accepted and implemented on the Spark-first baseline.

## Actor and product value

An authenticated keeper configures the canonical IANA timezone of an Aquarium
that does not have one yet. This lets Veril present the Aquarium's history and
future Care schedule consistently without depending on the browser or on the
keeper's travel location.

## Scope

This increment supports exactly one transition:

```text
Aquarium.timeZone = undefined
    → Aquarium.timeZone = confirmed IANA timezone
```

It does not support changing or clearing an existing timezone. Timezone
correction, physical relocation and their effect on existing schedules are a
separate future capability and must not be exposed through a generic Aquarium
update operation.

## Preconditions

- The keeper is authenticated.
- An Aquarium is selected in Active Context.
- The keeper owns that Aquarium.
- The Aquarium exists and has no `timeZone`.
- The browser can validate the proposed IANA identifier through the platform
  internationalization APIs.

Active Context identifies the target but is not authorization. Firestore Rules
remain authoritative for ownership and the one-way missing-to-configured
update.

## Main flow

1. Veril detects that the selected Aquarium has no configured timezone.
2. The UI proposes the browser's resolved IANA timezone when available.
3. The keeper reviews and explicitly confirms the proposed timezone, or selects
   another supported IANA identifier.
4. Veril validates the identifier with the existing domain timezone validation.
5. The application updates only `Aquarium.timeZone`.
6. The Aquarium is reloaded or the current route is re-entered.
7. Subsequent user-visible timestamps use the Aquarium timezone instead of the
   browser fallback.

## Configuration semantics

Configuring the timezone establishes the Aquarium's canonical presentation and
calendar authority. It does not:

- rewrite historical Measurements, Observations or Care records;
- change any persisted absolute instant;
- create a Fact or Domain Event;
- modify a RecurringCarePlan;
- recalculate an existing PlannedCareWork;
- copy the timezone into dependent records.

Historical timestamps may therefore appear at a different local clock value
after configuration. This is an intentional correction of presentation
context, while the underlying instant remains unchanged.

## Timezone selection and validation

The domain stores an opaque IANA identifier, not an offset, locale or product
enum. The preferred UI source is a platform-supported list obtained through
`Intl.supportedValuesOf('timeZone')` when that API is available. The UI must
feature-detect it; a compatibility fallback may accept an explicitly entered
identifier and validate it with `Intl.DateTimeFormat`.

The browser's `resolvedOptions().timeZone` value is only a proposal. It is never
persisted without explicit keeper confirmation. The application does not own a
timezone catalogue.

## Existing and future Care

This operation has no recurrence migration semantics because it is only
available before a timezone exists. Existing manual and recurring
`PlannedCareWork` records remain unchanged.

Once configured, future recurring advancement uses the Aquarium timezone that
already governs the recurring Care model. No per-plan timezone is introduced.

Changing an existing timezone remains unresolved and explicitly deferred. A
future change capability must decide separately whether it represents a
correction or relocation, whether existing concrete plans preserve their
absolute `plannedFor`, how future recurrence preserves its local weekday/time,
and what happens to the outstanding recurring occurrence.

## Persistence and consistency

- No new collection, field or index is required; `Aquarium.timeZone` already
  exists.
- Only the owning Aquarium document is updated.
- The update must be rejected if the Aquarium is missing, not owned, already
  configured or contains an invalid external value.
- No background read, migration, Function, Scheduler or backend job is needed.
- The operation is online-required.

At expected personal-scale volume, the operation requires one owner-scoped
Aquarium read/validation and one document update, with no reads of recurrence or
planned-care collections.

## UX states

- **Missing timezone:** explain that timestamps currently use a temporary
  browser fallback and offer `Configurar zona horaria`.
- **Proposal:** show the detected timezone and require explicit confirmation.
- **Selection:** allow choosing another platform-supported IANA timezone.
- **Saving:** expose a pending state and prevent duplicate submission.
- **Success:** confirm the configured timezone and explain that Aquarium times
  now use it.
- **Already configured:** do not show configuration as an available action.
- **Not found/unauthorized:** use the established safe recovery state.
- **Infrastructure failure:** preserve the missing-timezone state and offer a
  retry without claiming success.

The Workspace may show the configured timezone near Aquarium identity because
all displayed times depend on it. `Mis acuarios` does not need timezone metadata
for this increment.

## Security and rules

The keeper may configure only an owned Aquarium. A wrong timezone affects that
keeper's presentation and future Care scheduling; it does not grant access to
another Aquarium. Rules need only enforce authentication, ownership, one-way
field scope and non-empty string structure. IANA calendar semantics remain an
application/domain concern, not Rules logic.

## Active Context and state

Active Context remains only `AquariumId`. Timezone is Aquarium data, not shared
application state. Route re-entry or a normal reload is sufficient to refresh
presentation. No event bus, global cache, Signal Store or live cross-tab
invalidation is required.

If a recurrence form is already open, changing configuration is out of scope;
the form is not live-synchronized. The existing `datetime-local` behavior
continues to use the configured Aquarium timezone when the form is opened.

## Testing

- **Domain/application:** valid and invalid IANA values, missing timezone,
  explicit confirmation, authentication, Active Context, ownership and
  already-configured rejection.
- **Infrastructure:** one-field persistence, malformed timezone rejection and
  owner-scoped read/update behavior.
- **Rules:** owner may configure a missing timezone; anonymous, other-owner and
  already-configured updates are denied.
- **Angular:** proposal, explicit confirmation, alternate selection, pending,
  success and recoverable error states.
- **E2E:** configure an Aquarium timezone and verify a timestamp remains
  Aquarium-local when the browser timezone differs.

No test may imply that historical instants or recurring data were rewritten.

## Deferred decisions

- Changing an already configured timezone.
- Distinguishing correction from physical relocation.
- Preserving or recalculating existing manual plans on timezone change.
- Recalculating an outstanding recurring occurrence on timezone change.
- Locale preferences, Notifications and trusted background delivery.

## Definition of Ready assessment

| Criterion                      | Result | Evidence                                                                              |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------- |
| Product value, actor and scope | Ready  | Configure-only transition and keeper value are explicit.                              |
| Domain language and authority  | Ready  | `Aquarium.timeZone` is the canonical IANA value; Active Context is not authorization. |
| Configure vs change boundary   | Ready  | Existing timezone changes are explicitly out of scope.                                |
| Persistence and ownership      | Ready  | One existing Aquarium field, owner-scoped update, no new collection or migration.     |
| Recurrence interaction         | Ready  | No existing plans are touched; future advancement reuses Aquarium authority.          |
| UX and validation              | Ready  | Proposal, confirmation, platform selection and IANA validation are defined.           |
| Security, offline and testing  | Ready  | Online-required, Rules boundary and proportional test layers are explicit.            |
