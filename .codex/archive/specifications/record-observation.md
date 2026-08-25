# Record an Observation

**Status:** Accepted and implemented.

## User value

The keeper can preserve a concise, contextual account of something noticed in
an Aquarium and return to that evidence later. This validates TankOS's core
promise of understanding care through recorded context rather than isolated
data.

## Actor

An authenticated aquarium keeper using an owned Aquarium.

For the MVP, Firebase Anonymous Auth is an accepted application identity
mechanism. It is not a domain identity model.

## Trigger

The keeper chooses to record an observation while an owned Aquarium is the
Active Context.

## Preconditions

- The keeper has a valid authenticated session.
- An owned Aquarium is selected as Active Context.
- The observation text is supplied by the keeper.

## Scope

This slice records only a manual qualitative observation. It does not record a
Measurement, Parameter, unit, photo, Livestock, Equipment, Care Work,
Interpretation or Timeline entry.

## Minimum information

- the Active `AquariumId`;
- non-empty observation text;
- the authenticated keeper as owner and recorder;
- `recordedAt`, generated when the observation is submitted.

The MVP does not ask for a separate observed-at time. A later use case may add
that distinction when retrospective recording is required.

## Main flow

1. The application requires an authenticated keeper.
2. It requires the current Active Context.
3. It validates and trims the observation text.
4. It records the observation for the selected owned Aquarium.
5. It confirms that the observation was saved.

## Success result

One durable qualitative Observation exists for the selected Aquarium. It is
attributed to the authenticated keeper and has a recording timestamp.

## Expected failures

- no authenticated session: recording is rejected;
- no Active Context: recording is rejected;
- empty or whitespace-only text: validation fails;
- unavailable or unauthorized Aquarium: recording is rejected by the
  application boundary and Firestore Rules;
- malformed external data or infrastructure failure: the observation is not
  presented as saved and the UI offers a recoverable error.

## Business and domain rules

- An Observation belongs to exactly one Aquarium for this slice.
- Only the owning keeper may record an Observation.
- A persisted Observation constitutes durable evidence (a Fact), not an
  Interpretation or guaranteed statement of the Aquarium's complete state.
- Recording an Observation does not alter the Aquarium aggregate.
- Recording an Observation does not automatically create a Domain Event. A
  future accepted use case may classify an Observation as a Domain Event only
  when it has independent historical meaning.

## Persistence and authorization

Observations are stored in a dedicated `observations` collection using the
minimum fields required by this specification. Firestore Rules remain
authoritative and verify authentication, owner identity and ownership of the
referenced Aquarium. Updates and deletes are not part of this slice.

Active Context is only the client-side scope used to choose the Aquarium; it is
not an authorization mechanism.

## Offline

The operation is online-required. No offline queue, local persistence,
optimistic success or synchronization policy is introduced.

## UX

- show the selected Aquarium context;
- provide one labelled text field and a save action;
- show loading while saving;
- show an accessible validation message for empty text;
- show a recoverable error when saving fails;
- show a concise confirmation after success.

No history screen, Timeline, Dashboard or observation list is introduced.

## Testing and Definition of Ready

| Criterion                       | Result | Evidence                                                                             |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Actor, value and bounded scope  | Ready  | Authenticated keeper records one qualitative Observation in the Active Context.      |
| Minimum data and validation     | Ready  | AquariumId, owner/recorder, non-empty text and generated recordedAt are explicit.    |
| Ownership and authorization     | Ready  | Existing auth plus owner-scoped Firestore Rules are authoritative.                   |
| Persistence and offline class   | Ready  | One observations collection, append-only MVP write, online-required.                 |
| Application and domain boundary | Ready  | Pure use case and domain validation; Firebase and Angular remain at the edges.       |
| UX and failures                 | Ready  | Loading, validation, infrastructure failure and success are bounded.                 |
| Testing path                    | Ready  | Domain, application, adapter, Rules and Angular tests; no E2E required.              |
| Deferred scope                  | Ready  | Measurement, Care Work, Timeline, history, subjects and media remain explicitly out. |

## Deferred decisions

- separate observed-at time for retrospective notes;
- correction, editing, deletion and retention policy;
- subject association with Livestock or Equipment;
- photos and attachments;
- Observation list, Timeline projection and search;
- offline recording and synchronization;
- whether a future accepted use case classifies this fact as a named Domain
  Event.
