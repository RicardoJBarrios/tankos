# Select an Aquarium

**Status:** Accepted

## User value

After seeing their Aquariums, the keeper needs to enter one precise care
context. This prevents later records, observations and actions from being
associated with the wrong Aquarium.

This use case selects one existing private Aquarium. It does not create,
change, publish, share or summarize the Aquarium.

## Actor

An authenticated aquarium keeper.

For the MVP, Firebase Anonymous Auth is an accepted application identity
mechanism. It is not a domain identity model; account linking, recovery and
collaboration remain deferred.

## Trigger

The keeper chooses one Aquarium from the set returned by `List My Aquariums`.

## Preconditions

- The keeper has a valid authenticated application session.
- The Aquarium exists and is owned by the authenticated keeper.
- The Aquarium has already been established successfully.

If the keeper owns no Aquariums, there is no Aquarium to access and this use
case cannot start.

## Main flow

1. The application receives the selected `AquariumId`.
2. It verifies the Aquarium through an owner-scoped read.
3. Firestore Security Rules authoritatively verify ownership.
4. The application establishes that Aquarium as the Active Context.
5. Subsequent Aquarium-scoped operations use that Active Context until it is
   replaced or cleared.

## Success result

The application holds an Active Context identifying the selected `AquariumId`.
The selected Aquarium becomes the target for later Aquarium-scoped use cases.

Active Context does not hydrate or replace the `Aquarium` aggregate. It is an
application selection containing the minimum identity needed to scope later
operations.

## Observable behaviour

- The selected Aquarium is visibly identified as the current care context.
- A second selection replaces the previous Active Context.
- The selection does not create a Dashboard, Timeline, Measurement, Livestock,
  Equipment or public-presentation experience.
- The selection does not change the Aquarium or create a historical record.
- The keeper can return to the Aquarium list and select another Aquarium.

## Expected failures

- No authenticated session: access is rejected and no context is established.
- The Aquarium does not exist: no context is established.
- The Aquarium is owned by another keeper: access is rejected and no context is
  established.
- The persisted document is malformed: boundary validation fails and no
  context is established.
- Firebase or infrastructure failure: the previous context is not silently
  replaced by an invalid one; the application reports a recoverable error.

The UI may present missing and unauthorized private Aquariums with the same
safe unavailable result so that it does not reveal whether another keeper's
Aquarium exists.

## Business rules

- Only an existing Aquarium can become Active Context.
- A keeper may access only an Aquarium they own in the current version.
- Active Context identifies scope; it does not grant authorization.
- Selecting an Aquarium does not create a new Aquarium or alter its state.
- The selection is replaceable and does not create a second simultaneous
  context within one application session.

These are application/use-case rules for context selection. They do not add a
new invariant to the `Aquarium` aggregate.

## Security and authorization

The authenticated keeper identity is obtained from the existing keeper session.
The read is restricted to the selected document and the authenticated owner.
Firestore Security Rules remain authoritative; client-side navigation guards,
route parameters and list membership are not authorization.

No public access is introduced. No collaboration, membership or role model is
introduced. Anonymous-authenticated MVP keepers are treated as authenticated
for the same owner-only rule.

## Active Context

Active Context is application state, not domain state.

### Ownership

The current application session owns the context. The keeper owns the
Aquarium, but does not own an Active Context as a domain entity. Authorization
continues to come from the authenticated keeper and Firestore Rules.

### Lifecycle

- Initial state: no Active Context.
- Successful access: set the selected `AquariumId`.
- New successful access: replace the previous `AquariumId`.
- Logout or invalid authentication: clear the context.
- Missing, unauthorized or malformed Aquarium: do not establish a context;
  clear any context that points to the failed selection.
- Explicit return to the Aquarium list: clear the context only when the
  application leaves Aquarium-scoped work; the exact navigation control is a
  UI decision, not a domain rule.

### Persistence and refresh

For the MVP, Active Context persists only as a tab-scoped `sessionStorage`
hint. It is not a Firestore document, a durable user preference, domain state
or authorization. On private-shell initialization, the application restores it
only after the session identity and an owner-scoped read verify that the stored
`AquariumId` remains available. Malformed, missing, unauthorized or failed
restoration clears the hint and leaves no Active Context.

Anonymous Auth uses Firebase session persistence, so the same anonymous keeper
is restored after a refresh in the same tab. Both authentication and the hint
are cleared when the page session ends. Normal navigation must still use Angular
routing; it does not need a restoration cycle.

### Multiple tabs

Each browser tab has independent session-scoped authentication and Active
Context. Selecting an Aquarium in one tab never synchronizes a change to
another. Browser opener/duplicate-tab behavior may copy the initial session
storage value; Veril treats that as a new untrusted hint and validates ownership
before use. Cross-tab synchronization is deferred until a concrete multi-tab
workflow requires it.

### No Aquarium and deleted Aquarium

When the keeper owns no Aquariums, the application remains without context and
offers the already accepted `Establish Aquarium` action.

If a selected Aquarium is deleted or becomes unavailable before access is
completed, the application clears the stale selection and reports that the
Aquarium is unavailable. It does not restore or recreate it automatically.

## Domain classification

`Select an Aquarium` is an application query plus an application-state
transition. It is not a domain Command because it does not change the
`Aquarium` aggregate.

It creates no Domain Event and no new Fact. Selection is not a business
occurrence with independent historical meaning; recording an access event
would add history without a product need or accepted audit policy.

It does not introduce an Observation, Measurement, Interpretation, Timeline
entry or Knowledge record.

## Persistence

No Firestore schema evolution is required.

The existing `aquariums` documents remain the source for the owner-scoped
verification. The adapter uses the existing document identifier, `ownerId`,
`name` and accepted persistence contract. External data is validated at the
adapter boundary before the application establishes context.

The implementation may add only the narrowest read operation needed to verify
one owned Aquarium through the existing port boundary. It must not introduce a
generic repository, projection, event store, context collection or schema
version solely for this use case.

No remote schema changes are required; the only persisted value is the
tab-scoped browser restoration hint.

## UX states

- **Restoring:** private routes wait while an existing tab hint is revalidated;
  no Aquarium-scoped action is available yet.
- **Loading:** the selected Aquarium is being verified; no new context is
  presented as active yet.
- **Empty:** there are no owned Aquariums; offer `Establish Aquarium`.
- **Not found:** the selected Aquarium is unavailable; keep no Active Context
  and offer a return to the owned Aquarium list.
- **Unauthorized:** do not expose ownership details; present the same safe
  unavailable outcome and keep no Active Context.
- **Error:** explain that the Aquarium could not be accessed and allow a
  recoverable return/retry path.
- **Successful selection:** identify the selected Aquarium as the current care
  context without rendering Dashboard behavior.

No Dashboard, Timeline, summary metrics, care data or future feature surface is
part of this slice.

## Testing strategy

### Application tests

Cover authenticated success, context assignment, context replacement,
unauthenticated failure, missing/unauthorized failure, malformed-data failure
and infrastructure failure. Verify that failed access never leaves an invalid
context active.

### Infrastructure tests

Execute the real Firestore adapter boundary with an owner-scoped single-
Aquarium read. Validate the persisted DTO with Zod and map only the data needed
to establish context. Keep malformed external data coverage at the repository
boundary without weakening Rules.

### Security Rules tests

Verify owner access, unauthenticated denial and cross-owner denial for the
single-document read. Rules must enforce ownership and contain no context or
business logic.

### Angular tests

If a selection component is introduced, use Spectator and Vitest to cover
loading, success, replacement, empty, unavailable and recoverable error states.
Keep context state local to the feature; Signal Store is not required.

### Integration and E2E

Keep Firebase SDK adapter tests against Auth and Firestore Emulator Suite.
Browser E2E proves the meaningful browser-only lifecycle: an owned selection
survives refresh in the same tab and remains safe to use in later routes.

## Architecture impact

This slice keeps `Aquarium` as the aggregate root and adds no aggregate
boundary. It requires no Signal Store, CQRS, projections, Timeline,
Measurements, Nx library or new Firebase configuration.

The only expected application boundary is the existing keeper-session and
Aquarium read-port boundary. A narrow single-Aquarium read method is justified
by the owner-scoped verification requirement; a generic repository is not.

## Deferred decisions

- The destination UI after context selection.
- Dashboard, Timeline, Measurements, Livestock and Equipment features.
- Trusted-device and offline context policies.
- Cross-tab context synchronization.
- Collaboration, memberships and shared access.
- Account linking and recovery for Anonymous Auth.
- Access auditing or an `AquariumAccessed` event.
- Deletion, archival and recovery policies beyond reporting an unavailable
  Aquarium.

## Definition of Ready assessment

| Mandatory criterion                          | Result | Evidence                                                                                                                                                           |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accepted status, actor and value             | Ready  | Status, keeper actor and the single problem of entering one owned Aquarium are explicit.                                                                           |
| Scope, preconditions, outcome and failures   | Ready  | Selection is separated from establishment, listing and future Aquarium features; success and failure states are bounded.                                           |
| Terminology, rules and invariants            | Ready  | Aquarium remains the aggregate root; Active Context is explicitly application state; owner-only access is explicit.                                                |
| Persistence, authorization and offline class | Ready  | Existing `aquariums` documents and owner-scoped read are sufficient; Rules remain authoritative; a session-scoped browser hint is revalidated and online-required. |
| Domain/event boundary                        | Ready  | No Command, Domain Event or Fact is invented for application selection.                                                                                            |
| UX and navigation scope                      | Ready  | Loading, empty, unavailable, unauthorized, error and success are defined without Dashboard behavior.                                                               |
| Architecture and smallest path               | Ready  | No new schema, collection, repository family, Signal Store, CQRS, projection or Nx library is required.                                                            |
| Testing and delivery path                    | Ready  | Application, adapter, Rules and proportional Angular/integration tests are identified.                                                                             |
| Open questions                               | Ready  | Trusted devices, cross-tab synchronization, destination UI, collaboration and audit are explicitly deferred and non-blocking.                                      |

## Accepted decisions

- `Select an Aquarium` is the next use case after `List My Aquariums`.
- It restores a session-scoped, per-tab Active Context for one owned Aquarium only after ownership is revalidated.
- It verifies ownership before setting context.
- It adds no Firestore schema; its browser hint is never authorization or a source of truth.
- It creates no domain event or historical Fact.
