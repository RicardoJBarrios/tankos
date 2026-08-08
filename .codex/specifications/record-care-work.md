# Record Care Work

**Status:** Accepted and implemented as the first Care increment

## User value

The keeper can preserve what they actually did for an Aquarium and later relate
that action to observations and measurements without confusing action with
intention or claiming causality.

## Actor and trigger

The actor is an authenticated aquarium keeper. The trigger is the keeper
choosing to record a completed care action in the selected Aquarium.

## Preconditions

- The keeper has a valid authenticated session.
- An owned Aquarium is present in Active Context.
- The keeper supplies a non-empty description of the action performed.

## Scope

This increment records one manually completed qualitative Care Work action. It
does not plan work, schedule recurrence, complete a Task, send reminders,
notify anyone, automate an action, calculate a dose, or create a Water Change,
Feeding, Maintenance or other subtype with separate semantics.

## Minimum information

- `CareWorkId`, generated internally as an opaque UUID v4;
- `AquariumId` from Active Context;
- the authenticated keeper as owner and recorder;
- a non-empty trimmed description;
- `performedAt`, supplied by the keeper and defaulted to the current time by the
  application when appropriate;
- `recordedAt`, generated when Veril accepts the record;
- provenance `manual`.

`performedAt` and `recordedAt` are distinct because care may be recorded after
the action happened. No volume, amount, subject, equipment, livestock,
parameter, result, attachment or category is required by this increment.

## Main flow

1. The application requires an authenticated keeper.
2. It requires the current Active Context.
3. It validates and trims the description and validates the performed time.
4. It records the Care Work for the selected owned Aquarium.
5. It confirms that the action was saved.

## Success result

One durable Care Work record exists for the selected Aquarium. It is evidence
of an intentional action, attributed to the keeper and retaining both action
time and recording time.

## Expected failures

- no authenticated session: recording is rejected;
- no Active Context: recording is rejected without a write;
- empty or whitespace-only description: validation fails;
- invalid performed time: validation fails;
- unavailable or unauthorized Aquarium: recording is rejected by the
  application boundary and Firestore Rules;
- malformed external data or infrastructure failure: the action is not shown
  as saved and the UI offers a recoverable error.

## Domain classification

Care Work is an independent aggregate root and durable Fact that references
`AquariumId`. It is not part of the Aquarium aggregate consistency boundary.
It is not an Observation: an Observation describes a perceived condition,
whereas Care Work describes an intentional action.

For example:

- Observation: “El skimmer produce menos espuma.”
- Care Work: “Limpié la copa del skimmer.”

Recording Care Work does not automatically create a Domain Event. A future use
case may classify a particular action as a Domain Event only when it has
independent historical or business meaning. No event framework is introduced.

## Business rules

- A Care Work record belongs to exactly one Aquarium in this increment.
- Only the owning keeper may record it.
- Records are append-only; editing, deletion and correction are deferred.
- The original evidence must not be silently overwritten.
- Active Context chooses the Aquarium but is not authorization.

## Description and catalogue

The first increment uses free text only. A closed Care Type catalogue is not
justified yet: the corpus demonstrates varied work, but does not prove that a
small fixed taxonomy would improve capture enough to offset its vocabulary and
evolution cost. Future categorization may be added by a separate use case.

## Planning relationship

Completed Care Work and planned work are separate concepts for now:

- Care Work records something performed.
- planned work records an intention and may later need lifecycle, recurrence,
  cancellation and reminder semantics.

Whether a future planned record links to completed Care Work, becomes the same
entity lifecycle or remains separate is intentionally unresolved. This slice
does not introduce `Task` or `PlannedCareWork`.

## Persistence and authorization

If implemented, Care Work uses a dedicated top-level `careWorks` collection.
The document identifier is `CareWorkId`; `ownerId` remains an authorization
field at the persistence boundary. Firestore Rules authorize authenticated
owners through the referenced Aquarium. Care Work is not nested in the
Aquarium document and does not duplicate Timeline entries.

The operation is online-required. No offline queue, optimistic success or
synchronization policy is introduced.

## Future Timeline relationship

Care Work would later be a third Timeline source. Its natural read-model
mapping is `effectiveAt = performedAt`; `recordedAt` remains available for
traceability and deterministic ordering. This does not change the current
Timeline implementation or add a Care source before Care Work exists.

## UX language and capture

The canonical user-facing action is **Registrar cuidado**. The form remains
minimal: a description, performed date/time and save action. It reuses the
existing Material 3 foundation and established no-context, loading, validation,
success and recoverable-error patterns.

The selected-Aquarium workflow may expose this action beside the existing
Observation, Measurement and recent-activity actions. If that action surface
becomes difficult to scan, navigation restructuring is a separate UX decision;
this slice does not create a Dashboard.

## Testing path

- Domain: identity, description and time/provenance validation;
- application: authentication, Active Context, success, validation and
  infrastructure failure;
- adapter: persistence shape, timestamps, provenance and Zod boundary;
- Rules: owner access, unauthenticated rejection and cross-owner rejection;
- Angular: no context, valid capture, validation, pending, success and error;
- E2E: record Care Work through the UI once the slice is implemented.

Timeline E2E coverage remains deferred until Care Work is actually included in
the Timeline read model.

## Definition of Ready

The first Care increment is ready for implementation because its user value,
action-vs-intention boundary, minimum data, ownership, Fact semantics,
timestamps, provenance, correction policy, persistence direction, UX scope and
proportional testing path are explicit. Planning, taxonomy, automation and
current-state semantics remain deliberately outside the slice.
